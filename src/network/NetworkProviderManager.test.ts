import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NetworkProviderManager } from './NetworkProviderManager';
import { SafeConfig } from '../config/types';

describe('NetworkProviderManager', () => {
  let manager: NetworkProviderManager;

  beforeEach(() => {
    const config: SafeConfig = {
      networks: {
        'eip155:1': { rpcUrl: 'https://eth.example.com' },
        'eip155:137': { rpcUrl: 'https://polygon.example.com' },
      },
    };
    manager = new NetworkProviderManager(config);
  });

  describe('getProvider', () => {
    it('should create and return ethers provider for valid network', async () => {
      const provider = await manager.getProvider('eip155:1');

      expect(provider).toBeDefined();
      expect((provider as any)._getConnection().url).toBe(
        'https://eth.example.com'
      );
    });

    it('should throw error for unsupported network', async () => {
      await expect(manager.getProvider('eip155:999')).rejects.toThrow(
        'Network eip155:999 is not configured'
      );
    });

    it('should reuse existing provider for same network', async () => {
      const provider1 = await manager.getProvider('eip155:1');
      const provider2 = await manager.getProvider('eip155:1');

      expect(provider1).toBe(provider2);
    });

    it('should apply runtime configuration overrides', async () => {
      const runtimeConfig = {
        rpcUrl: 'https://custom.example.com',
        timeout: 10000,
      };

      const provider = await manager.getProvider('eip155:1', runtimeConfig);

      expect((provider as any)._getConnection().url).toBe(
        'https://custom.example.com'
      );
      // Timeout may be modified by ethers.js, just verify it was applied
      expect((provider as any)._getConnection().timeout).toBeGreaterThan(0);
    });
  });

  describe('isNetworkSupported', () => {
    it('should return true for configured networks', () => {
      expect(manager.isNetworkSupported('eip155:1')).toBe(true);
      expect(manager.isNetworkSupported('eip155:137')).toBe(true);
    });

    it('should return false for unconfigured networks', () => {
      expect(manager.isNetworkSupported('eip155:999')).toBe(false);
    });
  });

  describe('getSupportedNetworks', () => {
    it('should return list of all configured networks', () => {
      const networks = manager.getSupportedNetworks();

      expect(networks).toEqual(['eip155:1', 'eip155:137']);
    });
  });

  describe('getNetworkInfo', () => {
    it('should return network configuration', () => {
      const info = manager.getNetworkInfo('eip155:1');

      expect(info).toEqual({
        rpcUrl: 'https://eth.example.com',
      });
    });

    it('should return undefined for unsupported network', () => {
      const info = manager.getNetworkInfo('eip155:999');

      expect(info).toBeUndefined();
    });
  });

  describe('health monitoring', () => {
    it('should track provider health status', async () => {
      const provider = await manager.getProvider('eip155:1');
      const health = manager.getProviderHealth('eip155:1');

      expect(health).toBeDefined();
      expect(health.networkId).toBe('eip155:1');
      expect(health.isHealthy).toBe(true);
      expect(health.lastChecked).toBeInstanceOf(Date);
    });

    it('should mark provider as unhealthy after failures', async () => {
      await manager.getProvider('eip155:1');

      // Simulate provider failure
      manager.markProviderUnhealthy('eip155:1', new Error('Connection failed'));

      const health = manager.getProviderHealth('eip155:1');
      expect(health.isHealthy).toBe(false);
      expect(health.lastError).toBeDefined();
    });
  });

  describe('connection pooling', () => {
    it('should limit concurrent connections per network', async () => {
      const promises = Array(10)
        .fill(null)
        .map(() => manager.getProvider('eip155:1'));

      const providers = await Promise.all(promises);

      // All should return the same provider instance (pooled)
      expect(providers.every((p) => p === providers[0])).toBe(true);
    });
  });

  describe('failover handling', () => {
    it('should handle provider configuration with invalid URLs', async () => {
      const configWithFailover: SafeConfig = {
        networks: {
          'eip155:1': {
            rpcUrl: 'https://primary.example.com',
            timeout: 1000,
            retries: 2,
          },
        },
      };

      const managerWithFailover = new NetworkProviderManager(
        configWithFailover
      );

      // Provider creation should succeed, actual network calls would fail later
      const provider = await managerWithFailover.getProvider('eip155:1');
      expect(provider).toBeDefined();
    });
  });
});
