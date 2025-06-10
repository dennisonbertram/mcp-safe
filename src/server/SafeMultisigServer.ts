import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { Tool, CallToolResult, ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SafeError, ErrorCodes } from '../utils/SafeError.js';
import { WalletCreationTools } from '../mcp/tools/WalletCreationTools.js';
import { WalletQueryTools } from '../mcp/tools/WalletQueryTools.js';
import { TransactionManagementTools } from '../mcp/tools/TransactionManagementTools.js';
import { OwnerManagementTools } from '../mcp/tools/OwnerManagementTools.js';
import { ContractRegistry } from '../network/ContractRegistry.js';

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
  private server: Server;
  private tools: Map<string, Tool> = new Map();
  private handlers: Map<string, ToolHandler> = new Map();
  private enabledTools: Set<string> = new Set();

  constructor() {
    this.server = new Server(
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

    this.setupHandlers();
    this.initializeTools();
  }

  /**
   * Initialize and register all available tools
   */
  private initializeTools(): void {
    const contractRegistry = new ContractRegistry();
    
    // Initialize wallet creation tools
    const walletCreationTools = new WalletCreationTools(contractRegistry);
    walletCreationTools.getTools().forEach(tool => {
      this.registerTool(tool, async (args) => {
        return await walletCreationTools.handleToolCall(tool.name, args);
      });
    });

    // Initialize wallet query tools
    const walletQueryTools = new WalletQueryTools(contractRegistry);
    walletQueryTools.getTools().forEach(tool => {
      this.registerTool(tool, async (args) => {
        return await walletQueryTools.handleToolCall(tool.name, args);
      });
    });

    // Initialize transaction management tools
    const transactionManagementTools = new TransactionManagementTools(contractRegistry);
    transactionManagementTools.getTools().forEach(tool => {
      this.registerTool(tool, async (args) => {
        return await transactionManagementTools.handleToolCall(tool.name, args);
      });
    });

    // Initialize owner management tools
    const ownerManagementTools = new OwnerManagementTools(contractRegistry);
    ownerManagementTools.getTools().forEach(tool => {
      this.registerTool(tool, async (args) => {
        return await ownerManagementTools.handleToolCall(tool.name, args);
      });
    });
  }

  /**
   * Set up MCP protocol handlers
   */
  private setupHandlers(): void {
    // Handle tools/list requests
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const enabledToolsList = Array.from(this.enabledTools)
        .map(toolName => this.tools.get(toolName))
        .filter((tool): tool is Tool => tool !== undefined);
      
      return {
        tools: enabledToolsList
      };
    });

    // Handle tools/call requests
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!this.enabledTools.has(name)) {
        return this.handleError(new SafeError(
          `Tool '${name}' is not enabled`,
          ErrorCodes.TOOL_NOT_FOUND
        ));
      }

      const handler = this.handlers.get(name);
      if (!handler) {
        return this.handleError(new SafeError(
          `Handler for tool '${name}' not found`,
          ErrorCodes.TOOL_NOT_FOUND
        ));
      }

      try {
        return await handler(args);
      } catch (error) {
        return this.handleError(error);
      }
    });
  }

  /**
   * Register a new tool
   */
  registerTool(tool: Tool, handler: ToolHandler): void {
    this.tools.set(tool.name, tool);
    this.handlers.set(tool.name, handler);
    this.enabledTools.add(tool.name);

    // Tool registered successfully
  }

  /**
   * Enable a tool
   */
  enableTool(toolName: string): boolean {
    if (this.tools.has(toolName)) {
      this.enabledTools.add(toolName);
      // Tool enabled successfully
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
      // Tool disabled successfully
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
