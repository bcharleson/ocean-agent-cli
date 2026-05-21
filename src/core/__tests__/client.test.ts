import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OceanClient } from '../client.js';
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  OceanError,
} from '../errors.js';

const ORIGINAL_FETCH = globalThis.fetch;

function mockResponse(body: unknown, init: { status?: number; headers?: Record<string, string> } = {}) {
  const status = init.status ?? 200;
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: new Headers(init.headers ?? {}),
    text: async () => text,
  } as unknown as Response;
}

describe('OceanClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as any;
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.restoreAllMocks();
  });

  describe('headers', () => {
    it('sends X-Api-Token and User-Agent on every request', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));
      const client = new OceanClient({ apiToken: 'tok-123' });
      await client.get('/v2/credits');
      const [, init] = fetchMock.mock.calls[0];
      expect(init.headers['X-Api-Token']).toBe('tok-123');
      expect(init.headers['User-Agent']).toMatch(/^ocean-agent-cli\//);
    });

    it('adds Content-Type only when a body is present', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));
      const client = new OceanClient({ apiToken: 't' });
      await client.post('/v2/x', { a: 1 });
      expect(fetchMock.mock.calls[0][1].headers['Content-Type']).toBe('application/json');

      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));
      await client.get('/v2/y');
      expect(fetchMock.mock.calls[1][1].headers['Content-Type']).toBeUndefined();
    });

    it('serializes query parameters and skips undefined/null/empty', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));
      const client = new OceanClient({ apiToken: 't' });
      await client.get('/v2/x', { a: 1, b: 'two', c: undefined, d: '', e: false });
      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('a=1');
      expect(url).toContain('b=two');
      expect(url).toContain('e=false');
      expect(url).not.toContain('c=');
      expect(url).not.toContain('d=');
    });
  });

  describe('error mapping', () => {
    const cases: Array<[number, typeof OceanError, string]> = [
      [401, AuthError, 'AUTH_ERROR'],
      [403, AuthError, 'AUTH_ERROR'],
      [404, NotFoundError, 'NOT_FOUND'],
      [422, ValidationError, 'VALIDATION_ERROR'],
    ];

    for (const [status, ErrCls, code] of cases) {
      it(`maps ${status} to ${ErrCls.name}`, async () => {
        fetchMock.mockResolvedValueOnce(mockResponse({ detail: `boom-${status}` }, { status }));
        const client = new OceanClient({ apiToken: 't', maxRetries: 0 });
        await expect(client.get('/x')).rejects.toMatchObject({
          name: ErrCls.name,
          code,
          message: `boom-${status}`,
        });
      });
    }

    it('extracts the Ocean.io `detail` field as the error message', async () => {
      fetchMock.mockResolvedValueOnce(
        mockResponse({ detail: 'Current API token is not registered in our database' }, { status: 401 }),
      );
      const client = new OceanClient({ apiToken: 't', maxRetries: 0 });
      await expect(client.get('/x')).rejects.toThrow(/not registered in our database/);
    });

    it('falls back to message/error/raw body when detail is missing', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ message: 'm' }, { status: 404 }));
      const c1 = new OceanClient({ apiToken: 't', maxRetries: 0 });
      await expect(c1.get('/x')).rejects.toThrow(/^m$/);

      fetchMock.mockResolvedValueOnce(mockResponse({ error: 'e' }, { status: 404 }));
      const c2 = new OceanClient({ apiToken: 't', maxRetries: 0 });
      await expect(c2.get('/x')).rejects.toThrow(/^e$/);

      fetchMock.mockResolvedValueOnce(mockResponse('plain text body', { status: 404 }));
      const c3 = new OceanClient({ apiToken: 't', maxRetries: 0 });
      await expect(c3.get('/x')).rejects.toThrow(/plain text body/);
    });

    it('serializes object detail as JSON instead of [object Object]', async () => {
      const detail = {
        domains: { _errors: ['Expected array, received string'] },
      };
      fetchMock.mockResolvedValueOnce(mockResponse({ detail }, { status: 422 }));
      const client = new OceanClient({ apiToken: 't', maxRetries: 0 });
      await expect(client.get('/x')).rejects.toMatchObject({
        name: 'ValidationError',
        message: JSON.stringify(detail),
      });
    });

    it('serializes FastAPI-style detail arrays', async () => {
      const detail = [
        { loc: ['body', 'domains'], msg: 'field required', type: 'value_error.missing' },
      ];
      fetchMock.mockResolvedValueOnce(mockResponse({ detail }, { status: 422 }));
      const client = new OceanClient({ apiToken: 't', maxRetries: 0 });
      await expect(client.get('/x')).rejects.toThrow(/field required/);
    });
  });

  describe('429 rate limiting', () => {
    it('retries with Retry-After then succeeds', async () => {
      fetchMock
        .mockResolvedValueOnce(mockResponse({ detail: 'slow down' }, { status: 429, headers: { 'retry-after': '0' } }))
        .mockResolvedValueOnce(mockResponse({ ok: true }));
      const client = new OceanClient({ apiToken: 't', maxRetries: 1 });
      const result = await client.get<{ ok: boolean }>('/x');
      expect(result.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('throws RateLimitError after exhausting retries', async () => {
      fetchMock.mockResolvedValue(
        mockResponse({ detail: 'slow' }, { status: 429, headers: { 'retry-after': '0' } }),
      );
      const client = new OceanClient({ apiToken: 't', maxRetries: 1 });
      await expect(client.get('/x')).rejects.toBeInstanceOf(RateLimitError);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });
  });

  describe('5xx retry behavior', () => {
    it('retries 503 then succeeds', async () => {
      fetchMock
        .mockResolvedValueOnce(mockResponse({ detail: 'down' }, { status: 503 }))
        .mockResolvedValueOnce(mockResponse({ ok: true }));
      const client = new OceanClient({ apiToken: 't', maxRetries: 1 });
      const result = await client.get<{ ok: boolean }>('/x');
      expect(result.ok).toBe(true);
    });

    it('throws ServerError after exhausting retries', async () => {
      fetchMock.mockResolvedValue(mockResponse({ detail: 'down' }, { status: 500 }));
      const client = new OceanClient({ apiToken: 't', maxRetries: 1 });
      await expect(client.get('/x')).rejects.toBeInstanceOf(ServerError);
    });
  });

  describe('success bodies', () => {
    it('parses JSON success bodies', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse({ items: [1, 2] }));
      const client = new OceanClient({ apiToken: 't' });
      const result = await client.get<{ items: number[] }>('/x');
      expect(result.items).toEqual([1, 2]);
    });

    it('returns undefined for empty body', async () => {
      fetchMock.mockResolvedValueOnce(mockResponse(''));
      const client = new OceanClient({ apiToken: 't' });
      const result = await client.get('/x');
      expect(result).toBeUndefined();
    });
  });
});
