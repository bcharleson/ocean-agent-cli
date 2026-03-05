import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const autocompleteCompaniesCommand: CommandDefinition = {
  name: 'autocomplete_companies',
  group: 'autocomplete',
  subcommand: 'companies',
  description: 'Autocomplete company names',
  examples: [
    'ocean autocomplete companies --query "Acme"',
  ],

  inputSchema: z.object({
    query: z.string().describe('Search query for autocomplete'),
  }),

  cliMappings: {
    options: [
      { field: 'query', flags: '-q, --query <query>', description: 'Search query' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/autocomplete/companies' },

  fieldMappings: {
    query: 'body',
  },

  handler: (input, client) => executeCommand(autocompleteCompaniesCommand, input, client),
};
