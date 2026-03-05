import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const searchCompaniesCommand: CommandDefinition = {
  name: 'search_companies',
  group: 'search',
  subcommand: 'companies',
  description: 'Search for companies using filters (v3)',
  examples: [
    'ocean search companies --companies-filters \'{"domains":["roush.com","tesla.com"]}\'',
    'ocean search companies --companies-filters \'{"industries":["Automotive"],"countries":["us"]}\'',
    'ocean search companies --companies-filters \'{"headcountMin":100,"headcountMax":5000}\' --limit 20',
  ],

  inputSchema: z.object({
    companiesFilters: z.union([z.record(z.any()), z.string()]).optional().describe('Company filters (domains, industries, countries, headcountMin/Max, etc.)'),
    peopleFilters: z.union([z.record(z.any()), z.string()]).optional().describe('People filters to narrow company results'),
    limit: z.coerce.number().optional().describe('Maximum number of results (default 50)'),
    searchAfter: z.union([z.array(z.any()), z.string()]).optional().describe('Pagination cursor as JSON array'),
  }),

  cliMappings: {
    options: [
      { field: 'companiesFilters', flags: '--companies-filters <json>', description: 'Company filters as JSON (domains, industries, countries, etc.)' },
      { field: 'peopleFilters', flags: '--people-filters <json>', description: 'People filters as JSON' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results to return' },
      { field: 'searchAfter', flags: '--search-after <json>', description: 'Pagination cursor as JSON array' },
    ],
  },

  endpoint: { method: 'POST', path: '/v3/search/companies' },

  fieldMappings: {
    companiesFilters: 'body',
    peopleFilters: 'body',
    limit: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
    const body: Record<string, any> = {};
    if (input.companiesFilters) {
      body.companiesFilters = typeof input.companiesFilters === 'string' ? JSON.parse(input.companiesFilters) : input.companiesFilters;
    }
    if (input.peopleFilters) {
      body.peopleFilters = typeof input.peopleFilters === 'string' ? JSON.parse(input.peopleFilters) : input.peopleFilters;
    }
    if (input.limit !== undefined) body.size = input.limit;
    if (input.searchAfter) {
      body.searchAfter = typeof input.searchAfter === 'string' ? JSON.parse(input.searchAfter) : input.searchAfter;
    }
    return client.post('/v3/search/companies', body);
  },
};
