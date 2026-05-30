import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  assertValidOutputFormat,
  formatInputValidationError,
  isValidDomain,
  nonEmptyCsvOrArray,
  nonEmptyString,
  parseJsonOptionFields,
  positiveLimit,
  validDomainsCsvOrArray,
} from '../validation.js';
import type { CommandDefinition } from '../types.js';
import { lookupPeopleCommand } from '../../commands/lookup/people.js';
import { enrichPeopleCommand } from '../../commands/enrich/people.js';
import { revealEmailsCommand } from '../../commands/reveal/emails.js';
import { enrichCompanyCommand } from '../../commands/enrich/company.js';

describe('assertValidOutputFormat', () => {
  it('accepts json and pretty', () => {
    expect(() => assertValidOutputFormat('json')).not.toThrow();
    expect(() => assertValidOutputFormat('pretty')).not.toThrow();
  });

  it('rejects unknown formats', () => {
    expect(() => assertValidOutputFormat('csv')).toThrow(/Invalid output format/);
  });
});

describe('formatInputValidationError', () => {
  it('lists all missing required options', () => {
    const schema = z.object({
      oceanIds: z.union([z.array(z.string()), z.string()]),
      webhookUrl: z.string().url(),
    });
    const parsed = schema.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const err = formatInputValidationError(parsed.error);
      expect(err.message).toContain('--ocean-ids');
      expect(err.message).toContain('--webhook-url');
    }
  });
});

describe('parseJsonOptionFields', () => {
  const cmdDef = {
    cliMappings: {
      options: [{ field: 'companiesFilters', flags: '--companies-filters <json>' }],
    },
  } as CommandDefinition;

  it('parses valid JSON strings before auth', () => {
    const result = parseJsonOptionFields(
      { companiesFilters: '{"domains":["a.com"]}' },
      cmdDef,
    );
    expect(result.companiesFilters).toEqual({ domains: ['a.com'] });
  });

  it('throws on invalid JSON', () => {
    expect(() =>
      parseJsonOptionFields({ companiesFilters: 'not-json' }, cmdDef),
    ).toThrow(/Invalid JSON for --companies-filters/);
  });
});

describe('nonEmptyCsvOrArray', () => {
  const schema = z.object({ ids: nonEmptyCsvOrArray('At least one ID is required (--ocean-ids)') });

  it('rejects empty string before auth', () => {
    const parsed = schema.safeParse({ ids: '' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatInputValidationError(parsed.error).message).toContain('--ocean-ids');
    }
  });

  it('accepts non-empty CSV', () => {
    expect(schema.safeParse({ ids: 'a,b' }).success).toBe(true);
  });
});

describe('nonEmptyString', () => {
  it('rejects blank domain', () => {
    const schema = z.object({ domain: nonEmptyString('Domain must not be empty (--domain)') });
    const parsed = schema.safeParse({ domain: '   ' });
    expect(parsed.success).toBe(false);
  });
});

describe('isValidDomain', () => {
  it('accepts plain and URL-style domains', () => {
    expect(isValidDomain('acme.com')).toBe(true);
    expect(isValidDomain('https://www.tesla.com/about')).toBe(true);
    expect(isValidDomain('sub.domain.co.uk')).toBe(true);
  });

  it('rejects nonsense domains', () => {
    expect(isValidDomain('!!!notadomain')).toBe(false);
    expect(isValidDomain('not a domain')).toBe(false);
    expect(isValidDomain('localhost')).toBe(false);
  });
});

describe('domainString', () => {
  it('rejects invalid domain before auth', () => {
    const parsed = enrichCompanyCommand.inputSchema.safeParse({ domain: '!!!notadomain' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatInputValidationError(parsed.error).message).toContain('Invalid domain format');
    }
  });

  it('accepts valid domain', () => {
    expect(enrichCompanyCommand.inputSchema.safeParse({ domain: 'roush.com' }).success).toBe(true);
  });
});

describe('validDomainsCsvOrArray', () => {
  const schema = z.object({
    domains: validDomainsCsvOrArray('At least one domain is required (--domains)'),
  });

  it('rejects CSV with an invalid domain', () => {
    const parsed = schema.safeParse({ domains: 'acme.com,!!!bad' });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatInputValidationError(parsed.error).message).toContain('Invalid domain format');
    }
  });
});

describe('positiveLimit', () => {
  it('rejects zero and negative limits', () => {
    const fail0 = positiveLimit.safeParse(0);
    expect(fail0.success).toBe(false);
    if (!fail0.success) {
      expect(formatInputValidationError(fail0.error).message).toContain('positive integer');
    }
    const failNeg = positiveLimit.safeParse(-1);
    expect(failNeg.success).toBe(false);
  });

  it('rejects non-numeric limit with a clear message', () => {
    const parsed = positiveLimit.safeParse('abc');
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const msg = formatInputValidationError(parsed.error).message;
      expect(msg).toBe('--limit must be a number');
      expect(msg).not.toContain('Invalid input: limit: Invalid input');
    }
  });

  it('accepts positive integers and undefined', () => {
    expect(positiveLimit.safeParse(10).success).toBe(true);
    expect(positiveLimit.safeParse(undefined).success).toBe(true);
  });
});

describe('command schemas (no-api-key validation)', () => {
  it('lookup people with no args reports missing identifiers', () => {
    const parsed = lookupPeopleCommand.inputSchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatInputValidationError(parsed.error).message).toContain('--linkedin-handles');
    }
  });

  it('enrich people with no args reports all missing options', () => {
    const parsed = enrichPeopleCommand.inputSchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const msg = formatInputValidationError(parsed.error).message;
      expect(msg).toContain('--webhook-url');
      expect(msg).toContain('--linkedin-urls or --ocean-ids');
    }
  });

  it('reveal emails rejects empty ocean-ids', () => {
    const parsed = revealEmailsCommand.inputSchema.safeParse({
      oceanIds: '',
      webhookUrl: 'https://example.com/hook',
    });
    expect(parsed.success).toBe(false);
  });
});
