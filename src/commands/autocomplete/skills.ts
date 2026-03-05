import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const autocompleteSkillsCommand: CommandDefinition = {
  name: 'autocomplete_skills',
  group: 'autocomplete',
  subcommand: 'skills',
  description: 'Autocomplete skills',
  examples: ['ocean autocomplete skills --query "python"'],

  inputSchema: z.object({
    query: z.string().describe('Search query for autocomplete'),
  }),

  cliMappings: {
    options: [
      { field: 'query', flags: '-q, --query <query>', description: 'Search query' },
    ],
  },

  endpoint: { method: 'POST', path: '/v2/autocomplete/skills' },
  fieldMappings: { query: 'body' },
  handler: (input, client) => executeCommand(autocompleteSkillsCommand, input, client),
};
