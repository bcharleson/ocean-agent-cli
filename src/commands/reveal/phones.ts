import { z } from 'zod';
import { nonEmptyCsvOrArray } from '../../core/validation.js';
import type { CommandDefinition } from '../../core/types.js';

export const revealPhonesCommand: CommandDefinition = {
  name: 'reveal_phones',
  group: 'reveal',
  subcommand: 'phones',
  description: 'Reveal phone numbers for people by Ocean IDs (async — results sent to webhook URL)',
  examples: [
    'ocean reveal phones --ocean-ids "abc123,def456" --webhook-url "https://your-webhook.com/ocean"',
  ],

  inputSchema: z.object({
    oceanIds: nonEmptyCsvOrArray('At least one Ocean ID is required (--ocean-ids)').describe(
      'Comma-separated Ocean.io person IDs',
    ),
    webhookUrl: z.string().url().describe('Webhook URL to receive results (Ocean.io sends phones asynchronously)'),
  }),

  cliMappings: {
    options: [
      { field: 'oceanIds', flags: '--ocean-ids <ids>', description: 'Comma-separated Ocean.io person IDs' },
      { field: 'webhookUrl', flags: '--webhook-url <url>', description: 'Webhook URL to receive results' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/reveal/phones' },

  fieldMappings: {},

  handler: (input, client) => {
    const personIds = typeof input.oceanIds === 'string'
      ? (input.oceanIds as string).split(',').map((id: string) => id.trim())
      : input.oceanIds;
    return client.post('/v2/reveal/phones', { personIds, webhookUrl: input.webhookUrl });
  },
};
