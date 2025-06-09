import { describe, it, expect, beforeEach } from '@jest/globals';
import { SafeMultisigServer } from './SafeMultisigServer';
import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SafeError, ErrorCodes } from '../utils/SafeError';

describe('SafeMultisigServer', () => {
  let server: SafeMultisigServer;

  beforeEach(() => {
    server = new SafeMultisigServer();
  });

  it('should create server instance', () => {
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(SafeMultisigServer);
  });

  it('should have connect method', () => {
    expect(typeof server.connect).toBe('function');
  });

  it('should support tool registration', () => {
    expect(typeof server.registerTool).toBe('function');

    const mockTool: Tool = {
      name: 'test_tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };

    const mockHandler = async (): Promise<CallToolResult> => ({
      content: [{ type: 'text', text: 'test result' }],
    });

    // Should not throw
    server.registerTool(mockTool, mockHandler);
  });

  it('should support dynamic tool management', () => {
    expect(typeof server.enableTool).toBe('function');
    expect(typeof server.disableTool).toBe('function');

    const mockTool: Tool = {
      name: 'test_tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };

    const mockHandler = async (): Promise<CallToolResult> => ({
      content: [{ type: 'text', text: 'test result' }],
    });

    server.registerTool(mockTool, mockHandler);

    // Tool should be enabled by default after registration
    expect(server.getAvailableTools()).toHaveLength(1);

    // Disable tool
    expect(server.disableTool('test_tool')).toBe(true);
    expect(server.getAvailableTools()).toHaveLength(0);

    // Enable tool
    expect(server.enableTool('test_tool')).toBe(true);
    expect(server.getAvailableTools()).toHaveLength(1);
  });

  it('should have error handling capabilities', () => {
    expect(typeof server.handleError).toBe('function');

    const error = new SafeError('Test error', ErrorCodes.NETWORK_ERROR);
    const result = server.handleError(error);

    expect(result.isError).toBe(true);
    expect(result.content).toHaveLength(1);
    expect(result.content[0]?.type).toBe('text');
  });

  it('should get available tools list', () => {
    expect(typeof server.getAvailableTools).toBe('function');
    expect(server.getAvailableTools()).toEqual([]);
  });
});
