import { JsonRpcProvider } from 'ethers';
import { SafeConfig } from '../config/types';
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
export declare class NetworkProviderManager {
    private config;
    private providers;
    private healthStatus;
    constructor(config: SafeConfig);
    getProvider(networkId: string, runtimeConfig?: RuntimeProviderConfig): Promise<JsonRpcProvider>;
    isNetworkSupported(networkId: string): boolean;
    getSupportedNetworks(): string[];
    getNetworkInfo(networkId: string): import("../config/types").NetworkConfig | undefined;
    getProviderHealth(networkId: string): ProviderHealth;
    markProviderUnhealthy(networkId: string, error: Error): void;
}
