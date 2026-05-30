import { z, type ZodError } from 'zod';
import { parseCsvOrArray } from './ocean-payloads.js';
import type { CommandDefinition, GlobalOptions } from './types.js';

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

/** Optional --limit: when provided, must be a positive integer. */
export const positiveLimit = z.coerce
  .number({ message: 'Invalid input: limit: Invalid input: expected number, received NaN' })
  .int()
  .positive('limit must be a positive integer (greater than 0)')
  .optional();

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
