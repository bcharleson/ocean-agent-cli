import type { GlobalOptions } from './types.js';
import { formatError } from './errors.js';

export function output(data: unknown, options: GlobalOptions = {}): void {
  if (options.quiet) return;

  let result = data;

  if (options.fields && typeof data === 'object' && data !== null) {
    const fields = options.fields.split(',').map((f) => f.trim());
    result = applyFieldsFilter(data, fields);
  }

  if (options.output === 'pretty') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(JSON.stringify(result));
  }
}

export function outputError(error: unknown, options: GlobalOptions = {}): void {
  const formatted = formatError(error);
  if (options.quiet) {
    process.exitCode = 1;
    return;
  }

  if (options.output === 'pretty') {
    console.error(`Error: ${formatted.message}`);
  } else {
    console.error(JSON.stringify({ error: formatted.message, code: formatted.code }));
  }
  process.exitCode = 1;
}

const SEARCH_RESULT_ARRAY_KEYS = ['companies', 'people'] as const;
const SEARCH_RESULT_WRAPPERS = ['company', 'person'] as const;

function applyFieldsFilter(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFieldsFromSearchItem(item, fields));
  }

  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const record = data as Record<string, unknown>;
  const arrayKey = SEARCH_RESULT_ARRAY_KEYS.find((key) => Array.isArray(record[key]));

  if (arrayKey) {
    const topLevel = pickFields(record, fields);
    const items = (record[arrayKey] as unknown[]).map((item) =>
      pickFieldsFromSearchItem(item, fields),
    );
    return { ...topLevel, [arrayKey]: items };
  }

  return pickFields(record, fields);
}

function pickFieldsFromSearchItem(item: unknown, fields: string[]): Record<string, unknown> {
  if (typeof item !== 'object' || item === null) {
    return {};
  }

  const obj = item as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  for (const field of fields) {
    if (field.includes('.')) {
      const value = getNestedValue(obj, field);
      if (value !== undefined) {
        setNestedValue(result, field, value);
      }
      continue;
    }

    if (field in obj) {
      result[field] = obj[field];
      continue;
    }

    for (const wrapper of SEARCH_RESULT_WRAPPERS) {
      const wrapped = obj[wrapper];
      if (
        wrapped !== null &&
        typeof wrapped === 'object' &&
        field in (wrapped as Record<string, unknown>)
      ) {
        result[field] = (wrapped as Record<string, unknown>)[field];
        break;
      }
    }
  }

  return result;
}

function pickFields(
  obj: Record<string, unknown>,
  fields: string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.includes('.')) {
      const value = getNestedValue(obj, field);
      if (value !== undefined) {
        setNestedValue(result, field, value);
      }
    } else if (field in obj) {
      result[field] = obj[field];
    }
  }
  return result;
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = current[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: any = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] == null || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}
