import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const autocompleteCompaniesCommand: CommandDefinition = {
  name: 'autocomplete_companies',
  group: 'autocomplete',
  subcommand: 'companies',
  description: 'Autocomplete company names',
  examples: [
    'ocean autocomplete companies --query "Salesforce"',
    'ocean autocomplete companies --name "Salesforce"',
  ],

  inputSchema: z
    .object({
      query: z.string().optional().describe('Search query for autocomplete'),
      name: z.string().optional().describe('Company name prefix (API field)'),
    })
    .refine((data) => (data.query?.trim() || data.name?.trim()), {
      message: 'Provide --query or --name',
    }),

  cliMappings: {
    options: [
      { field: 'query', flags: '-q, --query <query>', description: 'Search query (sent as API `name`)' },
      { field: 'name', flags: '--name <name>', description: 'Company name prefix' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/autocomplete/companies' },

  fieldMappings: {
    query: 'body',
    name: 'body',
  },

  handler: (input, client) => {
    const name = String(input.name ?? input.query ?? '').trim();
    return client.post('/v2/autocomplete/companies', { name });
  },
};
