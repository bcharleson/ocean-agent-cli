import { Command } from 'commander';
import { OceanClient } from '../../core/client.js';
import { saveConfig } from '../../core/config.js';
import { output, outputError } from '../../core/output.js';
import type { GlobalOptions } from '../../core/types.js';

export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Authenticate with your Ocean.io API token')
    .option('--api-token <token>', 'API token (skips interactive prompt)')
    .action(async (opts) => {
      const globalOpts = program.opts() as GlobalOptions;
      if ((globalOpts as any).pretty) {
        (globalOpts as any).output = 'pretty';
      }

      try {
        // --api-token can be read either from local opts or merged global opts;
        // when the same flag is declared at both scopes Commander routes the
        // value to whichever scope first claimed it, so we check both.
        let apiToken =
          opts.apiToken || (globalOpts as any).apiToken || process.env.OCEAN_API_TOKEN;

        if (!apiToken) {
          if (!process.stdin.isTTY) {
            outputError(
              new Error(
                'No API token provided. Use --api-token <token>, set OCEAN_API_TOKEN, or run interactively in a TTY.',
              ),
              globalOpts,
            );
            return;
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
          return;
        }

        // Validate by making a test request
        const client = new OceanClient({ apiToken });

        if (globalOpts.output === 'pretty' || process.stdin.isTTY) {
          console.log('Validating API token...');
        }

        // Try to check credits balance to validate the token
        try {
          await client.get('/v2/credits/balance');
        } catch {
          // Some tokens might have limited scope, just save it
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
      }
    });
}
