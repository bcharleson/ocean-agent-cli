import { z } from 'zod';
import { parseCsvOrArray } from '../../core/ocean-payloads.js';
import type { CommandDefinition } from '../../core/types.js';

export const lookupPeopleCommand: CommandDefinition = {
  name: 'lookup_people',
  group: 'lookup',
  subcommand: 'people',
  description: 'Look up people by LinkedIn handles or Ocean IDs',
  examples: [
    'ocean lookup people --linkedin-handles "johndoe,janedoe"',
    'ocean lookup people --ocean-ids "abc123,def456"',
  ],

  inputSchema: z
    .object({
      linkedinHandles: z.union([z.array(z.string()), z.string()]).optional().describe('LinkedIn handles (CSV string or array)'),
      oceanIds: z.union([z.array(z.string()), z.string()]).optional().describe('Ocean.io person IDs (CSV string or array)'),
    })
    .refine(
      (data) => {
        const handles =
          data.linkedinHandles !== undefined
            ? parseCsvOrArray(data.linkedinHandles)
            : [];
        const ids =
          data.oceanIds !== undefined ? parseCsvOrArray(data.oceanIds) : [];
        return handles.length > 0 || ids.length > 0;
      },
      { message: 'Missing required option(s): --linkedin-handles or --ocean-ids' },
    ),

  cliMappings: {
    options: [
      { field: 'linkedinHandles', flags: '--linkedin-handles <handles>', description: 'Comma-separated LinkedIn handles' },
      { field: 'oceanIds', flags: '--ocean-ids <ids>', description: 'Comma-separated Ocean.io person IDs' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/lookup/people' },

  fieldMappings: {
    linkedinHandles: 'body',
    oceanIds: 'body',
  },

  handler: (input, client) => {
    const body: Record<string, any> = {};
    if (input.linkedinHandles) {
      body.linkedinHandles = typeof input.linkedinHandles === 'string'
        ? (input.linkedinHandles as string).split(',').map((h: string) => h.trim())
        : input.linkedinHandles;
    }
    if (input.oceanIds) {
      body.oceanIds = typeof input.oceanIds === 'string'
        ? (input.oceanIds as string).split(',').map((id: string) => id.trim())
        : input.oceanIds;
    }
    return client.post('/v2/lookup/people', body);
  },
};
