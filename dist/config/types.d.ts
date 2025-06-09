/**
 * Network configuration for a specific CAIP-2 network
 */
export interface NetworkConfig {
    rpcUrl: string;
    apiKey?: string | undefined;
    timeout?: number | undefined;
    retries?: number | undefined;
    transactionService?: string | undefined;
}
/**
 * API keys configuration
 */
export interface ApiKeysConfig {
    anthropic?: string | undefined;
    openai?: string | undefined;
    perplexity?: string | undefined;
    google?: string | undefined;
    mistral?: string | undefined;
    azure?: string | undefined;
    openrouter?: string | undefined;
    xai?: string | undefined;
    ollama?: string | undefined;
}
/**
 * Main configuration interface
 */
export interface SafeConfig {
    defaultNetwork?: string | undefined;
    networks?: Record<string, NetworkConfig> | undefined;
    apiKeys?: ApiKeysConfig | undefined;
}
/**
 * Runtime configuration override for a specific tool call
 */
export interface RuntimeConfigOverride {
    network?: string;
    rpcUrl?: string;
    apiKey?: string;
    timeout?: number;
    privateKey?: string;
    gasPrice?: string;
}
/**
 * Validation result type
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        issues?: Array<{
            path: string[];
            message: string;
        }>;
    };
}
