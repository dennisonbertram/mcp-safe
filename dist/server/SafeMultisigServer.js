import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
/**
 * Safe Multisig MCP Server
 *
 * Provides MCP tools for SAFE multisig wallet management across
 * multiple blockchain networks with CAIP-2 support.
 */
export class SafeMultisigServer {
    server;
    constructor() {
        this.server = new McpServer({
            name: 'safe-mcp-server',
            version: '1.0.0',
        }, {
            capabilities: {
                tools: {},
                resources: {},
                prompts: {},
            },
        });
    }
    /**
     * Connect the server to a transport
     */
    async connect(transport) {
        await this.server.connect(transport);
    }
}
