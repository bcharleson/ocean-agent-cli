import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const warmupCompaniesCommand: CommandDefinition = {
  name: 'warmup_companies',
  group: 'warmup',
  subcommand: 'companies',
  description: 'Warm up company data by domains for faster subsequent lookups',
  examples: [
    'ocean warmup companies --domains "acme.com,example.com"',
  ],

  inputSchema: z.object({
    domains: z.array(z.string()).describe('List of company domains to warm up'),
  }),

  cliMappings: {
    options: [
      { field: 'domains', flags: '-d, --domains <domains>', description: 'Comma-separated list of domains' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/warmup/companies' },

  fieldMappings: {
    domains: 'body',
  },

  handler: (input, client) => {
    const domains = typeof input.domains === 'string'
      ? (input.domains as string).split(',').map((d: string) => d.trim())
      : input.domains;
    return client.post('/v2/warmup/companies', { domains });
  },
};
