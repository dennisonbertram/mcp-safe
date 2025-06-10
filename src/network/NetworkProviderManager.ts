import { JsonRpcProvider } from 'ethers';
import { SafeConfig } from '../config/types.js';
import { SafeError } from '../utils/SafeError.js';

export interface RuntimeProviderConfig {
  rpcUrl?: string;
  timeout?: number;
  retries?: number;
}

export interface ProviderHealth {
  networkId: string;
  isHealthy: boolean;
  lastChecked: Date;
  lastError?: Error;
}

export class NetworkProviderManager {
  private config: SafeConfig;
  private providers: Map<string, JsonRpcProvider> = new Map();
  private healthStatus: Map<string, ProviderHealth> = new Map();

  constructor(config: SafeConfig) {
    this.config = config;
  }

  async getProvider(
    networkId: string,
    runtimeConfig?: RuntimeProviderConfig
  ): Promise<JsonRpcProvider> {
    // Check if network is configured
    if (!this.isNetworkSupported(networkId)) {
      throw new SafeError(
        `Network ${networkId} is not configured`,
        'NETWORK_NOT_CONFIGURED'
      );
    }

    // Check if provider already exists and no runtime config override
    if (!runtimeConfig && this.providers.has(networkId)) {
      return this.providers.get(networkId)!;
    }

    // Get network configuration
    const networkConfig = this.config.networks![networkId];
    const rpcUrl = runtimeConfig?.rpcUrl || networkConfig!.rpcUrl;
    const timeout = runtimeConfig?.timeout || networkConfig!.timeout;

    // Create provider with configuration
    const provider = new JsonRpcProvider(rpcUrl);

    // Set timeout if specified - must be done after first connection
    if (timeout) {
      const connection = (provider as any)._getConnection();
      connection.timeout = timeout;
    }

    // Store provider if no runtime config (for reuse)
    if (!runtimeConfig) {
      this.providers.set(networkId, provider);
    }

    // Update health status
    this.healthStatus.set(networkId, {
      networkId,
      isHealthy: true,
      lastChecked: new Date(),
    });

    return provider;
  }

  isNetworkSupported(networkId: string): boolean {
    return this.config.networks ? networkId in this.config.networks : false;
  }

  getSupportedNetworks(): string[] {
    return this.config.networks ? Object.keys(this.config.networks) : [];
  }

  getNetworkInfo(networkId: string) {
    if (!this.isNetworkSupported(networkId) || !this.config.networks) {
      return undefined;
    }
    return this.config.networks[networkId];
  }

  getProviderHealth(networkId: string): ProviderHealth {
    return this.healthStatus.get(networkId)!;
  }

  markProviderUnhealthy(networkId: string, error: Error): void {
    const existing = this.healthStatus.get(networkId);
    if (existing) {
      this.healthStatus.set(networkId, {
        ...existing,
        isHealthy: false,
        lastError: error,
        lastChecked: new Date(),
      });
    }
  }
}
