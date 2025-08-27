import { JsonRpcProvider } from 'ethers';
import { SafeError } from '../utils/SafeError.js';
/**
 * Network Provider Management with RPC failover support
 * Manages blockchain network connections using CAIP-2 identifiers
 */
export class NetworkManager {
    providers = new Map();
    networkConfigs = new Map();
    providerCache = new Map();
    CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    constructor() {
        this.initializeDefaultNetworks();
    }
    /**
     * Initialize default network configurations
     */
    initializeDefaultNetworks() {
        // Ethereum Mainnet
        this.networkConfigs.set('eip155:1', {
            name: 'Ethereum Mainnet',
            chainId: 1,
            rpcUrls: [
                'https://eth.llamarpc.com',
                'https://rpc.ankr.com/eth',
                'https://ethereum.publicnode.com',
                'https://1rpc.io/eth',
            ],
            blockExplorerUrl: 'https://etherscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        });
        // Polygon
        this.networkConfigs.set('eip155:137', {
            name: 'Polygon',
            chainId: 137,
            rpcUrls: [
                'https://polygon.llamarpc.com',
                'https://rpc.ankr.com/polygon',
                'https://polygon.rpc.blxrbdn.com',
                'https://1rpc.io/matic',
            ],
            blockExplorerUrl: 'https://polygonscan.com',
            nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
        });
        // Arbitrum One
        this.networkConfigs.set('eip155:42161', {
            name: 'Arbitrum One',
            chainId: 42161,
            rpcUrls: [
                'https://arbitrum.llamarpc.com',
                'https://rpc.ankr.com/arbitrum',
                'https://arbitrum.public-rpc.com',
                'https://1rpc.io/arb',
            ],
            blockExplorerUrl: 'https://arbiscan.io',
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        });
        // Sepolia Testnet
        this.networkConfigs.set('eip155:11155111', {
            name: 'Sepolia Testnet',
            chainId: 11155111,
            rpcUrls: [
                'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
                'https://rpc.ankr.com/eth_sepolia',
                'https://ethereum-sepolia.publicnode.com',
                'https://1rpc.io/sepolia',
            ],
            blockExplorerUrl: 'https://sepolia.etherscan.io',
            nativeCurrency: { name: 'Sepolia Ether', symbol: 'SEP', decimals: 18 },
        });
        // Hardhat Local Network
        this.networkConfigs.set('eip155:31337', {
            name: 'Hardhat Local Network',
            chainId: 31337,
            rpcUrls: ['http://localhost:8545', 'http://127.0.0.1:8545'],
            nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        });
    }
    /**
     * Get a provider for the specified network with failover support
     */
    async getProvider(networkId) {
        // Check cache first
        const cached = this.providerCache.get(networkId);
        if (cached && Date.now() - cached.lastUsed < this.CACHE_TTL) {
            try {
                // Test the cached provider
                await cached.provider.getBlockNumber();
                cached.lastUsed = Date.now();
                return cached.provider;
            }
            catch (error) {
                // Cached provider failed, remove from cache
                this.providerCache.delete(networkId);
            }
        }
        const networkConfig = this.networkConfigs.get(networkId);
        if (!networkConfig) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED', { networkId, supportedNetworks: Array.from(this.networkConfigs.keys()) });
        }
        // Try RPC URLs with failover
        let lastError;
        for (const rpcUrl of networkConfig.rpcUrls) {
            try {
                const provider = new JsonRpcProvider(rpcUrl);
                // Test the provider by getting block number
                await provider.getBlockNumber();
                // Verify chain ID matches
                const network = await provider.getNetwork();
                if (Number(network.chainId) !== networkConfig.chainId) {
                    throw new Error(`Chain ID mismatch: expected ${networkConfig.chainId}, got ${network.chainId}`);
                }
                // Cache the working provider
                this.providerCache.set(networkId, {
                    provider,
                    lastUsed: Date.now(),
                });
                return provider;
            }
            catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`RPC ${rpcUrl} failed for ${networkId}:`, lastError.message);
                continue;
            }
        }
        throw new SafeError(`All RPC providers failed for network ${networkId}`, 'PROVIDER_CONNECTION_FAILED', {
            networkId,
            rpcUrls: networkConfig.rpcUrls,
            lastError: lastError?.message,
        });
    }
    /**
     * Add a custom network configuration
     */
    addNetwork(networkId, config) {
        this.networkConfigs.set(networkId, config);
    }
    /**
     * Add custom RPC URL to existing network
     */
    addRpcUrl(networkId, rpcUrl) {
        const config = this.networkConfigs.get(networkId);
        if (!config) {
            throw new SafeError(`Network ${networkId} not found`, 'NETWORK_NOT_FOUND', { networkId });
        }
        if (!config.rpcUrls.includes(rpcUrl)) {
            config.rpcUrls.unshift(rpcUrl); // Add to front for priority
        }
    }
    /**
     * Get network configuration
     */
    getNetworkConfig(networkId) {
        return this.networkConfigs.get(networkId);
    }
    /**
     * Get all supported networks
     */
    getSupportedNetworks() {
        return Array.from(this.networkConfigs.keys());
    }
    /**
     * Check if network is supported
     */
    isNetworkSupported(networkId) {
        return this.networkConfigs.has(networkId);
    }
    /**
     * Parse CAIP-2 network identifier
     */
    parseNetworkId(networkId) {
        const parts = networkId.split(':');
        if (parts.length !== 2 || parts[0] !== 'eip155') {
            throw new SafeError(`Invalid network ID format: ${networkId}. Expected format: eip155:chainId`, 'INVALID_NETWORK_FORMAT', { networkId });
        }
        const chainId = parseInt(parts[1], 10);
        if (isNaN(chainId)) {
            throw new SafeError(`Invalid chain ID in network ID: ${networkId}`, 'INVALID_CHAIN_ID', { networkId });
        }
        return { namespace: parts[0], chainId };
    }
    /**
     * Create network ID from chain ID
     */
    createNetworkId(chainId) {
        return `eip155:${chainId}`;
    }
    /**
     * Test network connectivity
     */
    async testNetwork(networkId) {
        try {
            const startTime = Date.now();
            const provider = await this.getProvider(networkId);
            const blockNumber = await provider.getBlockNumber();
            const latency = Date.now() - startTime;
            return {
                success: true,
                latency,
                blockNumber,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : String(error),
            };
        }
    }
    /**
     * Clear provider cache
     */
    clearCache() {
        this.providerCache.clear();
    }
    /**
     * Get provider cache statistics
     */
    getCacheStats() {
        const entries = Array.from(this.providerCache.entries());
        const timestamps = entries.map(([, { lastUsed }]) => lastUsed);
        return {
            size: this.providerCache.size,
            networks: entries.map(([networkId]) => networkId),
            oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
            newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
        };
    }
}
