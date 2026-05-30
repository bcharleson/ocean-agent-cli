import { z, type ZodError } from 'zod';
import { normalizeDomain, parseCsvOrArray } from './ocean-payloads.js';
import type { CommandDefinition, GlobalOptions } from './types.js';

const DOMAIN_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
const DOMAIN_TLD = /^[a-z]{2,63}$/i;

/** Hostname-style domain after stripping protocol, www, and path. */
export function isValidDomain(value: string): boolean {
  const domain = normalizeDomain(value);
  if (!domain || domain.length > 253) return false;

  const parts = domain.split('.');
  if (parts.length < 2) return false;

  const tld = parts[parts.length - 1]!;
  if (!DOMAIN_TLD.test(tld)) return false;

  return parts.every((label) => DOMAIN_LABEL.test(label));
}

/**
 * Plain domain only — rejects URLs users paste from the browser (scheme, path, port).
 * Returns an error message, or null when acceptable.
 */
export function getDomainInputIssue(value: string, flag = '--domain'): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `Domain must not be empty (${flag})`;

  if (/^https:\/\//i.test(trimmed)) {
    return `Invalid domain format (${flag}): remove the https:// prefix. Example: tesla.com`;
  }
  if (/^http:\/\//i.test(trimmed)) {
    return `Invalid domain format (${flag}): remove the http:// prefix. Example: tesla.com`;
  }
  if (/[/\\]/.test(trimmed)) {
    if (/[/\\]$/.test(trimmed)) {
      return `Invalid domain format (${flag}): remove the trailing slash. Example: tesla.com`;
    }
    return `Invalid domain format (${flag}): use the domain only, not a URL path. Example: tesla.com`;
  }
  if (trimmed.includes('@')) {
    return `Invalid domain format (${flag}). Example: acme.com`;
  }
  if (trimmed.includes(':')) {
    return `Invalid domain format (${flag}). Example: acme.com`;
  }
  if (!isValidDomain(trimmed)) {
    return `Invalid domain format (${flag}). Example: acme.com`;
  }
  return null;
}

/** CSV or array option that must contain at least one non-empty value after parsing. */
export function nonEmptyCsvOrArray(message: string) {
  return z.union([z.array(z.string()), z.string()]).refine(
    (value) => parseCsvOrArray(value).length > 0,
    { message },
  );
}

/** Required string option that must not be blank. */
export function nonEmptyString(message: string) {
  return z.string().refine((value) => value.trim().length > 0, { message });
}

/** Required --domain: non-empty plain hostname (e.g. acme.com), not a full URL. */
export function domainString() {
  return nonEmptyString('Domain must not be empty (--domain)').superRefine((value, ctx) => {
    const issue = getDomainInputIssue(value, '--domain');
    if (issue) {
      ctx.addIssue({ code: 'custom', message: issue });
    }
  });
}

/** Required --domains CSV/array: at least one valid plain hostname. */
export function validDomainsCsvOrArray(emptyMessage: string) {
  return nonEmptyCsvOrArray(emptyMessage).superRefine((value, ctx) => {
    for (const domain of parseCsvOrArray(value)) {
      const issue = getDomainInputIssue(domain, '--domains');
      if (issue) {
        ctx.addIssue({ code: 'custom', message: issue });
        return;
      }
    }
  });
}

/** Optional --company-domain: when set, must be a valid plain hostname. */
export function optionalDomain() {
  return z
    .string()
    .optional()
    .superRefine((value, ctx) => {
      if (value === undefined) return;
      const issue = getDomainInputIssue(value, '--company-domain');
      if (issue) {
        ctx.addIssue({ code: 'custom', message: issue });
      }
    });
}

/** Optional --limit: when provided, must be a positive integer. */
export const positiveLimit = z.preprocess(
  (val) => {
    if (val === undefined || val === null || val === '') return undefined;
    if (typeof val === 'number') return val;
    return Number(val);
  },
  z.any().superRefine((value, ctx) => {
    if (value === undefined) return;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      ctx.addIssue({ code: 'custom', message: '--limit must be a number' });
      return;
    }
    if (!Number.isInteger(value)) {
      ctx.addIssue({ code: 'custom', message: '--limit must be an integer' });
      return;
    }
    if (value <= 0) {
      ctx.addIssue({
        code: 'custom',
        message: '--limit must be a positive integer (greater than 0)',
      });
    }
  }),
);

const OUTPUT_FORMATS = ['json', 'pretty'] as const;

export function normalizeGlobalOptions(
  opts: GlobalOptions & Record<string, unknown>,
): GlobalOptions & Record<string, unknown> {
  if (opts.pretty) {
    opts.output = 'pretty';
  }
  return opts;
}

export function assertValidOutputFormat(format: string | undefined): void {
  if (format === undefined || format === '') return;
  if (!OUTPUT_FORMATS.includes(format as (typeof OUTPUT_FORMATS)[number])) {
    throw new Error(
      `Invalid output format "${format}". Supported formats: ${OUTPUT_FORMATS.join(', ')}`,
    );
  }
}

/** Map Zod validation failures to CLI-friendly errors (all missing fields, not just one). */
export function formatInputValidationError(error: ZodError): Error {
  const missing = new Set<string>();

  for (const issue of error.issues) {
    const field = issue.path?.[0];
    if (field === undefined) continue;

    if (issue.code === 'invalid_type' && String(issue.message).includes('received undefined')) {
      missing.add(String(field));
      continue;
    }

    if (issue.code === 'invalid_union') {
      const variants = (issue as { errors?: Array<Array<{ code?: string; message?: string }>> })
        .errors ?? [];
      const allUndefined = variants.every((branch) =>
        branch.every(
          (sub) =>
            sub.code === 'invalid_type' && String(sub.message).includes('received undefined'),
        ),
      );
      if (allUndefined) {
        missing.add(String(field));
      }
    }
  }

  if (missing.size > 0) {
    const flags = [...missing].map((f) => '--' + camelToKebab(f)).join(', ');
    return new Error(`Missing required option(s): ${flags}`);
  }

  const custom = error.issues.find((i) => i.code === 'custom');
  if (custom?.message) {
    return new Error(custom.message);
  }

  const msg = error.issues
    .map((i) => `${i.path?.join('.') ?? 'input'}: ${i.message}`)
    .join('; ');
  return new Error(`Invalid input: ${msg}`);
}

/** Parse JSON string options before auth/API (fields declared with `<json>` in CLI flags). */
export function parseJsonOptionFields(
  input: Record<string, unknown>,
  cmdDef: CommandDefinition,
): Record<string, unknown> {
  const result = { ...input };
  const jsonFields =
    cmdDef.cliMappings.options
      ?.filter((opt) => opt.flags.includes('<json>'))
      .map((opt) => opt.field) ?? [];

  for (const field of jsonFields) {
    const value = result[field];
    if (typeof value !== 'string') continue;
    const flag = '--' + camelToKebab(field);
    try {
      result[field] = JSON.parse(value);
    } catch {
      throw new Error(`Invalid JSON for ${flag}: unable to parse value`);
    }
  }

  return result;
}

function camelToKebab(name: string): string {
  return name
    .replace(/_/g, '-')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .toLowerCase();
}
