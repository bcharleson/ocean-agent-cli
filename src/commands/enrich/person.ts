import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const enrichPersonCommand: CommandDefinition = {
  name: 'enrich_person',
  group: 'enrich',
  subcommand: 'person',
  description: 'Enrich a single person by LinkedIn URL or Ocean ID',
  examples: [
    'ocean enrich person --linkedin-url "https://linkedin.com/in/johndoe"',
    'ocean enrich person --ocean-id "abc123"',
  ],

  inputSchema: z.object({
    linkedinUrl: z.string().optional().describe('LinkedIn profile URL'),
    oceanId: z.string().optional().describe('Ocean.io person ID'),
  }),

  cliMappings: {
    options: [
      { field: 'linkedinUrl', flags: '--linkedin-url <url>', description: 'LinkedIn profile URL' },
      { field: 'oceanId', flags: '--ocean-id <id>', description: 'Ocean.io person ID' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/person' },

  fieldMappings: {
    linkedinUrl: 'body',
    oceanId: 'body',
  },

  handler: (input, client) => executeCommand(enrichPersonCommand, input, client),
};
