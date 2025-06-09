/**
 * MCP Tools Registry - Centralized tool registration for SAFE MCP Server
 */
import { z } from 'zod';
import { createLogger } from '../utils/logger.js';
import { withMetrics } from '../utils/monitoring.js';
import { ErrorHandler } from '../utils/errors.js';
export class SafeToolsRegistry {
    server;
    logger = createLogger('SafeToolsRegistry');
    constructor(server) {
        this.server = server;
    }
    /**
     * Register all SAFE MCP tools
     */
    async registerAllTools() {
        this.logger.info('Registering all SAFE MCP tools...');
        await this.registerWalletCreationTools();
        await this.registerTransactionTools();
        await this.registerOwnerManagementTools();
        await this.registerQueryTools();
        await this.registerModulesGuardsTools();
        await this.registerHealthCheckTool();
        this.logger.info('All SAFE MCP tools registered successfully');
    }
    /**
     * Register SAFE wallet creation tools
     */
    async registerWalletCreationTools() {
        this.logger.info('Registering SAFE wallet creation tools...');
        const { WalletCreationTools } = await import('../mcp/tools/wallet-creation.js');
        const { SafeProtocolKit } = await import('../safe/protocol.js');
        const { NetworkProviderManager } = await import('../network/index.js');
        // Initialize dependencies
        const networkProvider = new NetworkProviderManager();
        const protocolKit = new SafeProtocolKit(networkProvider);
        const walletTools = new WalletCreationTools(protocolKit, networkProvider);
        // Register create wallet config tool
        this.server.tool('safe_create_wallet_config', {
            owners: z.array(z.string()).describe('Array of owner addresses'),
            threshold: z.number().min(1).describe('Number of required signatures'),
            chainId: z.number().describe('Blockchain network chain ID'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            saltNonce: z.string().optional().describe('Optional salt nonce for deterministic address generation'),
            fallbackHandler: z.string().optional().describe('Optional fallback handler address'),
            paymentToken: z.string().optional().describe('Optional payment token address'),
            payment: z.string().optional().describe('Optional payment amount'),
            paymentReceiver: z.string().optional().describe('Optional payment receiver address')
        }, async (args, extra) => {
            return withMetrics('safe_create_wallet_config', async () => {
                try {
                    this.logger.debug('SAFE wallet config request', { arguments: args });
                    const response = await walletTools.handleToolRequest({
                        name: 'safe_create_wallet_config',
                        arguments: args,
                    });
                    this.logger.info('SAFE wallet config created successfully');
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'walletTool',
                        tool: 'safe_create_wallet_config'
                    });
                    this.logger.error('SAFE wallet config creation failed', {
                        error: safeMcpError.message
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE wallet config creation failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register deploy wallet tool
        this.server.tool('safe_deploy_wallet', {
            owners: z.array(z.string()).describe('Array of owner addresses'),
            threshold: z.number().min(1).describe('Number of required signatures'),
            chainId: z.number().describe('Blockchain network chain ID'),
            signerPrivateKey: z.string().describe('Private key of the deploying signer'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            saltNonce: z.string().optional().describe('Optional salt nonce'),
            fallbackHandler: z.string().optional().describe('Optional fallback handler address'),
            gasLimit: z.string().optional().describe('Optional gas limit'),
            gasPrice: z.string().optional().describe('Optional gas price'),
            maxFeePerGas: z.string().optional().describe('Optional max fee per gas (EIP-1559)'),
            maxPriorityFeePerGas: z.string().optional().describe('Optional max priority fee per gas (EIP-1559)')
        }, async (args, extra) => {
            return withMetrics('safe_deploy_wallet', async () => {
                try {
                    this.logger.debug('SAFE wallet deploy request', {
                        arguments: { ...args, signerPrivateKey: '[REDACTED]' }
                    });
                    const response = await walletTools.handleToolRequest({
                        name: 'safe_deploy_wallet',
                        arguments: args,
                    });
                    this.logger.info('SAFE wallet deployed successfully');
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'walletTool',
                        tool: 'safe_deploy_wallet'
                    });
                    this.logger.error('SAFE wallet deployment failed', {
                        error: safeMcpError.message
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE wallet deployment failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register predict address tool
        this.server.tool('safe_predict_address', {
            owners: z.array(z.string()).describe('Array of owner addresses'),
            threshold: z.number().min(1).describe('Number of required signatures'),
            chainId: z.number().describe('Blockchain network chain ID'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            saltNonce: z.string().optional().describe('Optional salt nonce')
        }, async (args, extra) => {
            return withMetrics('safe_predict_address', async () => {
                try {
                    this.logger.debug('SAFE address prediction request', { arguments: args });
                    const response = await walletTools.handleToolRequest({
                        name: 'safe_predict_address',
                        arguments: args,
                    });
                    this.logger.info('SAFE address predicted successfully');
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'walletTool',
                        tool: 'safe_predict_address'
                    });
                    this.logger.error('SAFE address prediction failed', {
                        error: safeMcpError.message
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE address prediction failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        this.logger.info('SAFE wallet creation tools registered successfully', {
            toolCount: 3,
            tools: ['safe_create_wallet_config', 'safe_deploy_wallet', 'safe_predict_address']
        });
    }
    /**
     * Placeholder for remaining tool registrations - will implement incrementally
     */
    async registerTransactionTools() {
        this.logger.info('Transaction tools already registered via main server');
    }
    async registerOwnerManagementTools() {
        this.logger.info('Registering SAFE owner management tools...');
        const { OwnerManagementTools } = await import('../mcp/tools/owner-management.js');
        const { OwnerManager } = await import('../safe/owners.js');
        const { SafeProtocolKit } = await import('../safe/protocol.js');
        const { NetworkProviderManager } = await import('../network/index.js');
        // Initialize dependencies
        const networkProvider = new NetworkProviderManager();
        const protocolKit = new SafeProtocolKit(networkProvider);
        // Import transaction manager  
        const { TransactionManager } = await import('../transaction/index.js');
        const transactionManager = new TransactionManager(protocolKit, networkProvider, {
            chainId: 1, // Default to mainnet, will be overridden per request
            safeAddress: '0x0000000000000000000000000000000000000000', // Placeholder
            autoCleanupInterval: 60000,
        });
        const ownerManager = new OwnerManager(protocolKit, transactionManager, 1, '0x0000000000000000000000000000000000000000');
        const ownerTools = new OwnerManagementTools(ownerManager);
        // Register add owner tool
        this.server.tool('safe_add_owner', {
            walletAddress: z.string().describe('SAFE wallet address'),
            newOwnerAddress: z.string().describe('Address of the new owner to add'),
            chainId: z.number().describe('Blockchain network chain ID'),
            proposedBy: z.string().describe('Address of the proposer (must be wallet owner)'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            newThreshold: z.number().optional().describe('Optional new threshold (default: current threshold + 1)'),
            description: z.string().optional().describe('Optional description for the operation'),
            tags: z.array(z.string()).optional().describe('Optional tags for categorization')
        }, async (args, extra) => {
            return withMetrics('safe_add_owner', async () => {
                try {
                    const response = await ownerTools.handleToolRequest({
                        name: 'safe_add_owner',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'ownerTool',
                        tool: 'safe_add_owner'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE add owner failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register remove owner tool
        this.server.tool('safe_remove_owner', {
            walletAddress: z.string().describe('SAFE wallet address'),
            ownerToRemove: z.string().describe('Address of the owner to remove'),
            chainId: z.number().describe('Blockchain network chain ID'),
            proposedBy: z.string().describe('Address of the proposer (must be wallet owner)'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            newThreshold: z.number().optional().describe('Optional new threshold (default: current threshold - 1)'),
            description: z.string().optional().describe('Optional description for the operation'),
            tags: z.array(z.string()).optional().describe('Optional tags for categorization')
        }, async (args, extra) => {
            return withMetrics('safe_remove_owner', async () => {
                try {
                    const response = await ownerTools.handleToolRequest({
                        name: 'safe_remove_owner',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'ownerTool',
                        tool: 'safe_remove_owner'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE remove owner failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register swap owner tool
        this.server.tool('safe_swap_owner', {
            walletAddress: z.string().describe('SAFE wallet address'),
            oldOwnerAddress: z.string().describe('Address of the owner to replace'),
            newOwnerAddress: z.string().describe('Address of the new owner'),
            chainId: z.number().describe('Blockchain network chain ID'),
            proposedBy: z.string().describe('Address of the proposer (must be wallet owner)'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            description: z.string().optional().describe('Optional description for the operation'),
            tags: z.array(z.string()).optional().describe('Optional tags for categorization')
        }, async (args, extra) => {
            return withMetrics('safe_swap_owner', async () => {
                try {
                    const response = await ownerTools.handleToolRequest({
                        name: 'safe_swap_owner',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'ownerTool',
                        tool: 'safe_swap_owner'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE swap owner failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register change threshold tool
        this.server.tool('safe_change_threshold', {
            walletAddress: z.string().describe('SAFE wallet address'),
            newThreshold: z.number().min(1).describe('New signature threshold'),
            chainId: z.number().describe('Blockchain network chain ID'),
            proposedBy: z.string().describe('Address of the proposer (must be wallet owner)'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            description: z.string().optional().describe('Optional description for the operation'),
            tags: z.array(z.string()).optional().describe('Optional tags for categorization')
        }, async (args, extra) => {
            return withMetrics('safe_change_threshold', async () => {
                try {
                    const response = await ownerTools.handleToolRequest({
                        name: 'safe_change_threshold',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'ownerTool',
                        tool: 'safe_change_threshold'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE change threshold failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        this.logger.info('SAFE owner management tools registered successfully', {
            toolCount: 4,
            tools: ['safe_add_owner', 'safe_remove_owner', 'safe_swap_owner', 'safe_change_threshold']
        });
    }
    async registerQueryTools() {
        this.logger.info('Registering SAFE query tools...');
        const { QueryTools } = await import('../mcp/tools/queries.js');
        const { WalletInfoService } = await import('../safe/info.js');
        const { SafeApiService } = await import('../safe/api.js');
        const { NetworkProviderManager } = await import('../network/index.js');
        // Initialize dependencies
        const networkProvider = new NetworkProviderManager();
        const { SafeProtocolKit } = await import('../safe/protocol.js');
        const protocolKit = new SafeProtocolKit(networkProvider);
        const safeApiService = new SafeApiService();
        const walletInfoService = new WalletInfoService(protocolKit, networkProvider, 1);
        const queryTools = new QueryTools(walletInfoService, safeApiService);
        // Register get info tool
        this.server.tool('safe_get_info', {
            walletAddress: z.string().describe('SAFE wallet address'),
            chainId: z.number().describe('Blockchain network chain ID'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            includeBalance: z.boolean().optional().describe('Include wallet balance information'),
            includeModules: z.boolean().optional().describe('Include enabled modules'),
            includeGuards: z.boolean().optional().describe('Include enabled guards'),
            includeNonce: z.boolean().optional().describe('Include current nonce')
        }, async (args, extra) => {
            return withMetrics('safe_get_info', async () => {
                try {
                    const response = await queryTools.handleToolRequest({
                        name: 'safe_get_info',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'queryTool',
                        tool: 'safe_get_info'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE get info failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register get owners tool
        this.server.tool('safe_get_owners', {
            walletAddress: z.string().describe('SAFE wallet address'),
            chainId: z.number().describe('Blockchain network chain ID'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            includeThreshold: z.boolean().optional().describe('Include signature threshold')
        }, async (args, extra) => {
            return withMetrics('safe_get_owners', async () => {
                try {
                    const response = await queryTools.handleToolRequest({
                        name: 'safe_get_owners',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'queryTool',
                        tool: 'safe_get_owners'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE get owners failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        this.logger.info('SAFE query tools registered successfully', {
            toolCount: 2,
            tools: ['safe_get_info', 'safe_get_owners']
        });
    }
    async registerModulesGuardsTools() {
        this.logger.info('Registering SAFE modules/guards tools...');
        const { ModulesGuardsTools } = await import('../mcp/tools/modules-guards.js');
        const { ModuleManager } = await import('../safe/modules.js');
        const { GuardManager } = await import('../safe/guards.js');
        const { SafeProtocolKit } = await import('../safe/protocol.js');
        const { NetworkProviderManager } = await import('../network/index.js');
        // Initialize dependencies
        const networkProvider = new NetworkProviderManager();
        const protocolKit = new SafeProtocolKit(networkProvider);
        // Import transaction manager for modules/guards
        const { TransactionManager } = await import('../transaction/index.js');
        const transactionManager = new TransactionManager(protocolKit, networkProvider, {
            chainId: 1,
            safeAddress: '0x0000000000000000000000000000000000000000',
            autoCleanupInterval: 60000,
        });
        const moduleManager = new ModuleManager(protocolKit, transactionManager, 1, '0x0000000000000000000000000000000000000000');
        const guardManager = new GuardManager(protocolKit, transactionManager, 1, '0x0000000000000000000000000000000000000000');
        const modulesGuardsTools = new ModulesGuardsTools(moduleManager, guardManager);
        // Register enable module tool
        this.server.tool('safe_enable_module', {
            walletAddress: z.string().describe('SAFE wallet address'),
            moduleAddress: z.string().describe('Address of the module to enable'),
            chainId: z.number().describe('Blockchain network chain ID'),
            proposedBy: z.string().describe('Address of the proposer (must be wallet owner)'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            description: z.string().optional().describe('Optional description for the operation'),
            tags: z.array(z.string()).optional().describe('Optional tags for categorization')
        }, async (args, extra) => {
            return withMetrics('safe_enable_module', async () => {
                try {
                    const response = await modulesGuardsTools.handleToolRequest({
                        name: 'safe_enable_module',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'moduleGuardTool',
                        tool: 'safe_enable_module'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE enable module failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        // Register disable module tool
        this.server.tool('safe_disable_module', {
            walletAddress: z.string().describe('SAFE wallet address'),
            moduleAddress: z.string().describe('Address of the module to disable'),
            prevModuleAddress: z.string().describe('Address of the previous module in the linked list'),
            chainId: z.number().describe('Blockchain network chain ID'),
            proposedBy: z.string().describe('Address of the proposer (must be wallet owner)'),
            providerUrl: z.string().optional().describe('Optional custom RPC provider URL (for local/private networks)'),
            providerApiKey: z.string().optional().describe('Optional API key for authenticated RPC endpoints (alternative to env vars)'),
            description: z.string().optional().describe('Optional description for the operation'),
            tags: z.array(z.string()).optional().describe('Optional tags for categorization')
        }, async (args, extra) => {
            return withMetrics('safe_disable_module', async () => {
                try {
                    const response = await modulesGuardsTools.handleToolRequest({
                        name: 'safe_disable_module',
                        arguments: args,
                    });
                    return {
                        content: response.content.map(item => ({
                            type: 'text',
                            text: item.text
                        }))
                    };
                }
                catch (error) {
                    const safeMcpError = ErrorHandler.handleError(error, {
                        operation: 'moduleGuardTool',
                        tool: 'safe_disable_module'
                    });
                    return {
                        content: [{
                                type: 'text',
                                text: JSON.stringify({
                                    error: 'SAFE disable module failed',
                                    message: safeMcpError.message,
                                    errorCode: safeMcpError.code,
                                    timestamp: new Date().toISOString()
                                }, null, 2)
                            }],
                    };
                }
            })();
        });
        this.logger.info('SAFE modules/guards tools registered successfully', {
            toolCount: 2,
            tools: ['safe_enable_module', 'safe_disable_module']
        });
    }
    async registerHealthCheckTool() {
        this.logger.info('Health check tool already registered via main server');
    }
}
//# sourceMappingURL=tools-registry.js.map