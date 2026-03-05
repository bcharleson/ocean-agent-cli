import { z } from 'zod';
import type { CommandDefinition } from '../../core/types.js';
import { executeCommand } from '../../core/handler.js';

export const creditsBalanceCommand: CommandDefinition = {
  name: 'credits_balance',
  group: 'credits',
  subcommand: 'balance',
  description: 'Get the current credits balance for your Ocean.io account',
  examples: [
    'ocean credits balance',
    'ocean credits balance --pretty',
  ],

  inputSchema: z.object({}),

  cliMappings: {},

  endpoint: { method: 'GET', path: '/v2/credits/balance' },

  fieldMappings: {},

  handler: (input, client) => executeCommand(creditsBalanceCommand, input, client),
};
