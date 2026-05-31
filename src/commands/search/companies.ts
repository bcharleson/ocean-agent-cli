import { z } from 'zod';
import { normalizeCompaniesFilters } from '../../core/ocean-payloads.js';
import { positiveLimit } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const searchCompaniesCommand: CommandDefinition = {
  name: 'search_companies',
  group: 'search',
  subcommand: 'companies',
  description:
    'Search companies (v3). Use companiesFilters JSON: domains, industries, countries, headcountMin/Max. Call data_fields_list for field names.',
  examples: [
    'ocean search companies --companies-filters \'{"domains":["roush.com","tesla.com"]}\'',
    'ocean search companies --companies-filters \'{"industries":["Automotive"],"countries":["us"]}\'',
    'ocean search companies --companies-filters \'{"headcountMin":100,"headcountMax":5000}\' --limit 20',
  ],

  inputSchema: z.object({
    companiesFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Company filters (domains, industries, countries, headcountMin/Max, etc.)'),
    peopleFilters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('People filters to narrow company results'),
    filters: z.union([z.record(z.string(), z.any()), z.string()]).optional().describe('Alias for --companies-filters'),
    limit: positiveLimit.describe('Maximum number of results (default 50)'),
    searchAfter: z.string().optional().describe('Pagination cursor from a previous search response'),
  }),

  cliMappings: {
    options: [
      { field: 'companiesFilters', flags: '--companies-filters <json>', description: 'Company filters as JSON (domains, industries, countries, etc.)' },
      { field: 'peopleFilters', flags: '--people-filters <json>', description: 'People filters as JSON' },
      { field: 'filters', flags: '-f, --filters <json>', description: 'Alias for --companies-filters' },
      { field: 'limit', flags: '-l, --limit <number>', description: 'Maximum results to return' },
      { field: 'searchAfter', flags: '--search-after <cursor>', description: 'Pagination cursor from previous response' },
    ],
  },

  endpoint: { method: 'POST', path: '/v3/search/companies' },

  fieldMappings: {
    companiesFilters: 'body',
    peopleFilters: 'body',
    filters: 'body',
    limit: 'body',
    searchAfter: 'body',
  },

  handler: (input, client) => {
    const body: Record<string, any> = {};
    // --filters is an alias for --companies-filters on this command
    const companies = input.companiesFilters ?? input.filters;
    if (companies) {
      const parsed = typeof companies === 'string' ? JSON.parse(companies) : companies;
      body.companiesFilters = normalizeCompaniesFilters(parsed as Record<string, unknown>);
    }
    if (input.peopleFilters) {
      body.peopleFilters = typeof input.peopleFilters === 'string' ? JSON.parse(input.peopleFilters) : input.peopleFilters;
    }
    if (input.limit !== undefined) body.size = input.limit;
    if (input.searchAfter !== undefined) body.searchAfter = input.searchAfter;
    return client.post('/v3/search/companies', body);
  },
};
