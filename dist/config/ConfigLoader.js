import * as fs from 'fs/promises';
/**
 * Configuration loader that supports multiple sources
 */
export class ConfigLoader {
    /**
     * Load configuration from environment variables
     */
    loadFromEnv() {
        const config = {
            networks: {},
            apiKeys: {},
        };
        // Parse CAIP-2 network configurations
        config.networks = this.parseCAIP2Networks(process.env);
        // Parse API keys
        config.apiKeys = this.parseApiKeys(process.env);
        // Set default network if specified
        if (process.env.SAFE_DEFAULT_NETWORK) {
            config.defaultNetwork = process.env.SAFE_DEFAULT_NETWORK;
        }
        // Clean up empty objects
        if (Object.keys(config.networks).length === 0) {
            delete config.networks;
        }
        if (Object.keys(config.apiKeys).length === 0) {
            delete config.apiKeys;
        }
        return config;
    }
    /**
     * Load configuration from a file path or object
     */
    async loadFromFile(filePathOrObject) {
        try {
            if (typeof filePathOrObject === 'object') {
                return filePathOrObject;
            }
            const content = await fs.readFile(filePathOrObject, 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            // Return empty config if file doesn't exist or can't be parsed
            return {};
        }
    }
    /**
     * Parse CAIP-2 network configurations from environment variables
     */
    parseCAIP2Networks(env) {
        const networks = {};
        // Look for SAFE_RPC_EIP155_* environment variables
        for (const [key, value] of Object.entries(env)) {
            if (key.startsWith('SAFE_RPC_EIP155_') && value) {
                // Extract chain ID from environment variable name
                const chainId = key.replace('SAFE_RPC_EIP155_', '');
                const networkId = `eip155:${chainId}`;
                networks[networkId] = {
                    rpcUrl: value,
                };
            }
        }
        return networks;
    }
    /**
     * Parse API keys from environment variables
     */
    parseApiKeys(env) {
        const apiKeys = {};
        // Map environment variable names to config keys
        const keyMapping = {
            ANTHROPIC_API_KEY: 'anthropic',
            OPENAI_API_KEY: 'openai',
            PERPLEXITY_API_KEY: 'perplexity',
            GOOGLE_API_KEY: 'google',
            MISTRAL_API_KEY: 'mistral',
            AZURE_OPENAI_API_KEY: 'azure',
            OPENROUTER_API_KEY: 'openrouter',
            XAI_API_KEY: 'xai',
            OLLAMA_API_KEY: 'ollama',
        };
        for (const [envKey, configKey] of Object.entries(keyMapping)) {
            if (env[envKey]) {
                apiKeys[configKey] = env[envKey];
            }
        }
        return apiKeys;
    }
}
