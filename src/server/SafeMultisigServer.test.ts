import { describe, it, expect } from '@jest/globals';
import { SafeMultisigServer } from './SafeMultisigServer';

describe('SafeMultisigServer', () => {
  it('should create server instance', () => {
    const server = new SafeMultisigServer();
    expect(server).toBeDefined();
    expect(server).toBeInstanceOf(SafeMultisigServer);
  });

  it('should have connect method', () => {
    const server = new SafeMultisigServer();
    expect(typeof server.connect).toBe('function');
  });
});
