import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const autocompleteJobTitlesCommand: CommandDefinition = {
  name: 'autocomplete_job_titles',
  group: 'autocomplete',
  subcommand: 'job-titles',
  description: 'Autocomplete job titles',
  examples: ['ocean autocomplete job-titles --query "engineer"'],

  inputSchema: z.object({
    query: z.string().describe('Search query for autocomplete'),
  }),

  cliMappings: {
    options: [
      { field: 'query', flags: '-q, --query <query>', description: 'Search query' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/autocomplete/job-titles' },
  fieldMappings: { query: 'body' },
  handler: (input, client) => executeCommand(autocompleteJobTitlesCommand, input, client),
};
