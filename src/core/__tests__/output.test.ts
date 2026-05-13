import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { output, outputError } from '../output.js';
import { AuthError } from '../errors.js';

describe('output', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  const originalExitCode = process.exitCode;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = originalExitCode;
  });

  it('emits compact JSON by default', () => {
    output({ a: 1, b: 2 });
    expect(logSpy).toHaveBeenCalledWith('{"a":1,"b":2}');
  });

  it('emits pretty JSON when output=pretty', () => {
    output({ a: 1 }, { output: 'pretty' });
    expect(logSpy.mock.calls[0][0]).toContain('\n');
  });

  it('suppresses output when quiet=true', () => {
    output({ a: 1 }, { quiet: true });
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('picks top-level fields', () => {
    output({ a: 1, b: 2, c: 3 }, { fields: 'a,c' });
    expect(logSpy).toHaveBeenCalledWith('{"a":1,"c":3}');
  });

  it('picks nested fields with dot paths', () => {
    output(
      { person: { firstName: 'Ada', lastName: 'L' }, meta: { id: 'x' } },
      { fields: 'person.firstName,meta.id' },
    );
    expect(logSpy).toHaveBeenCalledWith('{"person":{"firstName":"Ada"},"meta":{"id":"x"}}');
  });

  it('applies fields to each item when data is an array', () => {
    output([{ a: 1, b: 2 }, { a: 3, b: 4 }], { fields: 'a' });
    expect(logSpy).toHaveBeenCalledWith('[{"a":1},{"a":3}]');
  });

  it('omits undefined nested paths', () => {
    output({ a: { b: 1 } }, { fields: 'a.missing' });
    expect(logSpy).toHaveBeenCalledWith('{}');
  });
});

describe('outputError', () => {
  let errSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    process.exitCode = 0;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.exitCode = 0;
  });

  it('emits JSON error envelope by default and sets exitCode=1', () => {
    outputError(new AuthError('no token'));
    expect(errSpy).toHaveBeenCalledWith('{"error":"no token","code":"AUTH_ERROR"}');
    expect(process.exitCode).toBe(1);
  });

  it('emits human-readable error when output=pretty', () => {
    outputError(new AuthError('no token'), { output: 'pretty' });
    expect(errSpy).toHaveBeenCalledWith('Error: no token');
  });

  it('does not emit when quiet=true but still sets exitCode=1', () => {
    outputError(new AuthError('no token'), { quiet: true });
    expect(errSpy).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
  });
});
