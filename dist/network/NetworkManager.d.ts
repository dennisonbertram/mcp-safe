import { JsonRpcProvider } from 'ethers';
export interface NetworkConfig {
    name: string;
    chainId: number;
    rpcUrls: string[];
    blockExplorerUrl?: string;
    nativeCurrency?: {
        name: string;
        symbol: string;
        decimals: number;
    };
}
/**
 * Network Provider Management with RPC failover support
 * Manages blockchain network connections using CAIP-2 identifiers
 */
export declare class NetworkManager {
    private providers;
    private networkConfigs;
    private providerCache;
    private readonly CACHE_TTL;
    constructor();
    /**
     * Initialize default network configurations
     */
    private initializeDefaultNetworks;
    /**
     * Get a provider for the specified network with failover support
     */
    getProvider(networkId: string): Promise<JsonRpcProvider>;
    /**
     * Add a custom network configuration
     */
    addNetwork(networkId: string, config: NetworkConfig): void;
    /**
     * Add custom RPC URL to existing network
     */
    addRpcUrl(networkId: string, rpcUrl: string): void;
    /**
     * Get network configuration
     */
    getNetworkConfig(networkId: string): NetworkConfig | undefined;
    /**
     * Get all supported networks
     */
    getSupportedNetworks(): string[];
    /**
     * Check if network is supported
     */
    isNetworkSupported(networkId: string): boolean;
    /**
     * Parse CAIP-2 network identifier
     */
    parseNetworkId(networkId: string): {
        namespace: string;
        chainId: number;
    };
    /**
     * Create network ID from chain ID
     */
    createNetworkId(chainId: number): string;
    /**
     * Test network connectivity
     */
    testNetwork(networkId: string): Promise<{
        success: boolean;
        latency?: number;
        blockNumber?: number;
        error?: string;
    }>;
    /**
     * Clear provider cache
     */
    clearCache(): void;
    /**
     * Get provider cache statistics
     */
    getCacheStats(): {
        size: number;
        networks: string[];
        oldestEntry: number;
        newestEntry: number;
    };
}
