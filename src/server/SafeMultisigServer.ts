import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SafeError, ErrorCodes } from '../utils/SafeError';

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
export class SafeMultisigServer {
  private server: McpServer;
  private tools: Map<string, Tool> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();
  private enabledTools: Set<string> = new Set();

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
   * Register a new tool
   */
  registerTool(tool: Tool, handler: ToolHandler): void {
    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, handler);
    this.enabledTools.add(tool.name);

    // Log tool registration to stderr
    console.error(`Registered tool: ${tool.name}`);
  }

  /**
   * Enable a tool
   */
  enableTool(toolName: string): boolean {
    if (this.tools.has(toolName)) {
      this.enabledTools.add(toolName);
      console.error(`Enabled tool: ${toolName}`);
      return true;
    }
    return false;
  }

  /**
   * Disable a tool
   */
  disableTool(toolName: string): boolean {
    if (this.tools.has(toolName)) {
      this.enabledTools.delete(toolName);
      console.error(`Disabled tool: ${toolName}`);
      return true;
    }
    return false;
  }

  /**
   * Call a tool by name
   */
  private async callTool(name: string, args: unknown): Promise<CallToolResult> {
    if (!this.enabledTools.has(name)) {
      throw new SafeError(
        `Tool '${name}' is not available`,
        ErrorCodes.TOOL_NOT_FOUND,
        { toolName: name }
      );
    }

    const handler = this.handlers.get(name);
    if (!handler) {
      throw new SafeError(
        `No handler found for tool '${name}'`,
        ErrorCodes.TOOL_NOT_FOUND,
        { toolName: name }
      );
    }

    return await handler(args);
  }

  /**
   * Handle errors and convert to MCP format
   */
  handleError(error: unknown): CallToolResult {
    if (error instanceof SafeError) {
      console.error(
        `SafeError [${error.code}]: ${error.message}`,
        error.details
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(error.toJSON(), null, 2),
          },
        ],
        isError: true,
      };
    }

    // Handle unexpected errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Unexpected error:', error);

    const safeError = new SafeError(
      `Unexpected error: ${message}`,
      ErrorCodes.SAFE_OPERATION_ERROR
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(safeError.toJSON(), null, 2),
        },
      ],
      isError: true,
    };
  }

  /**
   * Get list of available tools
   */
  getAvailableTools(): Tool[] {
    return Array.from(this.enabledTools)
      .map((name) => this.tools.get(name))
      .filter((tool): tool is Tool => tool !== undefined);
  }

  /**
   * Connect the server to a transport
   */
  async connect(transport: Transport): Promise<void> {
    await this.server.connect(transport);
  }
}
