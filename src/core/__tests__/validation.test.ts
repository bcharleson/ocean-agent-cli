import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  assertValidOutputFormat,
  formatInputValidationError,
  parseJsonOptionFields,
} from '../validation.js';
import type { CommandDefinition } from '../types.js';

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
