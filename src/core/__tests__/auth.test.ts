import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolveApiToken } from '../auth.js';
import * as configModule from '../config.js';
import { AuthError } from '../errors.js';

describe('resolveApiToken', () => {
  const originalEnv = process.env.OCEAN_API_TOKEN;

  beforeEach(() => {
    delete process.env.OCEAN_API_TOKEN;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.OCEAN_API_TOKEN;
    } else {
      process.env.OCEAN_API_TOKEN = originalEnv;
    }
    vi.restoreAllMocks();
  });

  it('prefers --api-token flag over env and config', async () => {
    process.env.OCEAN_API_TOKEN = 'env-tok';
    vi.spyOn(configModule, 'loadConfig').mockResolvedValue({ api_token: 'cfg-tok' });
    await expect(resolveApiToken('flag-tok')).resolves.toBe('flag-tok');
  });

  it('uses OCEAN_API_TOKEN env when no flag', async () => {
    process.env.OCEAN_API_TOKEN = 'env-tok';
    vi.spyOn(configModule, 'loadConfig').mockResolvedValue({ api_token: 'cfg-tok' });
    await expect(resolveApiToken()).resolves.toBe('env-tok');
  });

  it('falls back to config api_token when no flag/env', async () => {
    vi.spyOn(configModule, 'loadConfig').mockResolvedValue({ api_token: 'cfg-tok' });
    await expect(resolveApiToken()).resolves.toBe('cfg-tok');
  });

  it('throws AuthError with helpful message when no token is found', async () => {
    vi.spyOn(configModule, 'loadConfig').mockResolvedValue(null);
    await expect(resolveApiToken()).rejects.toBeInstanceOf(AuthError);
    await expect(resolveApiToken()).rejects.toThrow(/OCEAN_API_TOKEN.*--api-token.*ocean login/s);
  });

  it('throws when config exists but lacks api_token', async () => {
    vi.spyOn(configModule, 'loadConfig').mockResolvedValue({ api_token: '' } as any);
    await expect(resolveApiToken()).rejects.toBeInstanceOf(AuthError);
  });
});
