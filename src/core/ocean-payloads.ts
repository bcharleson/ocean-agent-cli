/**
 * Map CLI-friendly filter / bulk-enrich shapes to Ocean.io API request bodies.
 * @see https://app.ocean.io/docs/searchCompaniesV3
 * @see https://app.ocean.io/docs/enrichCompanies
 */

const COMPANY_SIZE_RANGES: Array<{ label: string; min: number; max: number }> = [
  { label: '0-1', min: 0, max: 1 },
  { label: '2-10', min: 2, max: 10 },
  { label: '11-50', min: 11, max: 50 },
  { label: '51-200', min: 51, max: 200 },
  { label: '201-500', min: 201, max: 500 },
  { label: '501-1000', min: 501, max: 1000 },
  { label: '1001-5000', min: 1001, max: 5000 },
  { label: '5001-10000', min: 5001, max: 10000 },
  { label: '10001-50000', min: 10001, max: 50000 },
  { label: '50001-100000', min: 50001, max: 100000 },
  { label: '100001-500000', min: 100001, max: 500000 },
  { label: '500000+', min: 500001, max: Number.MAX_SAFE_INTEGER },
];

/** CLI aliases inside `companiesFilters` → Ocean v3 field names. */
export function normalizeCompaniesFilters(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...filters };

  if ('domains' in out) {
    const domains = out.domains;
    delete out.domains;
    if (Array.isArray(domains) && domains.length > 0) {
      out.includeDomains = domains;
    }
  }

  const headcountMin = out.headcountMin;
  const headcountMax = out.headcountMax;
  if (headcountMin !== undefined || headcountMax !== undefined) {
    delete out.headcountMin;
    delete out.headcountMax;

    const min = headcountMin !== undefined ? Number(headcountMin) : undefined;
    const max = headcountMax !== undefined ? Number(headcountMax) : undefined;

    if (min !== undefined || max !== undefined) {
      const employeeCountLinkedin: Record<string, number> = {};
      if (min !== undefined && !Number.isNaN(min)) employeeCountLinkedin.from = min;
      if (max !== undefined && !Number.isNaN(max)) employeeCountLinkedin.to = max;
      out.employeeCountLinkedin = employeeCountLinkedin;
    }

    const sizes = companySizesForHeadcountRange(min, max);
    if (sizes.length > 0) {
      out.companySizes = sizes;
    }
  }

  return out;
}

function companySizesForHeadcountRange(
  min: number | undefined,
  max: number | undefined,
): string[] {
  const low = min ?? 0;
  const high = max ?? Number.MAX_SAFE_INTEGER;
  return COMPANY_SIZE_RANGES.filter((bucket) => bucket.max >= low && bucket.min <= high).map(
    (b) => b.label,
  );
}

export function buildCompanyDataMapping(
  domains: string[],
): Record<string, { company: { domain: string } }> {
  const mapping: Record<string, { company: { domain: string } }> = {};
  for (const raw of domains) {
    const domain = normalizeDomain(raw);
    if (!domain) continue;
    mapping[domain] = { company: { domain } };
  }
  return mapping;
}

export function buildPeopleDataMapping(input: {
  linkedinUrls?: string[];
  oceanIds?: string[];
}): Record<string, { person: { linkedin?: string; id?: string } }> {
  const mapping: Record<string, { person: { linkedin?: string; id?: string } }> = {};

  for (const raw of input.linkedinUrls ?? []) {
    const linkedin = normalizeLinkedIn(raw);
    if (!linkedin) continue;
    mapping[linkedin] = { person: { linkedin } };
  }

  for (const id of input.oceanIds ?? []) {
    const trimmed = id.trim();
    if (!trimmed) continue;
    mapping[trimmed] = { person: { id: trimmed } };
  }

  return mapping;
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .toLowerCase();
}

function normalizeLinkedIn(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    return `${url.hostname}${url.pathname}`.replace(/^www\./i, '');
  } catch {
    return trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  }
}

export function parseCsvOrArray(value: string | string[]): string[] {
  if (Array.isArray(value)) return value.map((v) => v.trim()).filter(Boolean);
  return value.split(',').map((v) => v.trim()).filter(Boolean);
}

/** v2 CompaniesFiltersV1: industries uses `{ industries, mode }`, not a bare array. */
export function normalizeCompaniesFiltersV2(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const out = normalizeCompaniesFilters(filters);

  if (Array.isArray(out.industry)) {
    out.industries = { industries: out.industry, mode: 'anyOf' };
    delete out.industry;
  } else if (Array.isArray(out.industries)) {
    out.industries = { industries: out.industries, mode: 'anyOf' };
  }

  return out;
}

/** v2 PeopleFilters field aliases (e.g. jobTitle → jobTitles). */
export function normalizePeopleFiltersV2(
  filters: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...filters };

  if (Array.isArray(out.jobTitle)) {
    out.jobTitles = out.jobTitle;
    delete out.jobTitle;
  }

  return out;
}

/**
 * v2 search companies: filters are top-level body fields (not nested under
 * `companiesFilters`). CLI `--limit`/`--skip` map to `size`/`from`.
 */
export function buildSearchCompaniesV2Body(input: {
  filters?: Record<string, unknown>;
  companiesFilters?: Record<string, unknown>;
  limit?: number;
  skip?: number;
  searchAfter?: unknown;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const rawFilters = input.companiesFilters ?? input.filters;
  if (rawFilters && Object.keys(rawFilters).length > 0) {
    Object.assign(body, normalizeCompaniesFiltersV2(rawFilters));
  }
  if (input.limit !== undefined) body.size = input.limit;
  if (input.skip !== undefined) body.from = input.skip;
  if (input.searchAfter !== undefined) body.searchAfter = input.searchAfter;
  return body;
}

/**
 * v2 search people: people + company filter fields are top-level on the body.
 */
export function buildSearchPeopleV2Body(input: {
  filters?: Record<string, unknown>;
  peopleFilters?: Record<string, unknown>;
  companiesFilters?: Record<string, unknown>;
  limit?: number;
  skip?: number;
  searchAfter?: unknown;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  const raw = input.filters ?? input.peopleFilters;
  if (raw && Object.keys(raw).length > 0) {
    Object.assign(body, normalizePeopleFiltersV2(raw));
  }
  if (input.companiesFilters && Object.keys(input.companiesFilters).length > 0) {
    Object.assign(body, normalizeCompaniesFiltersV2(input.companiesFilters));
  }
  if (input.limit !== undefined) body.size = input.limit;
  if (input.skip !== undefined) body.from = input.skip;
  if (input.searchAfter !== undefined) body.searchAfter = input.searchAfter;
  return body;
}
