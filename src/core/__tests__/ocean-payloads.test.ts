import { describe, expect, it } from 'vitest';
import {
  buildCompanyDataMapping,
  buildPeopleDataMapping,
  buildSearchCompaniesV2Body,
  buildSearchPeopleV2Body,
  normalizeCompaniesFilters,
  normalizeCompaniesFiltersV2,
  normalizePeopleFiltersV2,
} from '../ocean-payloads.js';

describe('normalizeCompaniesFilters', () => {
  it('maps domains to includeDomains', () => {
    expect(normalizeCompaniesFilters({ domains: ['calendly.com'] })).toEqual({
      includeDomains: ['calendly.com'],
    });
  });

  it('maps headcountMin/Max to employeeCountLinkedin and companySizes', () => {
    const result = normalizeCompaniesFilters({ headcountMin: 100, headcountMax: 500 });
    expect(result.employeeCountLinkedin).toEqual({ from: 100, to: 500 });
    expect(result.companySizes).toContain('51-200');
    expect(result.companySizes).toContain('201-500');
    expect(result).not.toHaveProperty('headcountMin');
    expect(result).not.toHaveProperty('headcountMax');
  });

  it('preserves fields the API already accepts', () => {
    expect(normalizeCompaniesFilters({ industries: ['SaaS'], countries: ['us'] })).toEqual({
      industries: ['SaaS'],
      countries: ['us'],
    });
  });
});

describe('buildCompanyDataMapping', () => {
  it('builds keyed mapping with normalized domains', () => {
    expect(buildCompanyDataMapping(['https://Stripe.com/'])).toEqual({
      'stripe.com': { company: { domain: 'stripe.com' } },
    });
  });
});

describe('buildPeopleDataMapping', () => {
  it('maps linkedin URLs and ocean IDs', () => {
    const mapping = buildPeopleDataMapping({
      linkedinUrls: ['https://www.linkedin.com/in/jane-doe'],
      oceanIds: ['abc123'],
    });
    expect(mapping['linkedin.com/in/jane-doe']).toEqual({
      person: { linkedin: 'linkedin.com/in/jane-doe' },
    });
    expect(mapping['abc123']).toEqual({ person: { id: 'abc123' } });
  });
});

describe('normalizeCompaniesFiltersV2', () => {
  it('wraps bare industries array for v2 IndustriesFilter', () => {
    expect(normalizeCompaniesFiltersV2({ industries: ['Technology'] })).toEqual({
      industries: { industries: ['Technology'], mode: 'anyOf' },
    });
  });

  it('maps industry alias to industries filter', () => {
    expect(normalizeCompaniesFiltersV2({ industry: ['SaaS'] })).toEqual({
      industries: { industries: ['SaaS'], mode: 'anyOf' },
    });
  });
});

describe('normalizePeopleFiltersV2', () => {
  it('maps jobTitle to jobTitles', () => {
    expect(normalizePeopleFiltersV2({ jobTitle: ['CEO'] })).toEqual({
      jobTitles: ['CEO'],
    });
  });
});

describe('buildSearchCompaniesV2Body', () => {
  it('nests filters under companiesFilters and maps limit/skip to size/from', () => {
    expect(
      buildSearchCompaniesV2Body({
        filters: { domains: ['acme.com'] },
        limit: 10,
        skip: 5,
      }),
    ).toEqual({
      companiesFilters: { includeDomains: ['acme.com'] },
      size: 10,
      from: 5,
    });
  });
});

describe('buildSearchPeopleV2Body', () => {
  it('nests people filters under peopleFilters and maps limit to size', () => {
    expect(
      buildSearchPeopleV2Body({
        filters: { jobTitle: ['CEO'] },
        limit: 20,
      }),
    ).toEqual({
      peopleFilters: { jobTitles: ['CEO'] },
      size: 20,
    });
  });
});
