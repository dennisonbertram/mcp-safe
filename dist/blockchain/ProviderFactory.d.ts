import { JsonRpcProvider } from 'ethers';
import { SafeFactory } from '@safe-global/protocol-kit';
/**
 * Factory for creating blockchain providers and Safe SDK instances
 */
export declare class ProviderFactory {
    private providers;
    /**
     * Get or create RPC provider for network
     */
    getProvider(networkId: string, rpcUrl?: string): Promise<JsonRpcProvider>;
    /**
     * Get ethers provider URL for Safe SDK
     */
    private getProviderUrl;
    /**
     * Create Safe SDK instance
     */
    getSafe(safeAddress: string, networkId: string, privateKey?: string, rpcUrl?: string): Promise<any>;
    /**
     * Create Safe Factory for deployment
     */
    getSafeFactory(networkId: string, privateKey: string, rpcUrl?: string): Promise<SafeFactory>;
    /**
     * Get default RPC URL for network
     */
    private getDefaultRpcUrl;
    /**
     * Clear cached providers
     */
    clearCache(): void;
}
