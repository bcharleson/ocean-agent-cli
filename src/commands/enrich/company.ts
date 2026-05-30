import { z } from 'zod';
import { domainString } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const enrichCompanyCommand: CommandDefinition = {
  name: 'enrich_company',
  group: 'enrich',
  subcommand: 'company',
  description: 'Enrich a single company by domain',
  examples: [
    'ocean enrich company --domain roush.com',
    'ocean enrich company --domain tesla.com',
  ],

  inputSchema: z.object({
    domain: domainString().describe('Company domain to enrich'),
  }),

  cliMappings: {
    options: [
      { field: 'domain', flags: '-d, --domain <domain>', description: 'Company domain' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/company' },

  fieldMappings: {},

  handler: (input, client) => {
    return client.post('/v2/enrich/company', { company: { domain: input.domain } });
  },
};
