import { loadConfig } from './config.js';
import { AuthError } from './errors.js';

export async function resolveApiToken(flagToken?: string): Promise<string> {
  // 1. --api-token flag takes highest priority
  if (flagToken) return flagToken;

  // 2. OCEAN_API_TOKEN environment variable
  const envToken = process.env.OCEAN_API_TOKEN;
  if (envToken) return envToken;

  // 3. Stored config from ~/.ocean/config.json
  const config = await loadConfig();
  if (config?.api_token) return config.api_token;

  throw new AuthError(
    'No API token found. Set OCEAN_API_TOKEN, use --api-token, or run: ocean login',
  );
}
