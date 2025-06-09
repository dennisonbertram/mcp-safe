/**
 * Network provider manager with connection pooling and fallback mechanisms
 */
import { ethers } from 'ethers';
import { ChainManager } from './chains.js';
import logger from '../utils/logger.js';
export class NetworkProviderManager {
    pools = new Map();
    config;
    healthCheckIntervals = new Map();
    constructor(config = {}) {
        this.config = {
            maxRetries: 3,
            retryDelay: 1000,
            timeout: 30000,
            enableFallback: true,
            connectionPoolSize: 3,
            healthCheckInterval: 60000, // 1 minute
            ...config,
        };
        logger.info('NetworkProviderManager initialized', { config: this.config });
    }
    /**
     * Initialize provider pool for a specific chain
     */
    async initializeChain(chainId) {
        const chainConfig = ChainManager.getChain(chainId);
        if (!chainConfig) {
            throw new Error(`Chain ${chainId} is not supported`);
        }
        if (this.pools.has(chainId)) {
            logger.debug(`Chain ${chainId} already initialized`);
            return;
        }
        logger.info(`Initializing provider pool for chain ${chainId}`, {
            chainName: chainConfig.name,
            rpcUrls: chainConfig.rpcUrls.length,
        });
        const providers = [];
        const stats = new Map();
        // Create providers for each RPC URL up to pool size
        const urlsToUse = chainConfig.rpcUrls.slice(0, this.config.connectionPoolSize);
        for (const rpcUrl of urlsToUse) {
            try {
                const provider = new ethers.JsonRpcProvider(rpcUrl, {
                    chainId: chainConfig.chainId,
                    name: chainConfig.name,
                });
                // Set timeout
                provider.pollingInterval = 4000;
                // Initialize stats
                stats.set(rpcUrl, {
                    totalRequests: 0,
                    successfulRequests: 0,
                    failedRequests: 0,
                    averageResponseTime: 0,
                    lastHealthCheck: null,
                    isHealthy: true,
                });
                providers.push(provider);
                logger.debug(`Added provider for ${chainConfig.name}`, { rpcUrl });
            }
            catch (error) {
                logger.warn(`Failed to create provider for ${rpcUrl}`, { error, chainId });
            }
        }
        if (providers.length === 0) {
            throw new Error(`No working providers available for chain ${chainId}`);
        }
        const pool = {
            providers,
            currentIndex: 0,
            stats,
            config: chainConfig,
        };
        this.pools.set(chainId, pool);
        // Start health checks
        await this.startHealthChecks(chainId);
        logger.info(`Provider pool initialized for chain ${chainId}`, {
            chainName: chainConfig.name,
            providerCount: providers.length,
        });
    }
    /**
     * Get a provider for a specific chain with load balancing
     */
    async getProvider(chainId, customProviderUrl = null, customApiKey = null) {
        // If custom provider URL is provided, create and return a custom provider
        if (customProviderUrl) {
            return this.createCustomProvider(chainId, customProviderUrl, customApiKey);
        }
        
        if (!this.pools.has(chainId)) {
            await this.initializeChain(chainId);
        }
        const pool = this.pools.get(chainId);
        const healthyProviders = this.getHealthyProviders(pool);
        if (healthyProviders.length === 0) {
            throw new Error(`No healthy providers available for chain ${chainId}`);
        }
        // Round-robin load balancing among healthy providers
        const providerIndex = pool.currentIndex % healthyProviders.length;
        const provider = healthyProviders[providerIndex];
        if (!provider) {
            throw new Error(`No provider available at index ${providerIndex} for chain ${chainId}`);
        }
        pool.currentIndex = (pool.currentIndex + 1) % healthyProviders.length;
        return provider;
    }
    /**
     * Execute a request with retry logic and fallback
     */
    async executeRequest(chainId, operation, operationName = 'request') {
        const pool = this.pools.get(chainId);
        if (!pool) {
            throw new Error(`Chain ${chainId} not initialized`);
        }
        let lastError = null;
        const startTime = Date.now();
        for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
            try {
                const provider = await this.getProvider(chainId);
                const rpcUrl = await this.getProviderUrl(provider);
                logger.debug(`Executing ${operationName} on chain ${chainId}`, {
                    attempt: attempt + 1,
                    rpcUrl,
                });
                // Update stats
                const stats = pool.stats.get(rpcUrl);
                if (stats) {
                    stats.totalRequests++;
                }
                const result = await Promise.race([
                    operation(provider),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Request timeout')), this.config.timeout)),
                ]);
                // Update successful request stats
                if (stats) {
                    stats.successfulRequests++;
                    const responseTime = Date.now() - startTime;
                    stats.averageResponseTime =
                        (stats.averageResponseTime * (stats.successfulRequests - 1) + responseTime) / stats.successfulRequests;
                }
                logger.debug(`${operationName} successful on chain ${chainId}`, {
                    attempt: attempt + 1,
                    responseTime: Date.now() - startTime,
                });
                return result;
            }
            catch (error) {
                lastError = error;
                logger.warn(`${operationName} failed on chain ${chainId}`, {
                    attempt: attempt + 1,
                    error: lastError.message,
                });
                // Update failed request stats
                const provider = await this.getProvider(chainId);
                const rpcUrl = await this.getProviderUrl(provider);
                const stats = pool.stats.get(rpcUrl);
                if (stats) {
                    stats.failedRequests++;
                    // Mark as unhealthy if failure rate is high
                    const failureRate = stats.failedRequests / stats.totalRequests;
                    if (failureRate > 0.5 && stats.totalRequests > 10) {
                        stats.isHealthy = false;
                    }
                }
                // Wait before retry
                if (attempt < this.config.maxRetries - 1) {
                    await this.delay(this.config.retryDelay * Math.pow(2, attempt));
                }
            }
        }
        throw new Error(`Failed to execute ${operationName} on chain ${chainId} after ${this.config.maxRetries} attempts: ${lastError?.message}`);
    }
    /**
     * Get network information for a chain
     */
    async getNetworkInfo(chainId) {
        return this.executeRequest(chainId, async (provider) => await provider.getNetwork(), 'getNetwork');
    }
    /**
     * Get current block number
     */
    async getBlockNumber(chainId) {
        return this.executeRequest(chainId, async (provider) => await provider.getBlockNumber(), 'getBlockNumber');
    }
    /**
     * Get gas price information
     */
    async getGasPrice(chainId) {
        const chainConfig = ChainManager.getChain(chainId);
        if (!chainConfig) {
            throw new Error(`Chain ${chainId} not supported`);
        }
        if (chainConfig.features.eip1559) {
            const feeData = await this.executeRequest(chainId, async (provider) => await provider.getFeeData(), 'getFeeData');
            const result = {};
            if (feeData.maxFeePerGas) {
                result.maxFeePerGas = feeData.maxFeePerGas;
            }
            if (feeData.maxPriorityFeePerGas) {
                result.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
            }
            return result;
        }
        else {
            const feeData = await this.executeRequest(chainId, async (provider) => await provider.getFeeData(), 'getFeeData');
            const result = {};
            if (feeData.gasPrice) {
                result.gasPrice = feeData.gasPrice;
            }
            return result;
        }
    }
    /**
     * Get provider statistics for a chain
     */
    getProviderStats(chainId) {
        const pool = this.pools.get(chainId);
        return pool?.stats;
    }
    /**
     * Get health status for all providers
     */
    getHealthStatus() {
        const status = {};
        for (const [chainId, pool] of this.pools) {
            const providers = [];
            for (const [url, stats] of pool.stats) {
                providers.push({ url, stats });
            }
            status[chainId] = {
                chainName: pool.config.name,
                providers,
            };
        }
        return status;
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        logger.info('Cleaning up NetworkProviderManager');
        // Clear health check intervals
        for (const interval of this.healthCheckIntervals.values()) {
            clearInterval(interval);
        }
        this.healthCheckIntervals.clear();
        // Clear pools
        this.pools.clear();
        logger.info('NetworkProviderManager cleanup completed');
    }
    /**
     * Get healthy providers from a pool
     */
    getHealthyProviders(pool) {
        if (!this.config.enableFallback) {
            return pool.providers;
        }
        const healthyProviders = [];
        for (let i = 0; i < pool.providers.length; i++) {
            const provider = pool.providers[i];
            if (!provider)
                continue;
            const rpcUrl = this.getProviderUrlSync(provider);
            const stats = pool.stats.get(rpcUrl);
            if (!stats || stats.isHealthy) {
                healthyProviders.push(provider);
            }
        }
        // If no providers are healthy, return all (emergency fallback)
        return healthyProviders.length > 0 ? healthyProviders : pool.providers;
    }
    /**
     * Start health checks for a chain
     */
    async startHealthChecks(chainId) {
        const interval = setInterval(async () => {
            try {
                await this.performHealthCheck(chainId);
            }
            catch (error) {
                logger.error(`Health check failed for chain ${chainId}`, { error });
            }
        }, this.config.healthCheckInterval);
        this.healthCheckIntervals.set(chainId, interval);
        // Perform initial health check
        await this.performHealthCheck(chainId);
    }
    /**
     * Perform health check on all providers for a chain
     */
    async performHealthCheck(chainId) {
        const pool = this.pools.get(chainId);
        if (!pool)
            return;
        logger.debug(`Performing health check for chain ${chainId}`);
        const healthCheckPromises = pool.providers.map(async (provider) => {
            const rpcUrl = this.getProviderUrlSync(provider);
            const stats = pool.stats.get(rpcUrl);
            if (!stats)
                return;
            try {
                const startTime = Date.now();
                await provider.getBlockNumber();
                const responseTime = Date.now() - startTime;
                stats.isHealthy = true;
                stats.lastHealthCheck = new Date();
                logger.debug(`Health check passed for ${rpcUrl}`, { responseTime, chainId });
            }
            catch (error) {
                stats.isHealthy = false;
                stats.lastHealthCheck = new Date();
                logger.warn(`Health check failed for ${rpcUrl}`, { error, chainId });
            }
        });
        await Promise.allSettled(healthCheckPromises);
    }
    /**
     * Get provider URL (async version)
     */
    async getProviderUrl(provider) {
        // Access the internal connection URL
        try {
            const connection = provider._getConnection();
            return connection.url || 'unknown';
        }
        catch {
            return 'unknown';
        }
    }
    /**
     * Get provider URL (sync version)
     */
    getProviderUrlSync(provider) {
        // Access the internal connection URL
        try {
            const connection = provider._getConnection();
            return connection.url || 'unknown';
        }
        catch {
            return 'unknown';
        }
    }
    /**
     * Create a custom provider for local/private networks
     */
    createCustomProvider(chainId, providerUrl, apiKey = null) {
        logger.info('Creating custom provider', { chainId, providerUrl, hasApiKey: !!apiKey });
        
        try {
            // Validate URL format
            new URL(providerUrl);
            
            // Build RPC URL with API key if provided
            const finalUrl = this.buildAuthenticatedUrl(providerUrl, apiKey);
            
            // Create provider with custom URL
            const provider = new ethers.JsonRpcProvider(finalUrl, {
                chainId: chainId,
                name: `Custom-${chainId}`,
            });
            
            // Set timeout
            provider.pollingInterval = 4000;
            
            logger.info('Custom provider created successfully', { chainId, providerUrl, authenticated: !!apiKey });
            return provider;
        } catch (error) {
            logger.error('Failed to create custom provider', { chainId, providerUrl, error });
            throw new Error(`Invalid custom provider URL: ${error.message}`);
        }
    }

    /**
     * Build authenticated URL with API key
     */
    buildAuthenticatedUrl(providerUrl, apiKey) {
        if (!apiKey) {
            // Try to get API key from environment variables
            apiKey = this.getApiKeyFromEnv(providerUrl);
        }
        
        if (!apiKey) {
            return providerUrl;
        }
        
        try {
            const url = new URL(providerUrl);
            
            // Handle common RPC provider patterns
            if (url.hostname.includes('infura.io')) {
                // Infura: append API key to path
                url.pathname = url.pathname.replace(/\/$/, '') + '/' + apiKey;
            } else if (url.hostname.includes('alchemy.')) {
                // Alchemy: append API key to path
                url.pathname = url.pathname.replace(/\/$/, '') + '/' + apiKey;
            } else if (url.hostname.includes('quicknode.pro')) {
                // QuickNode: append API key to path
                url.pathname = url.pathname.replace(/\/$/, '') + '/' + apiKey;
            } else {
                // Generic: add as query parameter
                url.searchParams.set('apikey', apiKey);
            }
            
            return url.toString();
        } catch (error) {
            logger.warn('Failed to add API key to URL, using original URL', { error });
            return providerUrl;
        }
    }

    /**
     * Get API key from environment variables based on provider URL
     */
    getApiKeyFromEnv(providerUrl) {
        try {
            const url = new URL(providerUrl);
            
            // Check for specific provider API keys
            if (url.hostname.includes('infura.io')) {
                return process.env.INFURA_API_KEY;
            } else if (url.hostname.includes('alchemy.')) {
                return process.env.ALCHEMY_API_KEY;
            } else if (url.hostname.includes('quicknode.pro')) {
                return process.env.QUICKNODE_API_KEY;
            } else {
                // Generic custom RPC API key
                return process.env.CUSTOM_RPC_API_KEY;
            }
        } catch {
            return process.env.CUSTOM_RPC_API_KEY;
        }
    }

    /**
     * Validate custom provider connectivity
     */
    async validateCustomProvider(chainId, providerUrl, apiKey = null) {
        logger.info('Validating custom provider', { chainId, providerUrl, hasApiKey: !!apiKey });
        
        try {
            const provider = this.createCustomProvider(chainId, providerUrl, apiKey);
            
            // Test connectivity with timeout
            const networkPromise = provider.getNetwork();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Provider validation timeout (10s)')), 10000)
            );
            
            const network = await Promise.race([networkPromise, timeoutPromise]);
            
            logger.info('Custom provider validated successfully', { 
                chainId, 
                providerUrl, 
                networkChainId: network.chainId,
                authenticated: !!apiKey
            });
            
            // Verify chain ID matches if the network reports it
            if (network.chainId && Number(network.chainId) !== chainId) {
                logger.warn('Chain ID mismatch detected', {
                    expectedChainId: chainId,
                    actualChainId: Number(network.chainId),
                    providerUrl
                });
            }
            
            return true;
        } catch (error) {
            logger.error('Custom provider validation failed', { chainId, providerUrl, error });
            
            // Provide helpful error messages
            let errorMessage = `Custom provider validation failed: ${error.message}`;
            
            if (error.message.includes('timeout')) {
                errorMessage = 'Custom provider validation failed: Connection timeout (10s). Check if the RPC endpoint is accessible and responding.';
            } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
                errorMessage = 'Custom provider validation failed: Cannot connect to RPC endpoint. Verify the URL is correct and the service is running.';
            } else if (error.message.includes('401') || error.message.includes('403') || error.message.includes('Unauthorized')) {
                errorMessage = 'Custom provider validation failed: Authentication error. Check if API key is required and correctly provided via providerApiKey parameter or environment variables (INFURA_API_KEY, ALCHEMY_API_KEY, QUICKNODE_API_KEY, CUSTOM_RPC_API_KEY).';
            } else if (error.message.includes('429')) {
                errorMessage = 'Custom provider validation failed: Rate limit exceeded. Try again later or check your API key quota.';
            }
            
            throw new Error(errorMessage);
        }
    }

    /**
     * Delay utility function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance for multi-network compatibility
export const networkProviderManager = new NetworkProviderManager();

//# sourceMappingURL=provider.js.map