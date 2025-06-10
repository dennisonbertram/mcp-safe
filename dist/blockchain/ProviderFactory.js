import { JsonRpcProvider, Wallet } from 'ethers';
import SafeApiKit from '@safe-global/api-kit';
import Safe, { EthersAdapter, SafeFactory } from '@safe-global/protocol-kit';
/**
 * Factory for creating blockchain providers and Safe SDK instances
 */
export class ProviderFactory {
    providers = new Map();
    adapters = new Map();
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
     * Create EthersAdapter for Safe SDK
     */
    async getEthersAdapter(networkId, privateKey, rpcUrl) {
        const cacheKey = `${networkId}-${privateKey ? 'signed' : 'readonly'}`;
        if (!this.adapters.has(cacheKey)) {
            const provider = await this.getProvider(networkId, rpcUrl);
            let signer;
            if (privateKey) {
                signer = new Wallet(privateKey, provider);
            }
            else {
                // Read-only adapter for queries
                signer = provider;
            }
            const adapter = new EthersAdapter({
                ethers: { signer }
            });
            this.adapters.set(cacheKey, adapter);
        }
        return this.adapters.get(cacheKey);
    }
    /**
     * Create Safe API Kit instance
     */
    async getSafeApiKit(networkId) {
        const chainId = this.getChainIdFromNetworkId(networkId);
        return new SafeApiKit({
            chainId: BigInt(chainId),
        });
    }
    /**
     * Create Safe SDK instance
     */
    async getSafe(safeAddress, networkId, privateKey, rpcUrl) {
        const ethAdapter = await this.getEthersAdapter(networkId, privateKey, rpcUrl);
        return await Safe.init({
            ethAdapter,
            safeAddress
        });
    }
    /**
     * Create Safe Factory for deployment
     */
    async getSafeFactory(networkId, privateKey, rpcUrl) {
        const ethAdapter = await this.getEthersAdapter(networkId, privateKey, rpcUrl);
        return await SafeFactory.init({
            ethAdapter
        });
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
        if (!rpcUrls[networkId]) {
            throw new Error(`No RPC URL configured for network ${networkId}`);
        }
        return rpcUrls[networkId];
    }
    /**
     * Extract chain ID from CAIP-2 network identifier
     */
    getChainIdFromNetworkId(networkId) {
        const parts = networkId.split(':');
        if (parts.length !== 2 || parts[0] !== 'eip155') {
            throw new Error(`Invalid network ID format: ${networkId}`);
        }
        return parseInt(parts[1]);
    }
    /**
     * Clear cached providers and adapters
     */
    clearCache() {
        this.providers.clear();
        this.adapters.clear();
    }
}
