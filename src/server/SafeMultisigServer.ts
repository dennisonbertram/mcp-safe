import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';

/**
 * Safe Multisig MCP Server
 *
 * Provides MCP tools for SAFE multisig wallet management across
 * multiple blockchain networks with CAIP-2 support.
 */
export class SafeMultisigServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer(
      {
        name: 'safe-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );
  }

  /**
   * Connect the server to a transport
   */
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }
}
