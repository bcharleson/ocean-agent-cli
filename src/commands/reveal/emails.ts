import { z } from 'zod';
import { nonEmptyCsvOrArray } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const revealEmailsCommand: CommandDefinition = {
  name: 'reveal_emails',
  group: 'reveal',
  subcommand: 'emails',
  description: 'Reveal email addresses for people by Ocean IDs (async — results sent to webhook URL)',
  examples: [
    'ocean reveal emails --ocean-ids "abc123,def456" --webhook-url "https://your-webhook.com/ocean"',
    'ocean reveal emails --ocean-ids "id1" --webhook-url "https://webhook.site/your-unique-id"',
  ],

  inputSchema: z.object({
    oceanIds: nonEmptyCsvOrArray('At least one Ocean ID is required (--ocean-ids)').describe(
      'Comma-separated Ocean.io person IDs',
    ),
    webhookUrl: z.string().url().describe('Webhook URL to receive results (Ocean.io sends emails asynchronously)'),
  }),

  cliMappings: {
    options: [
      { field: 'oceanIds', flags: '--ocean-ids <ids>', description: 'Comma-separated Ocean.io person IDs' },
      { field: 'webhookUrl', flags: '--webhook-url <url>', description: 'Webhook URL to receive results' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/reveal/emails' },

  fieldMappings: {},

  handler: (input, client) => {
    const personIds = typeof input.oceanIds === 'string'
      ? (input.oceanIds as string).split(',').map((id: string) => id.trim())
      : input.oceanIds;
    return client.post('/v2/reveal/emails', { personIds, webhookUrl: input.webhookUrl });
  },
};
