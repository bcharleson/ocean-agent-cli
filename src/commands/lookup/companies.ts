import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const lookupCompaniesCommand: CommandDefinition = {
  name: 'lookup_companies',
  group: 'lookup',
  subcommand: 'companies',
  description: 'Look up companies by domains',
  examples: [
    'ocean lookup companies --domains "acme.com,example.com"',
  ],

  inputSchema: z.object({
    domains: z.union([z.array(z.string()), z.string()]).describe('Company domains (CSV string or array)'),
  }),

  cliMappings: {
    options: [
      { field: 'domains', flags: '-d, --domains <domains>', description: 'Comma-separated list of domains' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/lookup/companies' },

  fieldMappings: {
    domains: 'body',
  },

  handler: (input, client) => {
    const domains = typeof input.domains === 'string'
      ? (input.domains as string).split(',').map((d: string) => d.trim())
      : input.domains;
    return client.post('/v2/lookup/companies', { domains });
  },
};
