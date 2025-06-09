/**
 * Configuration merger that handles priority-based merging
 */
export class ConfigMerger {
    /**
     * Merge multiple configurations with priority order:
     * runtime > env > file > defaults
     */
    mergeConfigs(defaults, fileConfig = {}, envConfig = {}, runtimeConfig = {}) {
        // Start with defaults
        let result = this.deepClone(defaults);
        // Merge file config (overrides defaults)
        result = this.deepMerge(result, fileConfig);
        // Merge env config (overrides file and defaults)
        result = this.deepMerge(result, envConfig);
        // Merge runtime config (highest priority)
        result = this.deepMerge(result, runtimeConfig);
        return result;
    }
    /**
     * Apply runtime overrides to a base configuration
     */
    applyRuntimeOverrides(baseConfig, overrides) {
        const result = this.deepClone(baseConfig);
        if (overrides.network) {
            // Initialize networks if not exists
            if (!result.networks) {
                result.networks = {};
            }
            // Initialize the specific network if not exists
            if (!result.networks[overrides.network]) {
                result.networks[overrides.network] = { rpcUrl: '' };
            }
            // Apply overrides to the specific network
            const networkConfig = result.networks[overrides.network];
            if (networkConfig) {
                if (overrides.rpcUrl) {
                    networkConfig.rpcUrl = overrides.rpcUrl;
                }
                if (overrides.apiKey) {
                    networkConfig.apiKey = overrides.apiKey;
                }
                if (overrides.timeout) {
                    networkConfig.timeout = overrides.timeout;
                }
            }
        }
        return result;
    }
    /**
     * Deep merge two configuration objects
     */
    deepMerge(target, source) {
        const result = this.deepClone(target);
        // Handle defaultNetwork
        if (source.defaultNetwork !== undefined) {
            result.defaultNetwork = source.defaultNetwork;
        }
        // Handle networks
        if (source.networks) {
            if (!result.networks) {
                result.networks = {};
            }
            // Merge each network configuration
            for (const [networkId, networkConfig] of Object.entries(source.networks)) {
                if (result.networks[networkId]) {
                    // Deep merge existing network config
                    result.networks[networkId] = {
                        ...result.networks[networkId],
                        ...networkConfig,
                    };
                }
                else {
                    // Add new network config
                    result.networks[networkId] = { ...networkConfig };
                }
            }
        }
        // Handle apiKeys
        if (source.apiKeys) {
            if (!result.apiKeys) {
                result.apiKeys = {};
            }
            // Merge API keys
            for (const [key, value] of Object.entries(source.apiKeys)) {
                if (value !== undefined) {
                    result.apiKeys[key] = value;
                }
            }
        }
        return result;
    }
    /**
     * Deep clone a configuration object
     */
    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        return JSON.parse(JSON.stringify(obj));
    }
}
