import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
/**
 * Safe Multisig MCP Server
 *
 * Provides MCP tools for SAFE multisig wallet management across
 * multiple blockchain networks with CAIP-2 support.
 */
export declare class SafeMultisigServer {
    private server;
    constructor();
    /**
     * Connect the server to a transport
     */
    connect(transport: Transport): Promise<void>;
}
