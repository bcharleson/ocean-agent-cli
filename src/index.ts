import { Command, CommanderError } from 'commander';
import { registerAllCommands } from './commands/index.js';
import { outputError } from './core/output.js';
import { assertValidOutputFormat, normalizeGlobalOptions } from './core/validation.js';
import { CLI_VERSION } from './core/version.js';

const program = new Command();

program
  .name('ocean')
  .description('CLI and MCP server for the Ocean.io data enrichment platform')
  .version(CLI_VERSION)
  .option('--api-token <token>', 'API token (overrides OCEAN_API_TOKEN env var and stored config)')
  .option('--output <format>', 'Output format: json (default) or pretty', 'json')
  .option('--pretty', 'Shorthand for --output pretty')
  .option('--quiet', 'Suppress output, exit codes only')
  .option(
    '--fields <fields>',
    'Comma-separated fields to include in output (run `ocean data-fields list` for valid names)',
  );

program.hook('preAction', (thisCommand) => {
  const opts = thisCommand.optsWithGlobals() as { output?: string; pretty?: boolean };
  if (opts.pretty) {
    opts.output = 'pretty';
  }
  assertValidOutputFormat(opts.output);
});

registerAllCommands(program);

program.exitOverride();

try {
  program.parse();
} catch (error) {
  if (error instanceof CommanderError) {
    process.exit(error.exitCode);
  }
  const opts = normalizeGlobalOptions(program.opts() as Record<string, unknown>);
  outputError(error, opts);
  process.exit(1);
}
