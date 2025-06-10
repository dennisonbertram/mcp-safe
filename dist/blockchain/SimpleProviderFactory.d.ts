import { JsonRpcProvider } from 'ethers';
/**
 * Simplified provider factory that focuses on working blockchain connections
 */
export declare class SimpleProviderFactory {
    private providers;
    /**
     * Get or create RPC provider for network
     */
    getProvider(networkId: string, rpcUrl?: string): Promise<JsonRpcProvider>;
    /**
     * Get default RPC URL for network
     */
    private getDefaultRpcUrl;
    /**
     * Extract chain ID from CAIP-2 network identifier
     */
    getChainIdFromNetworkId(networkId: string): number;
    /**
     * Clear cached providers
     */
    clearCache(): void;
}
