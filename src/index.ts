#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLogger } from './utils/logger.js';
import { SafeMultisigServer } from './server/SafeMultisigServer.js';

const logger = createLogger('main');

async function main(): Promise<void> {
  try {
    logger.info('Starting SAFE Multisig MCP Server...');

    // Create MCP server instance
    const server = new McpServer({
      name: 'safe-multisig',
      version: '1.0.0',
    });

    // Initialize SAFE multisig server
    const safeServer = new SafeMultisigServer(server);
    await safeServer.initialize();

    // Create transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    logger.info('SAFE Multisig MCP Server started successfully');
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch(error => {
  logger.error('Unhandled error:', error);
  process.exit(1);
}); 