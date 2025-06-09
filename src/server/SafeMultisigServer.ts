import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLogger } from '../utils/logger.js';
import { SafeToolsRegistry } from '../../dist/server/tools-registry.js';

export class SafeMultisigServer {
  private readonly logger = createLogger('SafeMultisigServer');
  private readonly toolsRegistry: SafeToolsRegistry;

  constructor(private readonly server: McpServer) {
    this.toolsRegistry = new SafeToolsRegistry(server);
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing SAFE Multisig Server...');

    try {
      // Register MCP tools
      await this.registerTools();

      // Register MCP resources
      await this.registerResources();

      // Register MCP prompts
      await this.registerPrompts();

      this.logger.info('SAFE Multisig Server initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize SAFE Multisig Server:', error);
      throw error;
    }
  }

  private async registerTools(): Promise<void> {
    this.logger.info('Registering all SAFE MCP tools...');

    try {
      // Register all comprehensive SAFE tools via the tools registry
      await this.toolsRegistry.registerAllTools();
      this.logger.info('All SAFE MCP tools registered successfully');
    } catch (error) {
      this.logger.error('Failed to register SAFE MCP tools:', error);
      throw error;
    }
  }

  private async registerResources(): Promise<void> {
    this.logger.info('Registering MCP resources...');

    // TODO: Register all SAFE multisig resources
    // This will be implemented in subsequent tasks

    this.logger.info('MCP resources registered successfully');
  }

  private async registerPrompts(): Promise<void> {
    this.logger.info('Registering MCP prompts...');

    // TODO: Register all SAFE multisig prompts
    // This will be implemented in subsequent tasks

    this.logger.info('MCP prompts registered successfully');
  }
}
