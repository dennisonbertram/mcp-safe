import { describe, it, expect } from '@jest/globals';

describe('SAFE Multisig MCP Server', () => {
  it('should have basic project structure', () => {
    // Basic test to verify Jest setup
    expect(true).toBe(true);
  });

  it('should be able to import types', async () => {
    const { SafeError } = await import('./types/index.js');
    
    const error = new SafeError('Test error', 'TEST_ERROR');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('SafeError');
    expect(error.code).toBe('TEST_ERROR');
  });
}); 