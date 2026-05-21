import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { agentCommands } from '../commands/index.js';
import { resolveApiToken } from '../core/auth.js';
import { OceanClient } from '../core/client.js';
import { CLI_VERSION } from '../core/version.js';

export async function startMcpServer(): Promise<void> {
  const apiToken = await resolveApiToken();
  const client = new OceanClient({ apiToken });

  const server = new McpServer({
    name: 'ocean',
    version: CLI_VERSION,
  });

  // Register stable commands only (deprecated v2 search excluded)
  for (const cmdDef of agentCommands) {
    const shape = cmdDef.inputSchema.shape;

    server.registerTool(
      cmdDef.name,
      {
        description: cmdDef.description,
        inputSchema: shape,
      },
      async (args: Record<string, unknown>) => {
        try {
          const result = await cmdDef.handler(args, client);
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(result, null, 2),
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({
                  error: error.message ?? String(error),
                  code: error.code ?? 'UNKNOWN_ERROR',
                }),
              },
            ],
            isError: true,
          };
        }
      },
    );
  }

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('Ocean MCP server started. Tools registered:', agentCommands.length);
}
