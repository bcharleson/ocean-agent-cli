import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const autocompleteKeywordsCommand: CommandDefinition = {
  name: 'autocomplete_keywords',
  group: 'autocomplete',
  subcommand: 'keywords',
  description: 'Autocomplete keywords',
  examples: ['ocean autocomplete keywords --query "saas"'],

  inputSchema: z.object({
    query: z.string().describe('Search query for autocomplete'),
  }),

  cliMappings: {
    options: [
      { field: 'query', flags: '-q, --query <query>', description: 'Search query' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/autocomplete/keywords' },
  fieldMappings: { query: 'body' },
  handler: (input, client) => executeCommand(autocompleteKeywordsCommand, input, client),
};
