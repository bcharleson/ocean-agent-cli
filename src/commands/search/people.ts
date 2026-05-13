import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const searchPeopleCommand: CommandDefinition = {
  name: 'search_people',
  group: 'search',
  subcommand: 'people',
  description: 'Search for people using filters and criteria (v3)',
  examples: [
    'ocean search people --people-filters \'{"jobTitleKeywords":{"anyOf":["instrumentation manager"]},"countries":["us"]}\'',
    'ocean search people --companies-filters \'{"domains":["roush.com","rivian.com"]}\'',
    'ocean search people --people-filters \'{"jobTitleKeywords":{"anyOf":["engineer","manager"]},"seniorities":["manager","director"]}\' --limit 50',
  ],

  inputSchema: z.object({
    peopleFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('People-level filters (jobTitleKeywords, countries, seniorities, departments, etc.)'),
    companiesFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Company-level filters (domains, industries, etc.)'),
    filters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Alias for --people-filters'),
    limit: z.coerce.number().optional().describe('Maximum number of results (default 50, max 10000)'),
    peoplePerCompany: z.coerce.number().optional().describe('Max results per company'),
    searchAfter: z.union([z.array(z.any()), z.string()]).optional().describe('Pagination cursor as JSON array'),
  }),

  cliMappings: {
    options: [
      { field: 'peopleFilters', flags: '--people-filters <json>', description: 'People filters as JSON (jobTitleKeywords, countries, seniorities, etc.)' },
      { field: 'companiesFilters', flags: '--companies-filters <json>', description: 'Company filters as JSON (domains, industries, etc.)' },
      { field: 'filters', flags: '-f, --filters <json>', description: 'Alias for --people-filters' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results to return' },
      { field: 'peoplePerCompany', flags: '--people-per-company <number>', description: 'Max people per company' },
      { field: 'searchAfter', flags: '--search-after <json>', description: 'Pagination cursor as JSON array' },
    ],
  },

  endpoint: { method: 'POST', path: '/v3/search/people' },

  fieldMappings: {
    peopleFilters: 'body',
    companiesFilters: 'body',
    filters: 'body',
    limit: 'body',
    peoplePerCompany: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
    const body: Record<string, any> = {};
    // --filters is an alias for --people-filters on this command
    const people = input.peopleFilters ?? input.filters;
    if (people) {
      body.peopleFilters = typeof people === 'string' ? JSON.parse(people) : people;
    }
    if (input.companiesFilters) {
      body.companiesFilters = typeof input.companiesFilters === 'string' ? JSON.parse(input.companiesFilters) : input.companiesFilters;
    }
    if (input.limit !== undefined) body.size = input.limit;
    if (input.peoplePerCompany !== undefined) body.peoplePerCompany = input.peoplePerCompany;
    if (input.searchAfter) {
      body.searchAfter = typeof input.searchAfter === 'string' ? JSON.parse(input.searchAfter) : input.searchAfter;
    }
    return client.post('/v3/search/people', body);
  },
};
