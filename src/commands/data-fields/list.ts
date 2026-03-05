import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const dataFieldsListCommand: CommandDefinition = {
  name: 'data_fields_list',
  group: 'data-fields',
  subcommand: 'list',
  description: 'List all available data fields for search and enrichment',
  examples: [
    'ocean data-fields list',
    'ocean data-fields list --pretty',
  ],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/v2/data-fields' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(dataFieldsListCommand, input, client),
};
