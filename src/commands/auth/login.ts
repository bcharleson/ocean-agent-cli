import { Command } from 'commander';
import { OceanClient } from '../../core/client.js';
import { saveConfig } from '../../core/config.js';
import { output, outputError } from '../../core/output.js';
import type { GlobalOptions } from '../../core/types.js';
import { normalizeGlobalOptions } from '../../core/validation.js';

export function registerLoginCommand(program: Command): void {
  const loginCmd = program
    .command('login')
    .description(
      'Authenticate with your Ocean.io API token (use global --api-token, OCEAN_API_TOKEN, or interactive prompt in a TTY)',
    )
    .action(async function (this: Command) {
      const globalOpts = normalizeGlobalOptions(
        this.optsWithGlobals() as GlobalOptions & Record<string, unknown>,
      ) as GlobalOptions;

      try {
        // Global --api-token only (do not redeclare on login — Commander drops duplicate flags).
        let apiToken = globalOpts.apiToken || process.env.OCEAN_API_TOKEN;

        if (!apiToken) {
          if (!process.stdin.isTTY) {
            outputError(
              new Error(
                'No API token provided. Use: ocean login --api-token <token>, ocean --api-token <token> login, set OCEAN_API_TOKEN, or run in an interactive terminal.',
              ),
              globalOpts,
            );
            process.exit(1);
          }

          console.log('Get your API token from your Ocean.io account settings.\n');

          const { password } = await import('@inquirer/prompts');
          apiToken = await password({
            message: 'Enter your API token:',
            mask: '*',
          });
        }

        if (!apiToken) {
          outputError(new Error('No API token provided'), globalOpts);
          process.exit(1);
        }

        const client = new OceanClient({ apiToken });

        if (globalOpts.output === 'pretty' || process.stdin.isTTY) {
          console.log('Validating API token...');
        }

        try {
          await client.get('/v2/credits/balance');
        } catch (error) {
          outputError(
            error instanceof Error
              ? error
              : new Error('Invalid API token. Verify your token in Ocean.io account settings.'),
            globalOpts,
          );
          process.exit(1);
        }

        await saveConfig({ api_token: apiToken });

        const result = {
          status: 'authenticated',
          config_path: '~/.ocean/config.json',
        };

        if (globalOpts.output === 'pretty' || process.stdin.isTTY) {
          console.log('\nAuthenticated successfully!');
          console.log('Config saved to ~/.ocean/config.json');
        } else {
          output(result, globalOpts);
        }
      } catch (error) {
        outputError(error, globalOpts);
        process.exit(1);
      }
    });

  loginCmd.addHelpText(
    'after',
    '\nExamples:\n  $ ocean login --api-token <token>\n  $ ocean --api-token <token> login\n  $ ocean login   # interactive prompt (TTY only)',
  );
}
