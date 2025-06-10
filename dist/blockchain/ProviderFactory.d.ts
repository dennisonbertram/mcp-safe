import { JsonRpcProvider } from 'ethers';
import SafeApiKit from '@safe-global/api-kit';
import Safe, { EthersAdapter, SafeFactory } from '@safe-global/protocol-kit';
/**
 * Factory for creating blockchain providers and Safe SDK instances
 */
export declare class ProviderFactory {
    private providers;
    private adapters;
    /**
     * Get or create RPC provider for network
     */
    getProvider(networkId: string, rpcUrl?: string): Promise<JsonRpcProvider>;
    /**
     * Create EthersAdapter for Safe SDK
     */
    getEthersAdapter(networkId: string, privateKey?: string, rpcUrl?: string): Promise<EthersAdapter>;
    /**
     * Create Safe API Kit instance
     */
    getSafeApiKit(networkId: string): Promise<SafeApiKit>;
    /**
     * Create Safe SDK instance
     */
    getSafe(safeAddress: string, networkId: string, privateKey?: string, rpcUrl?: string): Promise<Safe>;
    /**
     * Create Safe Factory for deployment
     */
    getSafeFactory(networkId: string, privateKey: string, rpcUrl?: string): Promise<SafeFactory>;
    /**
     * Get default RPC URL for network
     */
    private getDefaultRpcUrl;
    /**
     * Extract chain ID from CAIP-2 network identifier
     */
    private getChainIdFromNetworkId;
    /**
     * Clear cached providers and adapters
     */
    clearCache(): void;
}
