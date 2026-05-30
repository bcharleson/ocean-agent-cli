import { z } from 'zod';
import {
  buildCompanyDataMapping,
  normalizeDomain,
  parseCsvOrArray,
} from '../../core/ocean-payloads.js';
import { getDomainInputIssue } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const enrichCompaniesCommand: CommandDefinition = {
  name: 'enrich_companies',
  group: 'enrich',
  subcommand: 'companies',
  description: 'Enrich multiple companies (async — results sent to your webhook)',
  examples: [
    'ocean enrich companies --domains "stripe.com,twilio.com" --webhook-url "https://yourapp.com/webhooks/ocean"',
  ],

  inputSchema: z
    .object({
      domains: z
        .union([z.array(z.string()), z.string()])
        .describe('Company domains (CSV string or array)'),
      webhookUrl: z.string().url().describe('Webhook URL for async enrichment results'),
    })
    .refine((data) => parseCsvOrArray(data.domains).length > 0, {
      message: 'At least one domain is required (--domains)',
    })
    .superRefine((data, ctx) => {
      for (const domain of parseCsvOrArray(data.domains)) {
        const issue = getDomainInputIssue(domain, '--domains');
        if (issue) {
          ctx.addIssue({ code: 'custom', message: issue });
          return;
        }
      }
    }),

  cliMappings: {
    options: [
      { field: 'domains', flags: '-d, --domains <domains>', description: 'Comma-separated list of domains' },
      {
        field: 'webhookUrl',
        flags: '--webhook-url <url>',
        description: 'Webhook URL (required by Ocean.io for batch enrich)',
      },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/companies' },

  fieldMappings: {
    domains: 'body',
    webhookUrl: 'body',
  },

  handler: (input, client) => {
    const domains = parseCsvOrArray(input.domains as string | string[]);
    return client.post('/v2/enrich/companies', {
      companyDataMapping: buildCompanyDataMapping(domains),
      webhookUrl: input.webhookUrl as string,
    });
  },
};
