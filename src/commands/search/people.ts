import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const searchPeopleCommand: CommandDefinition = {
  name: 'search_people',
  group: 'search',
  subcommand: 'people',
  description: 'Search for people using filters, domains, and other criteria (v3)',
  examples: [
    'ocean search people --domains "acme.com,example.com"',
    'ocean search people --filters \'{"jobTitle":["CEO"]}\'',
    'ocean search people --limit 50',
  ],

  inputSchema: z.object({
    domains: z.array(z.string()).optional().describe('List of company domains to search within'),
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

  endpoint: { method: 'POST', path: '/v3/search/people' },

  fieldMappings: {
    domains: 'body',
    filters: 'body',
    limit: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
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
    return client.post('/v3/search/people', body);
  },
};
