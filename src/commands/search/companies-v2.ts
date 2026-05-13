import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const searchCompaniesV2Command: CommandDefinition = {
  name: 'search_companies_v2',
  group: 'search',
  subcommand: 'companies-v2',
  description: 'Search for companies (v2, deprecated — use "search companies" instead)',
  examples: [
    'ocean search companies-v2 --filters \'{"industry":["Technology"]}\'',
  ],

  inputSchema: z.object({
    filters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Search filters object'),
    limit: z.coerce.number().optional().describe('Maximum number of results'),
    skip: z.coerce.number().optional().describe('Number of results to skip'),
  }),

  cliMappings: {
    options: [
      { field: 'filters', flags: '-f, --filters <json>', description: 'Search filters as JSON' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results to return' },
      { field: 'skip', flags: '--skip <number>', description: 'Number of results to skip' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/search/companies' },

  fieldMappings: {
    filters: 'body',
    limit: 'body',
    skip: 'body',
  },

  handler: (input, client) => {
    const body: Record<string, any> = {};
    if (input.filters) {
      body.filters = typeof input.filters === 'string' ? JSON.parse(input.filters) : input.filters;
    }
    if (input.limit !== undefined) body.limit = input.limit;
    if (input.skip !== undefined) body.skip = input.skip;
    return client.post('/v2/search/companies', body);
  },
};
