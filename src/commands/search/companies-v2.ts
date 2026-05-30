import { z } from 'zod';
import { buildSearchCompaniesV2Body } from '../../core/ocean-payloads.js';
import { positiveLimit } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const searchCompaniesV2Command: CommandDefinition = {
  name: 'search_companies_v2',
  group: 'search',
  subcommand: 'companies-v2',
  deprecated: true,
  description: 'Search for companies (v2, deprecated — use "search companies" instead)',
  examples: [
    'ocean search companies-v2 --filters \'{"includeDomains":["acme.com"]}\' --limit 10',
    'ocean search companies-v2 --filters \'{"industries":["Technology"]}\' --limit 5',
  ],

  inputSchema: z.object({
    companiesFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Company filters as JSON'),
    filters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Alias for --companies-filters'),
    limit: positiveLimit.describe('Maximum number of results (maps to API `size`)'),
    skip: z.coerce.number().optional().describe('Offset (maps to API `from`)'),
    searchAfter: z.union([z.string(), z.array(z.any())]).optional().describe('Pagination cursor'),
  }),

  cliMappings: {
    options: [
      { field: 'companiesFilters', flags: '--companies-filters <json>', description: 'Company filters as JSON' },
      { field: 'filters', flags: '-f, --filters <json>', description: 'Alias for --companies-filters' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results (API: size)' },
      { field: 'skip', flags: '--skip <number>', description: 'Results offset (API: from)' },
      { field: 'searchAfter', flags: '--search-after <json>', description: 'Pagination cursor' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/search/companies' },

  fieldMappings: {
    companiesFilters: 'body',
    filters: 'body',
    limit: 'body',
    skip: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
    const companiesFilters = input.companiesFilters ?? input.filters;
    const parsedFilters =
      companiesFilters === undefined
        ? undefined
        : typeof companiesFilters === 'string'
          ? JSON.parse(companiesFilters)
          : companiesFilters;

    const searchAfter =
      input.searchAfter === undefined
        ? undefined
        : typeof input.searchAfter === 'string'
          ? JSON.parse(input.searchAfter)
          : input.searchAfter;

    const body = buildSearchCompaniesV2Body({
      companiesFilters: parsedFilters,
      limit: input.limit as number | undefined,
      skip: input.skip as number | undefined,
      searchAfter,
    });

    return client.post('/v2/search/companies', body);
  },
};
