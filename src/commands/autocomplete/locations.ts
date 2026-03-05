import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const autocompleteLocationsCommand: CommandDefinition = {
  name: 'autocomplete_locations',
  group: 'autocomplete',
  subcommand: 'locations',
  description: 'Autocomplete locations',
  examples: ['ocean autocomplete locations --query "San Francisco"'],

  inputSchema: z.object({
    query: z.string().describe('Search query for autocomplete'),
  }),

  cliMappings: {
    options: [
      { field: 'query', flags: '-q, --query <query>', description: 'Search query' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/autocomplete/locations' },
  fieldMappings: { query: 'body' },
  handler: (input, client) => executeCommand(autocompleteLocationsCommand, input, client),
};
