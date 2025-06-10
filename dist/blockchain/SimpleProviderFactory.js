import { JsonRpcProvider } from 'ethers';
/**
 * Simplified provider factory that focuses on working blockchain connections
 */
export class SimpleProviderFactory {
    providers = new Map();
    /**
     * Get or create RPC provider for network
     */
    async getProvider(networkId, rpcUrl) {
        if (!this.providers.has(networkId)) {
            const url = rpcUrl || this.getDefaultRpcUrl(networkId);
            const provider = new JsonRpcProvider(url);
            // Test connection
            await provider.getNetwork();
            this.providers.set(networkId, provider);
        }
        return this.providers.get(networkId);
    }
    /**
     * Get default RPC URL for network
     */
    getDefaultRpcUrl(networkId) {
        const rpcUrls = {
            'eip155:1': process.env.SAFE_RPC_EIP155_1 || 'https://eth.llamarpc.com',
            'eip155:137': process.env.SAFE_RPC_EIP155_137 || 'https://polygon.llamarpc.com',
            'eip155:42161': process.env.SAFE_RPC_EIP155_42161 || 'https://arbitrum.llamarpc.com',
            'eip155:10': process.env.SAFE_RPC_EIP155_10 || 'https://optimism.llamarpc.com',
            'eip155:8453': process.env.SAFE_RPC_EIP155_8453 || 'https://base.llamarpc.com',
            'eip155:100': process.env.SAFE_RPC_EIP155_100 || 'https://gnosis.llamarpc.com',
            'eip155:42220': process.env.SAFE_RPC_EIP155_42220 || 'https://celo.llamarpc.com',
            'eip155:43114': process.env.SAFE_RPC_EIP155_43114 || 'https://avalanche.llamarpc.com',
            'eip155:11155111': process.env.SAFE_RPC_EIP155_11155111 || 'https://sepolia.llamarpc.com'
        };
        const url = rpcUrls[networkId];
        if (!url) {
            throw new Error(`No RPC URL configured for network ${networkId}`);
        }
        return url;
    }
    /**
     * Extract chain ID from CAIP-2 network identifier
     */
    getChainIdFromNetworkId(networkId) {
        const parts = networkId.split(':');
        if (parts.length !== 2 || parts[0] !== 'eip155') {
            throw new Error(`Invalid network ID format: ${networkId}`);
        }
        const chainIdStr = parts[1];
        if (!chainIdStr) {
            throw new Error(`Missing chain ID in network ID: ${networkId}`);
        }
        const chainId = parseInt(chainIdStr);
        if (isNaN(chainId)) {
            throw new Error(`Invalid chain ID in network ID: ${networkId}`);
        }
        return chainId;
    }
    /**
     * Clear cached providers
     */
    clearCache() {
        this.providers.clear();
    }
}
