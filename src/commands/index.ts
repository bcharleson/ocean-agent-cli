import { Command } from 'commander';
import type { CommandDefinition, GlobalOptions } from '../core/types.js';
import { resolveApiToken } from '../core/auth.js';
import { OceanClient } from '../core/client.js';
import { output, outputError } from '../core/output.js';
import {
  formatInputValidationError,
  normalizeGlobalOptions,
  parseJsonOptionFields,
} from '../core/validation.js';

// Auth commands (special — don't need an API client)
import { registerLoginCommand } from './auth/login.js';
import { registerLogoutCommand } from './auth/logout.js';

// Command definitions
import { creditsBalanceCommand } from './credits/balance.js';
import { dataFieldsListCommand } from './data-fields/list.js';
import { searchCompaniesCommand } from './search/companies.js';
import { searchCompaniesV2Command } from './search/companies-v2.js';
import { searchPeopleCommand } from './search/people.js';
import { searchPeopleV2Command } from './search/people-v2.js';
import { enrichCompanyCommand } from './enrich/company.js';
import { enrichCompaniesCommand } from './enrich/companies.js';
import { enrichPersonCommand } from './enrich/person.js';
import { enrichPeopleCommand } from './enrich/people.js';
import { lookupCompaniesCommand } from './lookup/companies.js';
import { lookupPeopleCommand } from './lookup/people.js';
import { revealEmailsCommand } from './reveal/emails.js';
import { revealPhonesCommand } from './reveal/phones.js';
import { warmupCompaniesCommand } from './warmup/companies.js';
import { autocompleteCompaniesCommand } from './autocomplete/companies.js';
import { autocompleteKeywordsCommand } from './autocomplete/keywords.js';
import { autocompleteJobTitlesCommand } from './autocomplete/job-titles.js';
import { autocompleteLocationsCommand } from './autocomplete/locations.js';
import { autocompleteSkillsCommand } from './autocomplete/skills.js';

// MCP command
import { registerMcpCommand } from './mcp/index.js';

/** All command definitions — the single source of truth for CLI + MCP */
export const allCommands: CommandDefinition[] = [
  // Credits
  creditsBalanceCommand,
  // Data Fields
  dataFieldsListCommand,
  // Search
  searchCompaniesCommand,
  searchCompaniesV2Command,
  searchPeopleCommand,
  searchPeopleV2Command,
  // Enrich
  enrichCompanyCommand,
  enrichCompaniesCommand,
  enrichPersonCommand,
  enrichPeopleCommand,
  // Lookup
  lookupCompaniesCommand,
  lookupPeopleCommand,
  // Reveal
  revealEmailsCommand,
  revealPhonesCommand,
  // Warmup
  warmupCompaniesCommand,
  // Autocomplete
  autocompleteCompaniesCommand,
  autocompleteKeywordsCommand,
  autocompleteJobTitlesCommand,
  autocompleteLocationsCommand,
  autocompleteSkillsCommand,
];

export function registerAllCommands(program: Command): void {
  // Register auth commands (special handling — no API client needed)
  registerLoginCommand(program);
  registerLogoutCommand(program);

  // Register MCP server command
  registerMcpCommand(program);

  // Group commands by their `group` field
  const groups = new Map<string, CommandDefinition[]>();
  for (const cmd of allCommands) {
    if (!groups.has(cmd.group)) groups.set(cmd.group, []);
    groups.get(cmd.group)!.push(cmd);
  }

  for (const [groupName, commands] of groups) {
    const groupCmd = program
      .command(groupName)
      .description(`Manage ${groupName}`);

    for (const cmdDef of commands) {
      registerCommand(groupCmd, cmdDef);
    }

    groupCmd.on('command:*', (operands: string[]) => {
      const available = commands.map((c) => c.subcommand).join(', ');
      console.error(`error: unknown command '${operands[0]}' for '${groupName}'`);
      console.error(`Available commands: ${available}`);
      process.exitCode = 1;
    });
  }
}

function registerCommand(parent: Command, cmdDef: CommandDefinition): void {
  const cmd = parent
    .command(cmdDef.subcommand)
    .description(cmdDef.description);

  // Register positional arguments
  if (cmdDef.cliMappings.args) {
    for (const arg of cmdDef.cliMappings.args) {
      const argStr = arg.required ? `<${arg.name}>` : `[${arg.name}]`;
      cmd.argument(argStr, `${arg.field}`);
    }
  }

  // Register options
  if (cmdDef.cliMappings.options) {
    for (const opt of cmdDef.cliMappings.options) {
      cmd.option(opt.flags, opt.description ?? '');
    }
  }

  // Add examples to help
  if (cmdDef.examples?.length) {
    cmd.addHelpText('after', '\nExamples:\n' + cmdDef.examples.map((e) => `  $ ${e}`).join('\n'));
  }

  cmd.action(async (...actionArgs: any[]) => {
    try {
      const globalOpts = normalizeGlobalOptions(
        cmd.optsWithGlobals() as GlobalOptions & Record<string, any>,
      ) as GlobalOptions & Record<string, any>;

      // Build input from positional args + options
      const input: Record<string, any> = {};

      if (cmdDef.cliMappings.args) {
        for (let i = 0; i < cmdDef.cliMappings.args.length; i++) {
          const argDef = cmdDef.cliMappings.args[i];
          if (actionArgs[i] !== undefined) {
            input[argDef.field] = actionArgs[i];
          }
        }
      }

      if (cmdDef.cliMappings.options) {
        for (const opt of cmdDef.cliMappings.options) {
          const match = opt.flags.match(/--([a-z-]+)/);
          if (match) {
            const optName = match[1].replace(/-([a-z])/g, (_, c) => c.toUpperCase());
            if (globalOpts[optName] !== undefined) {
              input[opt.field] = globalOpts[optName];
            }
          }
        }
      }

      // Validate input BEFORE resolving auth so missing-option errors take
      // precedence over auth errors (clearer signal for new users).
      const parsed = cmdDef.inputSchema.safeParse(input);
      if (!parsed.success) {
        throw formatInputValidationError(parsed.error);
      }

      const prepared = parseJsonOptionFields(parsed.data as Record<string, unknown>, cmdDef);

      const apiToken = await resolveApiToken(globalOpts.apiToken);
      const client = new OceanClient({ apiToken });

      const result = await cmdDef.handler(prepared, client);
      output(result, globalOpts);
    } catch (error) {
      const globalOpts = normalizeGlobalOptions(
        cmd.optsWithGlobals() as GlobalOptions & Record<string, any>,
      ) as GlobalOptions & Record<string, any>;
      outputError(error, globalOpts);
      process.exit(1);
    }
  });
}
