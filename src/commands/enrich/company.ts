import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const enrichCompanyCommand: CommandDefinition = {
  name: 'enrich_company',
  group: 'enrich',
  subcommand: 'company',
  description: 'Enrich a single company by domain',
  examples: [
    'ocean enrich company --domain acme.com',
  ],

  inputSchema: z.object({
    domain: z.string().describe('Company domain to enrich'),
  }),

  cliMappings: {
    options: [
      { field: 'domain', flags: '-d, --domain <domain>', description: 'Company domain' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/company' },

  fieldMappings: {
    domain: 'body',
  },

  handler: (input, client) => executeCommand(enrichCompanyCommand, input, client),
};
