// Jest setup file for Safe MCP Server tests
import { jest } from '@jest/globals';

// Set test timeout to 30 seconds for network operations
jest.setTimeout(30000);

// Mock console.log to prevent test output pollution
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
};

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';
