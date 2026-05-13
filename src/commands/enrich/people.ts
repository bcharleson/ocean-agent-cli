import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';

export const enrichPeopleCommand: CommandDefinition = {
  name: 'enrich_people',
  group: 'enrich',
  subcommand: 'people',
  description: 'Enrich multiple people by LinkedIn URLs or Ocean IDs',
  examples: [
    'ocean enrich people --linkedin-urls "https://linkedin.com/in/johndoe,https://linkedin.com/in/janedoe"',
    'ocean enrich people --ocean-ids "abc123,def456"',
  ],

  inputSchema: z.object({
    linkedinUrls: z.union([z.array(z.string()), z.string()]).optional().describe('LinkedIn profile URLs (CSV string or array)'),
    oceanIds: z.union([z.array(z.string()), z.string()]).optional().describe('Ocean.io person IDs (CSV string or array)'),
  }),

  cliMappings: {
    options: [
      { field: 'linkedinUrls', flags: '--linkedin-urls <urls>', description: 'Comma-separated LinkedIn URLs' },
      { field: 'oceanIds', flags: '--ocean-ids <ids>', description: 'Comma-separated Ocean.io person IDs' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/enrich/people' },

  fieldMappings: {
    linkedinUrls: 'body',
    oceanIds: 'body',
  },

  handler: (input, client) => {
    const body: Record<string, any> = {};
    if (input.linkedinUrls) {
      body.linkedinUrls = typeof input.linkedinUrls === 'string'
        ? (input.linkedinUrls as string).split(',').map((u: string) => u.trim())
        : input.linkedinUrls;
    }
    if (input.oceanIds) {
      body.oceanIds = typeof input.oceanIds === 'string'
        ? (input.oceanIds as string).split(',').map((id: string) => id.trim())
        : input.oceanIds;
    }
    return client.post('/v2/enrich/people', body);
  },
};
