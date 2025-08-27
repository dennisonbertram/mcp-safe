import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
/**
 * Tool handler function type
 */
type ToolHandler = (_args: unknown) => Promise<CallToolResult>;
/**
 * Safe Multisig MCP Server
 *
 * Provides MCP tools for SAFE multisig wallet management across
 * multiple blockchain networks with CAIP-2 support.
 */
export declare class SafeMultisigServer {
    private server;
    private tools;
    private handlers;
    private enabledTools;
    constructor(autoInitialize?: boolean);
    /**
     * Initialize and register all available tools
     */
    private initializeTools;
    /**
     * Set up MCP protocol handlers
     */
    private setupHandlers;
    /**
     * Register a new tool
     */
    registerTool(tool: Tool, handler: ToolHandler): void;
    /**
     * Enable a tool
     */
    enableTool(toolName: string): boolean;
    /**
     * Disable a tool
     */
    disableTool(toolName: string): boolean;
    /**
     * Call a tool by name
     */
    private callTool;
    /**
     * Handle errors and convert to MCP format
     */
    handleError(error: unknown): CallToolResult;
    /**
     * Get list of available tools
     */
    getAvailableTools(): Tool[];
    /**
     * Connect the server to a transport
     */
    connect(transport: Transport): Promise<void>;
}
export {};
