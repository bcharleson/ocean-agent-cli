import { describe, it, expect } from 'vitest';
import { extractApiErrorMessage, stringifyErrorMessage, ValidationError } from '../errors.js';

describe('stringifyErrorMessage', () => {
  it('JSON-stringifies objects', () => {
    expect(stringifyErrorMessage({ foo: 'bar' })).toBe('{"foo":"bar"}');
  });

  it('never returns [object Object]', () => {
    expect(stringifyErrorMessage({ a: 1 })).not.toBe('[object Object]');
  });
});

describe('extractApiErrorMessage', () => {
  it('extracts string detail', () => {
    expect(extractApiErrorMessage(JSON.stringify({ detail: 'bad token' }))).toBe('bad token');
  });

  it('JSON-stringifies object detail', () => {
    const body = JSON.stringify({ detail: { domains: ['invalid'] } });
    expect(extractApiErrorMessage(body)).toBe('{"domains":["invalid"]}');
  });
});

describe('ValidationError', () => {
  it('accepts object messages via constructor', () => {
    const err = new ValidationError({ field: 'domains', issue: 'required' });
    expect(err.message).toBe('{"field":"domains","issue":"required"}');
    expect(err.code).toBe('VALIDATION_ERROR');
  });
});
