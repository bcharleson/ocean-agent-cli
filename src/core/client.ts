import type { OceanClient as IOceanClient } from './types.js';
import {
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError,
  OceanError,
  extractApiErrorMessage,
} from './errors.js';

const BASE_URL = 'https://api.ocean.io';
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30_000;
import { CLI_VERSION } from './version.js';

interface ClientOptions {
  apiToken: string;
  baseUrl?: string;
  maxRetries?: number;
  timeout?: number;
}

export class OceanClient implements IOceanClient {
  private apiToken: string;
  private baseUrl: string;
  private maxRetries: number;
  private timeout: number;

  constructor(options: ClientOptions) {
    this.apiToken = options.apiToken;
    this.baseUrl = options.baseUrl ?? BASE_URL;
    this.maxRetries = options.maxRetries ?? MAX_RETRIES;
    this.timeout = options.timeout ?? REQUEST_TIMEOUT;
  }

  async request<T>(options: {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
  }): Promise<T> {
    const url = new URL(this.baseUrl + options.path);

    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      'X-Api-Token': this.apiToken,
      'User-Agent': `ocean-agent-cli/${CLI_VERSION}`,
    };

    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url.toString(), {
          method: options.method,
          headers,
          body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const text = await response.text();
          if (!text) return undefined as T;
          return JSON.parse(text) as T;
        }

        const errorBody = await response.text().catch(() => '');
        const errorMessage =
          extractApiErrorMessage(errorBody) || response.statusText || 'Request failed';

        switch (response.status) {
          case 401:
          case 403:
            throw new AuthError(errorMessage);
          case 404:
            throw new NotFoundError(errorMessage);
          case 422:
            throw new ValidationError(errorMessage);
          case 429: {
            const retryAfter = parseInt(response.headers.get('retry-after') ?? '', 10);
            const err = new RateLimitError(errorMessage, isNaN(retryAfter) ? undefined : retryAfter);
            if (attempt < this.maxRetries) {
              const delay = err.retryAfter
                ? err.retryAfter * 1000
                : Math.min(1000 * Math.pow(2, attempt), 10_000);
              await sleep(delay);
              lastError = err;
              continue;
            }
            throw err;
          }
          default:
            if (response.status >= 500) {
              const err = new ServerError(errorMessage, response.status);
              if (attempt < this.maxRetries) {
                await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
                lastError = err;
                continue;
              }
              throw err;
            }
            throw new OceanError(errorMessage, 'API_ERROR', response.status);
        }
      } catch (error) {
        if (error instanceof OceanError) throw error;

        const isAbort =
          error instanceof Error &&
          (error.name === 'AbortError' || String(error.message).includes('aborted'));

        if (isAbort) {
          lastError = new OceanError(
            `Request timed out after ${this.timeout / 1000}s: ${options.method} ${options.path}`,
            'TIMEOUT',
          );
          if (options.method === 'GET' && attempt < this.maxRetries) {
            await sleep(Math.min(1000 * Math.pow(2, attempt), 10_000));
            continue;
          }
          throw lastError;
        }

        if (error instanceof TypeError && String(error.message).includes('fetch')) {
          throw new OceanError(`Network error: ${error.message}`, 'NETWORK_ERROR');
        }

        throw error;
      }
    }

    throw lastError ?? new OceanError('Request failed after retries', 'MAX_RETRIES');
  }

  async get<T>(path: string, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'GET', path, query });
  }

  async post<T>(path: string, body?: unknown, query?: Record<string, any>): Promise<T> {
    return this.request<T>({ method: 'POST', path, query, body });
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
