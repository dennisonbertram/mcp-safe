/**
 * SAFE contract registry for supported networks
 */
// SAFE v1.4.1 contract addresses (latest stable)
const SAFE_V1_4_1_ADDRESSES = {
    safeProxyFactory: '0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67',
    safeSingleton: '0x41675C099F32341bf84BFc5382aF534df5C7461a',
    safeSingletonL2: '0x29fcB43b46531BcA003ddC8FCB67FFE91900C762',
    compatibilityFallbackHandler: '0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99',
    multiSend: '0x38869bf66a61cF6bDB996A6aE40D5853Fd43B526',
    multiSendCallOnly: '0x9641d764fc13c8B624c04430C7356C1C7C8102e2',
    createCall: '0x9b35Af71d77eaf8d7e40252370304687390A1A52',
    signMessageLib: '0xd53cd0aB83D845Ac265BE939c57F53AD838012c9',
    simulateTxAccessor: '0x3d4BA2E0884aa488718476ca2FB8Efc291A46199',
};
// SAFE v1.3.0 contract addresses (legacy support)
const SAFE_V1_3_0_ADDRESSES = {
    safeProxyFactory: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
    safeSingleton: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
    safeSingletonL2: '0x3E5c63644E683549055b9Be8653de26E0B4CD36E',
    compatibilityFallbackHandler: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
    multiSend: '0xA238CBeb142c10Ef7Ad8442C6D1f9E89e07e7761',
    multiSendCallOnly: '0x40A2aCCbd92BCA938b02010E17A5b8929b49130D',
    createCall: '0x7cbB62EaA69F79e6873cD1ecB2392971036cFaA4',
    signMessageLib: '0xA65387F16B013cf2Af4605Ad8aA5ec25a2cbA3a2',
    simulateTxAccessor: '0x59AD6735bCd8152B84860Cb256dD9e96b85F69Da',
};
// Network-specific contract deployments
export const SAFE_DEPLOYMENTS = {
    // Ethereum Mainnet
    1: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Ethereum Sepolia
    11155111: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Polygon Mainnet
    137: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Polygon Mumbai
    80001: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Arbitrum One
    42161: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Arbitrum Sepolia
    421614: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Optimism Mainnet
    10: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Optimism Sepolia
    11155420: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Base Mainnet
    8453: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
    // Base Sepolia
    84532: {
        '1.4.1': SAFE_V1_4_1_ADDRESSES,
        '1.3.0': SAFE_V1_3_0_ADDRESSES,
    },
};
export class SafeContractRegistry {
    static DEFAULT_VERSION = '1.4.1';
    /**
     * Get SAFE contract addresses for a specific chain and version
     */
    static getContractAddresses(chainId, version = SafeContractRegistry.DEFAULT_VERSION) {
        const chainDeployments = SAFE_DEPLOYMENTS[chainId];
        if (!chainDeployments) {
            return undefined;
        }
        return chainDeployments[version];
    }
    /**
     * Get the latest SAFE contract addresses for a chain
     */
    static getLatestContractAddresses(chainId) {
        return this.getContractAddresses(chainId, this.DEFAULT_VERSION);
    }
    /**
     * Get all available SAFE versions for a chain
     */
    static getAvailableVersions(chainId) {
        const chainDeployments = SAFE_DEPLOYMENTS[chainId];
        if (!chainDeployments) {
            return [];
        }
        return Object.keys(chainDeployments);
    }
    /**
     * Check if SAFE contracts are deployed on a chain
     */
    static isChainSupported(chainId) {
        return chainId in SAFE_DEPLOYMENTS;
    }
    /**
     * Check if a specific SAFE version is available on a chain
     */
    static isVersionAvailable(chainId, version) {
        const chainDeployments = SAFE_DEPLOYMENTS[chainId];
        return chainDeployments ? version in chainDeployments : false;
    }
    /**
     * Get the proxy factory address for a chain and version
     */
    static getProxyFactoryAddress(chainId, version = SafeContractRegistry.DEFAULT_VERSION) {
        const addresses = this.getContractAddresses(chainId, version);
        return addresses?.safeProxyFactory;
    }
    /**
     * Get the singleton address for a chain and version
     */
    static getSingletonAddress(chainId, version = SafeContractRegistry.DEFAULT_VERSION, isL2 = false) {
        const addresses = this.getContractAddresses(chainId, version);
        if (!addresses) {
            return undefined;
        }
        // Use L2 singleton if available and requested, otherwise use regular singleton
        return isL2 && addresses.safeSingletonL2 ? addresses.safeSingletonL2 : addresses.safeSingleton;
    }
    /**
     * Get the MultiSend address for a chain and version
     */
    static getMultiSendAddress(chainId, version = SafeContractRegistry.DEFAULT_VERSION, callOnly = false) {
        const addresses = this.getContractAddresses(chainId, version);
        if (!addresses) {
            return undefined;
        }
        return callOnly ? addresses.multiSendCallOnly : addresses.multiSend;
    }
    /**
     * Get the fallback handler address for a chain and version
     */
    static getFallbackHandlerAddress(chainId, version = SafeContractRegistry.DEFAULT_VERSION) {
        const addresses = this.getContractAddresses(chainId, version);
        return addresses?.compatibilityFallbackHandler;
    }
    /**
     * Validate that all required contracts are available for a chain
     */
    static validateDeployment(chainId, version = SafeContractRegistry.DEFAULT_VERSION) {
        const addresses = this.getContractAddresses(chainId, version);
        const missing = [];
        if (!addresses) {
            return {
                isValid: false,
                missing: ['All contracts - chain not supported'],
            };
        }
        // Check for required core contracts
        const requiredContracts = [
            'safeProxyFactory',
            'safeSingleton',
            'compatibilityFallbackHandler',
            'multiSend',
            'multiSendCallOnly',
        ];
        for (const contract of requiredContracts) {
            if (!addresses[contract]) {
                missing.push(contract);
            }
        }
        return {
            isValid: missing.length === 0,
            missing,
        };
    }
    /**
     * Get all supported chain IDs
     */
    static getSupportedChainIds() {
        return Object.keys(SAFE_DEPLOYMENTS).map(Number);
    }

    /**
     * Alias for getContractAddresses for backward compatibility
     */
    static getContractsForChain(chainId, version = SafeContractRegistry.DEFAULT_VERSION) {
        const contracts = this.getContractAddresses(chainId, version);
        // Convert to expected format for multi-network compatibility
        if (!contracts) return [];
        
        return [{
            version: version,
            addresses: contracts
        }];
    }
}

// Export the class as a singleton-like object for compatibility
export const safeContractRegistry = {
    getContractsForChain: SafeContractRegistry.getContractsForChain.bind(SafeContractRegistry),
    getContractAddresses: SafeContractRegistry.getContractAddresses.bind(SafeContractRegistry),
    isChainSupported: SafeContractRegistry.isChainSupported.bind(SafeContractRegistry),
    getSupportedChainIds: SafeContractRegistry.getSupportedChainIds.bind(SafeContractRegistry),
    getProxyFactoryAddress: SafeContractRegistry.getProxyFactoryAddress.bind(SafeContractRegistry),
    getSingletonAddress: SafeContractRegistry.getSingletonAddress.bind(SafeContractRegistry),
    getMultiSendAddress: SafeContractRegistry.getMultiSendAddress.bind(SafeContractRegistry),
    getFallbackHandlerAddress: SafeContractRegistry.getFallbackHandlerAddress.bind(SafeContractRegistry),
    validateDeployment: SafeContractRegistry.validateDeployment.bind(SafeContractRegistry)
};

//# sourceMappingURL=contracts.js.map