#!/usr/bin/env node

/**
 * Safe MCP Server - Main Entry Point
 *
 * A Model Context Protocol server for SAFE multisig wallet management.
 * Provides AI systems with tools to interact with SAFE wallets across
 * multiple blockchain networks.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SafeMultisigServer } from './server/SafeMultisigServer.js';

async function main(): Promise<void> {
  try {
    // Create server instance
    const server = new SafeMultisigServer();

    // Create stdio transport
    const transport = new StdioServerTransport();

    // Connect server to transport
    await server.connect(transport);

    // Log server start to stderr (stdout reserved for MCP)
    console.error('Safe MCP Server started successfully');

    // Keep the process running to handle requests
    await new Promise(() => {});
  } catch (error) {
    console.error('Failed to start Safe MCP Server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start the server
main().catch((error) => {
  console.error('Unhandled error in main:', error);
  process.exit(1);
});
