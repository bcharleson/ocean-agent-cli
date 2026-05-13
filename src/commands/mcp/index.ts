import { Command } from 'commander';
import { startMcpServer } from '../../mcp/server.js';

export function registerMcpCommand(program: Command): void {
  program
    .command('mcp')
    .description('Start the MCP server for AI assistant integration (Claude, Cursor, VS Code, Windsurf)')
    .addHelpText('after', `
MCP Configuration:

  For Claude Desktop / Cursor / VS Code, add to your MCP config:

  {
    "mcpServers": {
      "ocean": {
        "command": "npx",
        "args": ["ocean-agent-cli", "mcp"],
        "env": {
          "OCEAN_API_TOKEN": "your-api-token"
        }
      }
    }
  }

  Or if installed globally:

  {
    "mcpServers": {
      "ocean": {
        "command": "ocean",
        "args": ["mcp"],
        "env": {
          "OCEAN_API_TOKEN": "your-api-token"
        }
      }
    }
  }`)
    .action(async () => {
      process.on('SIGINT', () => process.exit(0));
      process.on('SIGTERM', () => process.exit(0));

      try {
        await startMcpServer();
      } catch (error: any) {
        console.error('Failed to start MCP server:', error.message ?? error);
        process.exit(1);
      }
    });
}
