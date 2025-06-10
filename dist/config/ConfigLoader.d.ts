import { SafeConfig } from './types.js';
/**
 * Configuration loader that supports multiple sources
 */
export declare class ConfigLoader {
    /**
     * Load configuration from environment variables
     */
    loadFromEnv(): SafeConfig;
    /**
     * Load configuration from a file path or object
     */
    loadFromFile(filePathOrObject: string | object): Promise<SafeConfig>;
    /**
     * Parse CAIP-2 network configurations from environment variables
     */
    parseCAIP2Networks(env: Record<string, string | undefined>): Record<string, {
        rpcUrl: string;
    }>;
    /**
     * Parse API keys from environment variables
     */
    private parseApiKeys;
}
