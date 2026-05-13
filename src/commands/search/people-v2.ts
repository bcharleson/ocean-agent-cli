import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const searchPeopleV2Command: CommandDefinition = {
  name: 'search_people_v2',
  group: 'search',
  subcommand: 'people-v2',
  description: 'Search for people (v2, deprecated — use "search people" instead)',
  examples: [
    'ocean search people-v2 --filters \'{"jobTitle":["CEO"]}\'',
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

  endpoint: { method: 'POST', path: '/v2/search/people' },

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
    return client.post('/v2/search/people', body);
  },
};
