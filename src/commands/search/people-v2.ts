import { z } from 'zod';
import { buildSearchPeopleV2Body } from '../../core/ocean-payloads.js';
import { positiveLimit } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const searchPeopleV2Command: CommandDefinition = {
  name: 'search_people_v2',
  group: 'search',
  subcommand: 'people-v2',
  deprecated: true,
  description: 'Search for people (v2, deprecated — use "search people" instead)',
  examples: [
    'ocean search people-v2 --filters \'{"jobTitles":["CEO"]}\' --limit 20',
    'ocean search people-v2 --filters \'{"seniorities":["C-Level"],"countries":["us"]}\'',
  ],

  inputSchema: z.object({
    peopleFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('People filters as JSON'),
    companiesFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Company filters as JSON'),
    filters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Alias for --people-filters'),
    limit: positiveLimit.describe('Maximum number of results (maps to API `size`)'),
    skip: z.coerce.number().optional().describe('Offset (maps to API `from`)'),
    searchAfter: z.string().optional().describe('Pagination cursor from a previous search response'),
  }),

  cliMappings: {
    options: [
      { field: 'peopleFilters', flags: '--people-filters <json>', description: 'People filters as JSON' },
      { field: 'companiesFilters', flags: '--companies-filters <json>', description: 'Company filters as JSON' },
      { field: 'filters', flags: '-f, --filters <json>', description: 'Alias for --people-filters' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results (API: size)' },
      { field: 'skip', flags: '--skip <number>', description: 'Results offset (API: from)' },
      { field: 'searchAfter', flags: '--search-after <cursor>', description: 'Pagination cursor from previous response' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/search/people' },

  fieldMappings: {
    peopleFilters: 'body',
    companiesFilters: 'body',
    filters: 'body',
    limit: 'body',
    skip: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
    const peopleFilters = input.peopleFilters ?? input.filters;
    const parsedPeople =
      peopleFilters === undefined
        ? undefined
        : typeof peopleFilters === 'string'
          ? JSON.parse(peopleFilters)
          : peopleFilters;

    const parsedCompanies =
      input.companiesFilters === undefined
        ? undefined
        : typeof input.companiesFilters === 'string'
          ? JSON.parse(input.companiesFilters)
          : input.companiesFilters;

    const body = buildSearchPeopleV2Body({
      peopleFilters: parsedPeople,
      companiesFilters: parsedCompanies,
      limit: input.limit as number | undefined,
      skip: input.skip as number | undefined,
      searchAfter: input.searchAfter as string | undefined,
    });

    return client.post('/v2/search/people', body);
  },
};
