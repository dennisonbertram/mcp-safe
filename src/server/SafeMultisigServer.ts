import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createLogger } from '../utils/logger.js';

export class SafeMultisigServer {
  private readonly logger = createLogger('SafeMultisigServer');

  constructor(private readonly server: McpServer) {}

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
    this.logger.info('Registering MCP tools...');

    // Register a basic health check tool to verify MCP is working
    this.server.tool(
      'server_health',
      {
        description: 'Get server health status and contract registry information',
      },
      async () => {
        try {
          // Check if we can read the contract registry
          const fs = await import('fs');
          const registryPath = './test/contracts/registry/localhost.json';
          
          let contractRegistry = null;
          if (fs.existsSync(registryPath)) {
            const registryData = fs.readFileSync(registryPath, 'utf-8');
            contractRegistry = JSON.parse(registryData);
          }

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  status: "healthy",
                  timestamp: new Date().toISOString(),
                  contractRegistry: contractRegistry ? {
                    chainId: contractRegistry.chainId,
                    network: contractRegistry.network,
                    deployer: contractRegistry.deployer,
                    blockNumber: contractRegistry.blockNumber,
                    contractsCount: Object.keys(contractRegistry.contracts || {}).length,
                    contracts: contractRegistry.contracts
                  } : null
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text", 
                text: JSON.stringify({
                  status: "error",
                  timestamp: new Date().toISOString(),
                  error: error instanceof Error ? error.message : String(error)
                }, null, 2)
              }
            ]
          };
        }
      }
    );

    this.logger.info('MCP tools registered successfully');
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
