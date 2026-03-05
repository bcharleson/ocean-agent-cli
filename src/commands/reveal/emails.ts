import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const revealEmailsCommand: CommandDefinition = {
  name: 'reveal_emails',
  group: 'reveal',
  subcommand: 'emails',
  description: 'Reveal email addresses for people by Ocean IDs',
  examples: [
    'ocean reveal emails --ocean-ids "abc123,def456"',
  ],

  inputSchema: z.object({
    oceanIds: z.array(z.string()).describe('List of Ocean.io person IDs'),
  }),

  cliMappings: {
    options: [
      { field: 'oceanIds', flags: '--ocean-ids <ids>', description: 'Comma-separated Ocean.io person IDs' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/reveal/emails' },

  fieldMappings: {
    oceanIds: 'body',
  },

  handler: (input, client) => {
    const oceanIds = typeof input.oceanIds === 'string'
      ? (input.oceanIds as string).split(',').map((id: string) => id.trim())
      : input.oceanIds;
    return client.post('/v2/reveal/emails', { oceanIds });
  },
};
