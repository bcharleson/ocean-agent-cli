/** Turn API / unknown values into a readable string (never "[object Object]"). */
export function stringifyErrorMessage(value: unknown, fallback = 'Request failed'): string {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'string') return value || fallback;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (Array.isArray(value)) {
    const parts = value.map((item) => stringifyErrorMessage(item, '')).filter(Boolean);
    return parts.length > 0 ? parts.join('; ') : fallback;
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return fallback;
    }
  }

  return String(value);
}

/** Extract a human-readable message from an Ocean.io API error response body. */
export function extractApiErrorMessage(errorBody: string): string {
  const trimmed = errorBody.trim();
  if (!trimmed) return 'Request failed';

  try {
    const parsed: unknown = JSON.parse(trimmed);

    if (typeof parsed === 'string') return parsed || 'Request failed';

    if (typeof parsed === 'object' && parsed !== null) {
      const record = parsed as Record<string, unknown>;
      const candidates = [
        record.detail,
        record.message,
        record.error,
        record.errors,
        record.title,
        record.description,
      ];

      for (const candidate of candidates) {
        if (candidate === undefined || candidate === null || candidate === '') continue;
        const msg = stringifyErrorMessage(candidate, '');
        if (msg) return msg;
      }

      return JSON.stringify(parsed);
    }

    return stringifyErrorMessage(parsed, trimmed);
  } catch {
    return trimmed;
  }
}

export class OceanError extends Error {
  constructor(
    message: unknown,
    public code: string,
    public statusCode?: number,
  ) {
    super(stringifyErrorMessage(message));
    this.name = 'OceanError';
  }
}

export class AuthError extends OceanError {
  constructor(message: unknown) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends OceanError {
  constructor(message: unknown) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends OceanError {
  constructor(message: unknown) {
    super(message, 'VALIDATION_ERROR', 422);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends OceanError {
  public retryAfter?: number;

  constructor(message: unknown, retryAfter?: number) {
    super(message, 'RATE_LIMIT', 429);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

export class ServerError extends OceanError {
  constructor(message: unknown, statusCode: number = 500) {
    super(message, 'SERVER_ERROR', statusCode);
    this.name = 'ServerError';
  }
}

export function formatError(error: unknown): { message: string; code: string } {
  if (error instanceof OceanError) {
    return { message: error.message, code: error.code };
  }
  if (error instanceof Error) {
    if (error.name === 'AbortError' || String(error.message).includes('aborted')) {
      return { message: 'Request timed out — the API did not respond in time', code: 'TIMEOUT' };
    }
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
      return { message: `Network error: ${error.message}`, code: 'NETWORK_ERROR' };
    }
    return { message: error.message, code: 'UNKNOWN_ERROR' };
  }
  return { message: String(error), code: 'UNKNOWN_ERROR' };
}
