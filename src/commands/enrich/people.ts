import { z } from 'zod';
import {
  buildPeopleDataMapping,
  parseCsvOrArray,
} from '../../core/ocean-payloads.js';
import type { CommandDefinition } from '../../core/types.js';

export const enrichPeopleCommand: CommandDefinition = {
  name: 'enrich_people',
  group: 'enrich',
  subcommand: 'people',
  description: 'Enrich multiple people (async — results sent to your webhook)',
  examples: [
    'ocean enrich people --linkedin-urls "https://linkedin.com/in/johndoe" --webhook-url "https://yourapp.com/webhooks/ocean"',
    'ocean enrich people --ocean-ids "id1,id2" --webhook-url "https://yourapp.com/webhooks/ocean"',
  ],

  inputSchema: z
    .object({
      linkedinUrls: z
        .union([z.array(z.string()), z.string()])
        .optional()
        .describe('LinkedIn profile URLs (CSV string or array)'),
      oceanIds: z
        .union([z.array(z.string()), z.string()])
        .optional()
        .describe('Ocean.io person IDs (CSV string or array)'),
      webhookUrl: z.string().url().describe('Webhook URL for async enrichment results'),
    })
    .refine(
      (data) =>
        (data.linkedinUrls !== undefined && parseCsvOrArray(data.linkedinUrls).length > 0) ||
        (data.oceanIds !== undefined && parseCsvOrArray(data.oceanIds).length > 0),
      { message: 'Provide at least one of --linkedin-urls or --ocean-ids' },
    ),

  cliMappings: {
    options: [
      { field: 'linkedinUrls', flags: '--linkedin-urls <urls>', description: 'Comma-separated LinkedIn URLs' },
      { field: 'oceanIds', flags: '--ocean-ids <ids>', description: 'Comma-separated Ocean.io person IDs' },
      {
        field: 'webhookUrl',
        flags: '--webhook-url <url>',
        description: 'Webhook URL (required by Ocean.io for batch enrich)',
      },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/people' },

  fieldMappings: {
    linkedinUrls: 'body',
    oceanIds: 'body',
    webhookUrl: 'body',
  },

  handler: (input, client) => {
    const linkedinUrls = input.linkedinUrls
      ? parseCsvOrArray(input.linkedinUrls as string | string[])
      : undefined;
    const oceanIds = input.oceanIds
      ? parseCsvOrArray(input.oceanIds as string | string[])
      : undefined;

    return client.post('/v2/enrich/people', {
      peopleDataMapping: buildPeopleDataMapping({ linkedinUrls, oceanIds }),
      webhookUrl: input.webhookUrl as string,
    });
  },
};
