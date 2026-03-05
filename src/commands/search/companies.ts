import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const searchCompaniesCommand: CommandDefinition = {
  name: 'search_companies',
  group: 'search',
  subcommand: 'companies',
  description: 'Search for companies using filters, domains, and other criteria (v3)',
  examples: [
    'ocean search companies --domains "acme.com,example.com"',
    'ocean search companies --filters \'{"industry":["Technology"]}\'',
    'ocean search companies --limit 50',
  ],

  inputSchema: z.object({
    domains: z.union([z.array(z.string()), z.string()]).optional().describe('List of company domains to search'),
    filters: z.record(z.any()).optional().describe('Search filters object'),
    limit: z.coerce.number().optional().describe('Maximum number of results'),
    searchAfter: z.array(z.any()).optional().describe('Pagination cursor for next page'),
  }),

  cliMappings: {
    options: [
      { field: 'domains', flags: '-d, --domains <domains>', description: 'Comma-separated list of domains' },
      { field: 'filters', flags: '-f, --filters <json>', description: 'Search filters as JSON' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results to return' },
      { field: 'searchAfter', flags: '--search-after <json>', description: 'Pagination cursor as JSON array' },
    ],
  },

  endpoint: { method: 'POST', path: '/v3/search/companies' },

  fieldMappings: {
    domains: 'body',
    filters: 'body',
    limit: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
    // Parse comma-separated domains from CLI string
    const body: Record<string, any> = {};
    if (input.domains) {
      body.domains = typeof input.domains === 'string'
        ? (input.domains as string).split(',').map((d: string) => d.trim())
        : input.domains;
    }
    if (input.filters) {
      body.filters = typeof input.filters === 'string' ? JSON.parse(input.filters) : input.filters;
    }
    if (input.limit !== undefined) body.limit = input.limit;
    if (input.searchAfter) {
      body.searchAfter = typeof input.searchAfter === 'string' ? JSON.parse(input.searchAfter) : input.searchAfter;
    }
    return client.post('/v3/search/companies', body);
  },
};
