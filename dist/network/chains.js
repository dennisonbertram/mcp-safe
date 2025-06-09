/**
 * Chain configuration manager for SAFE-supported blockchain networks
 */
export const SUPPORTED_CHAINS = {
    // Ethereum Mainnet
    1: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        shortName: 'eth',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://ethereum-rpc.publicnode.com',
            'https://eth.drpc.org',
            'https://rpc.ankr.com/eth',
        ],
        blockExplorerUrls: ['https://etherscan.io'],
        safeServiceUrl: 'https://safe-transaction-mainnet.safe.global',
        isTestnet: false,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Ethereum Sepolia (Testnet)
    11155111: {
        chainId: 11155111,
        name: 'Ethereum Sepolia',
        shortName: 'sep',
        nativeCurrency: {
            name: 'Sepolia Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://ethereum-sepolia-rpc.publicnode.com',
            'https://sepolia.drpc.org',
            'https://rpc.ankr.com/eth_sepolia',
        ],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
        safeServiceUrl: 'https://safe-transaction-sepolia.safe.global',
        isTestnet: true,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Polygon Mainnet
    137: {
        chainId: 137,
        name: 'Polygon',
        shortName: 'matic',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        rpcUrls: [
            'https://polygon-rpc.com',
            'https://polygon.drpc.org',
            'https://rpc.ankr.com/polygon',
        ],
        blockExplorerUrls: ['https://polygonscan.com'],
        safeServiceUrl: 'https://safe-transaction-polygon.safe.global',
        isTestnet: false,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Polygon Mumbai (Testnet)
    80001: {
        chainId: 80001,
        name: 'Polygon Mumbai',
        shortName: 'mumbai',
        nativeCurrency: {
            name: 'MATIC',
            symbol: 'MATIC',
            decimals: 18,
        },
        rpcUrls: [
            'https://polygon-mumbai-bor-rpc.publicnode.com',
            'https://polygon-mumbai.drpc.org',
            'https://rpc.ankr.com/polygon_mumbai',
        ],
        blockExplorerUrls: ['https://mumbai.polygonscan.com'],
        safeServiceUrl: 'https://safe-transaction-mumbai.safe.global',
        isTestnet: true,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Arbitrum One
    42161: {
        chainId: 42161,
        name: 'Arbitrum One',
        shortName: 'arb1',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://arbitrum-one-rpc.publicnode.com',
            'https://arbitrum.drpc.org',
            'https://rpc.ankr.com/arbitrum',
        ],
        blockExplorerUrls: ['https://arbiscan.io'],
        safeServiceUrl: 'https://safe-transaction-arbitrum.safe.global',
        isTestnet: false,
        features: {
            eip1559: false,
            multicall: true,
        },
    },
    // Arbitrum Sepolia (Testnet)
    421614: {
        chainId: 421614,
        name: 'Arbitrum Sepolia',
        shortName: 'arb-sep',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://arbitrum-sepolia-rpc.publicnode.com',
            'https://arbitrum-sepolia.drpc.org',
        ],
        blockExplorerUrls: ['https://sepolia.arbiscan.io'],
        safeServiceUrl: 'https://safe-transaction-arbitrum-sepolia.safe.global',
        isTestnet: true,
        features: {
            eip1559: false,
            multicall: true,
        },
    },
    // Optimism Mainnet
    10: {
        chainId: 10,
        name: 'Optimism',
        shortName: 'oeth',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://optimism-rpc.publicnode.com',
            'https://optimism.drpc.org',
            'https://rpc.ankr.com/optimism',
        ],
        blockExplorerUrls: ['https://optimistic.etherscan.io'],
        safeServiceUrl: 'https://safe-transaction-optimism.safe.global',
        isTestnet: false,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Optimism Sepolia (Testnet)
    11155420: {
        chainId: 11155420,
        name: 'Optimism Sepolia',
        shortName: 'op-sep',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://optimism-sepolia-rpc.publicnode.com',
            'https://optimism-sepolia.drpc.org',
        ],
        blockExplorerUrls: ['https://sepolia-optimism.etherscan.io'],
        safeServiceUrl: 'https://safe-transaction-optimism-sepolia.safe.global',
        isTestnet: true,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Base Mainnet
    8453: {
        chainId: 8453,
        name: 'Base',
        shortName: 'base',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://base-rpc.publicnode.com',
            'https://base.drpc.org',
            'https://rpc.ankr.com/base',
        ],
        blockExplorerUrls: ['https://basescan.org'],
        safeServiceUrl: 'https://safe-transaction-base.safe.global',
        isTestnet: false,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
    // Base Sepolia (Testnet)
    84532: {
        chainId: 84532,
        name: 'Base Sepolia',
        shortName: 'base-sep',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: [
            'https://base-sepolia-rpc.publicnode.com',
            'https://base-sepolia.drpc.org',
        ],
        blockExplorerUrls: ['https://sepolia.basescan.org'],
        safeServiceUrl: 'https://safe-transaction-base-sepolia.safe.global',
        isTestnet: true,
        features: {
            eip1559: true,
            multicall: true,
        },
    },
};
export class ChainManager {
    /**
     * Get chain configuration by chain ID
     */
    static getChain(chainId) {
        return SUPPORTED_CHAINS[chainId];
    }
    /**
     * Get all supported chain IDs
     */
    static getSupportedChainIds() {
        return Object.keys(SUPPORTED_CHAINS).map(Number);
    }
    /**
     * Get all mainnet chains
     */
    static getMainnetChains() {
        return Object.values(SUPPORTED_CHAINS).filter(chain => !chain.isTestnet);
    }
    /**
     * Get all testnet chains
     */
    static getTestnetChains() {
        return Object.values(SUPPORTED_CHAINS).filter(chain => chain.isTestnet);
    }
    /**
     * Check if a chain is supported
     */
    static isChainSupported(chainId) {
        return chainId in SUPPORTED_CHAINS;
    }
    /**
     * Get chain by short name
     */
    static getChainByShortName(shortName) {
        return Object.values(SUPPORTED_CHAINS).find(chain => chain.shortName === shortName);
    }
    /**
     * Get chains with SAFE service support
     */
    static getChainsWithSafeService() {
        return Object.values(SUPPORTED_CHAINS).filter(chain => chain.safeServiceUrl);
    }
    /**
     * Validate chain configuration
     */
    static validateChain(chainId) {
        const errors = [];
        const chain = SUPPORTED_CHAINS[chainId];
        if (!chain) {
            errors.push(`Chain ${chainId} is not supported`);
            return { isValid: false, errors };
        }
        if (!chain.rpcUrls || chain.rpcUrls.length === 0) {
            errors.push(`Chain ${chainId} has no RPC URLs configured`);
        }
        if (!chain.safeServiceUrl && !chain.isTestnet) {
            errors.push(`Mainnet chain ${chainId} should have a SAFE service URL`);
        }
        return { isValid: errors.length === 0, errors };
    }
}

// Export the class as both named export and default for compatibility
export const chainManager = ChainManager;

//# sourceMappingURL=chains.js.map