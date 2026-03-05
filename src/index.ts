import { Command } from 'commander';
import { registerAllCommands } from './commands/index.js';

const program = new Command();

program
  .name('ocean')
  .description('CLI and MCP server for the Ocean.io data enrichment platform')
  .version('0.1.0')
  .option('--api-token <token>', 'API token (overrides OCEAN_API_TOKEN env var and stored config)')
  .option('--output <format>', 'Output format: json (default) or pretty', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option('--fields <fields>', 'Comma-separated list of fields to include in output');

registerAllCommands(program);

program.parse();
