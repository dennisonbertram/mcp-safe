/**
 * MCP Tool Handlers for SAFE Wallet Creation
 */
import { ethers } from 'ethers';
import { ChainManager } from '../../network/index.js';
import { SafeUtils } from '../../safe/utils.js';
import logger from '../../utils/logger.js';
export class WalletCreationTools {
    protocolKit;
    networkProvider;
    constructor(protocolKit, networkProvider) {
        this.protocolKit = protocolKit;
        this.networkProvider = networkProvider;
        logger.debug('WalletCreationTools initialized');
    }
    /**
     * Handle MCP tool requests for wallet creation
     */
    async handleToolRequest(request) {
        try {
            switch (request.name) {
                case 'safe_create_wallet_config':
                    return await this.createWalletConfig(request.arguments);
                case 'safe_deploy_wallet':
                    return await this.deployWallet(request.arguments);
                case 'safe_predict_address':
                    return await this.predictAddress(request.arguments);
                default:
                    throw new Error(`Unknown tool: ${request.name}`);
            }
        }
        catch (error) {
            logger.error('Error handling wallet creation tool request', { tool: request.name, error });
            return {
                content: [{
                        type: 'text',
                        text: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
                    }],
                isError: true,
            };
        }
    }
    /**
     * Create wallet configuration
     */
    async createWalletConfig(params) {
        logger.info('Creating wallet configuration', {
            ownerCount: params.owners.length,
            threshold: params.threshold,
            chainId: params.chainId,
            hasCustomProvider: !!params.providerUrl
        });
        // Validate parameters
        const validation = this.validateWalletConfigParams(params);
        if (!validation.isValid) {
            throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
        }
        // Configure custom provider if provided
        if (params.providerUrl) {
            await this.configureCustomProvider(params.chainId, params.providerUrl);
        }
        // Create wallet configuration
        const walletConfig = {
            owners: params.owners,
            threshold: params.threshold,
            ...(params.saltNonce && { saltNonce: params.saltNonce }),
            ...(params.fallbackHandler && { fallbackHandler: params.fallbackHandler }),
            ...(params.paymentToken && { paymentToken: params.paymentToken }),
            ...(params.payment && { payment: params.payment }),
            ...(params.paymentReceiver && { paymentReceiver: params.paymentReceiver }),
        };
        const safeAccountConfig = await this.protocolKit.createWalletConfig(params.chainId, walletConfig);
        // Get chain information
        const chainInfo = ChainManager.getChain(params.chainId);
        const chainName = chainInfo?.name || `Chain ${params.chainId}`;
        const result = {
            success: true,
            chainId: params.chainId,
            chainName,
            config: {
                owners: safeAccountConfig.owners,
                threshold: safeAccountConfig.threshold,
                fallbackHandler: safeAccountConfig.fallbackHandler,
                ...(safeAccountConfig.paymentToken && { paymentToken: safeAccountConfig.paymentToken }),
                ...(safeAccountConfig.payment && { payment: safeAccountConfig.payment }),
                ...(safeAccountConfig.paymentReceiver && { paymentReceiver: safeAccountConfig.paymentReceiver }),
            },
            summary: {
                ownerCount: safeAccountConfig.owners.length,
                requiredSignatures: safeAccountConfig.threshold,
                hasPaymentConfig: !!safeAccountConfig.paymentToken,
            }
        };
        logger.info('Wallet configuration created successfully', {
            chainId: params.chainId,
            ownerCount: result.summary.ownerCount,
            threshold: result.summary.requiredSignatures,
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    /**
     * Deploy wallet to network
     */
    async deployWallet(params) {
        logger.info('Deploying wallet', {
            ownerCount: params.owners.length,
            threshold: params.threshold,
            chainId: params.chainId,
            hasCustomProvider: !!params.providerUrl
        });
        // Validate parameters
        const validation = this.validateDeployWalletParams(params);
        if (!validation.isValid) {
            throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
        }
        // Configure custom provider if provided
        if (params.providerUrl) {
            await this.configureCustomProvider(params.chainId, params.providerUrl);
        }
        // Create signer from private key
        const signer = new ethers.Wallet(params.signerPrivateKey);
        const signerAddress = await signer.getAddress();
        // Validate signer is an owner
        if (!params.owners.map(addr => addr.toLowerCase()).includes(signerAddress.toLowerCase())) {
            throw new Error('Signer must be one of the wallet owners');
        }
        // Create wallet configuration
        const walletConfig = {
            owners: params.owners,
            threshold: params.threshold,
            ...(params.saltNonce && { saltNonce: params.saltNonce }),
            ...(params.fallbackHandler && { fallbackHandler: params.fallbackHandler }),
        };
        // Create deployment options
        const deploymentOptions = {
            ...(params.gasLimit && { gasLimit: params.gasLimit }),
            ...(params.gasPrice && { gasPrice: params.gasPrice }),
            ...(params.maxFeePerGas && { maxFeePerGas: params.maxFeePerGas }),
            ...(params.maxPriorityFeePerGas && { maxPriorityFeePerGas: params.maxPriorityFeePerGas }),
        };
        // Connect signer to provider (use custom provider if specified)
        const provider = params.providerUrl 
            ? await this.getCustomProvider(params.chainId, params.providerUrl)
            : await this.networkProvider.getProvider(params.chainId);
        const connectedSigner = signer.connect(provider);
        // Deploy wallet
        const { safe, transactionHash } = await this.protocolKit.deploySafe(params.chainId, walletConfig, connectedSigner, deploymentOptions);
        const walletAddress = await safe.getAddress();
        const chainInfo = ChainManager.getChain(params.chainId);
        const chainName = chainInfo?.name || `Chain ${params.chainId}`;
        const result = {
            success: true,
            chainId: params.chainId,
            chainName,
            deployment: {
                walletAddress,
                transactionHash,
                deployedBy: signerAddress,
                owners: params.owners,
                threshold: params.threshold,
                deploymentOptions: deploymentOptions,
            },
            links: {
                ...(chainInfo?.blockExplorerUrls?.[0] && {
                    explorer: `${chainInfo.blockExplorerUrls[0]}/address/${walletAddress}`,
                    transaction: transactionHash ? `${chainInfo.blockExplorerUrls[0]}/tx/${transactionHash}` : undefined,
                }),
            }
        };
        logger.info('Wallet deployed successfully', {
            chainId: params.chainId,
            walletAddress,
            transactionHash,
            deployedBy: signerAddress,
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    /**
     * Predict wallet address
     */
    async predictAddress(params) {
        logger.info('Predicting wallet address', {
            ownerCount: params.owners.length,
            threshold: params.threshold,
            chainId: params.chainId,
            hasCustomProvider: !!params.providerUrl
        });
        // Validate parameters
        const validation = this.validatePredictAddressParams(params);
        if (!validation.isValid) {
            throw new Error(`Invalid parameters: ${validation.errors.join(', ')}`);
        }
        // Configure custom provider if provided
        if (params.providerUrl) {
            await this.configureCustomProvider(params.chainId, params.providerUrl);
        }
        // Create wallet configuration
        const walletConfig = {
            owners: params.owners,
            threshold: params.threshold,
            ...(params.saltNonce && { saltNonce: params.saltNonce }),
            ...(params.fallbackHandler && { fallbackHandler: params.fallbackHandler }),
        };
        // Predict address
        const predictedAddress = await this.protocolKit.predictSafeAddress(params.chainId, walletConfig);
        // Check if already deployed
        const isDeployed = await this.protocolKit.isSafeDeployed(params.chainId, predictedAddress);
        const chainInfo = ChainManager.getChain(params.chainId);
        const chainName = chainInfo?.name || `Chain ${params.chainId}`;
        const result = {
            success: true,
            chainId: params.chainId,
            chainName,
            prediction: {
                address: predictedAddress,
                formattedAddress: SafeUtils.formatAddress(predictedAddress),
                isDeployed,
                configuration: {
                    owners: params.owners,
                    threshold: params.threshold,
                    saltNonce: params.saltNonce || '0',
                },
            },
            deployment: {
                status: isDeployed ? 'already_deployed' : 'not_deployed',
                canDeploy: !isDeployed,
                nextSteps: isDeployed
                    ? ['Wallet is already deployed and ready to use']
                    : ['Use safe_deploy_wallet tool to deploy this configuration']
            },
            links: {
                ...(chainInfo?.blockExplorerUrls?.[0] && {
                    explorer: `${chainInfo.blockExplorerUrls[0]}/address/${predictedAddress}`,
                }),
            }
        };
        logger.info('Address prediction completed', {
            chainId: params.chainId,
            predictedAddress,
            isDeployed,
        });
        return {
            content: [{
                    type: 'text',
                    text: JSON.stringify(result, null, 2)
                }]
        };
    }
    /**
     * Configure custom provider for local/private networks
     */
    async configureCustomProvider(chainId, providerUrl) {
        logger.info('Configuring custom provider', { chainId, providerUrl });
        try {
            // Test provider connectivity
            const testProvider = new ethers.JsonRpcProvider(providerUrl, chainId);
            await testProvider.getNetwork();
            logger.info('Custom provider validated successfully', { chainId, providerUrl });
        } catch (error) {
            logger.error('Custom provider validation failed', { chainId, providerUrl, error });
            throw new Error(`Invalid custom provider URL: ${error.message}`);
        }
    }

    /**
     * Get custom provider instance
     */
    async getCustomProvider(chainId, providerUrl) {
        const provider = new ethers.JsonRpcProvider(providerUrl, chainId);
        // Verify provider works
        await provider.getNetwork();
        return provider;
    }

    /**
     * Validate wallet config parameters
     */
    validateWalletConfigParams(params) {
        const errors = [];
        // Validate owners
        if (!params.owners || !Array.isArray(params.owners) || params.owners.length === 0) {
            errors.push('owners must be a non-empty array');
        }
        else {
            for (const [index, owner] of params.owners.entries()) {
                if (!ethers.isAddress(owner)) {
                    errors.push(`owner at index ${index} is not a valid address: ${owner}`);
                }
            }
            // Check for duplicate owners
            const uniqueOwners = new Set(params.owners.map(addr => addr.toLowerCase()));
            if (uniqueOwners.size !== params.owners.length) {
                errors.push('duplicate owners are not allowed');
            }
        }
        // Validate threshold
        if (!params.threshold || params.threshold < 1) {
            errors.push('threshold must be at least 1');
        }
        else if (params.owners && params.threshold > params.owners.length) {
            errors.push('threshold cannot exceed number of owners');
        }
        // Validate chainId - allow custom chains when providerUrl is provided
        if (!params.chainId) {
            errors.push('chainId is required');
        } else if (!params.providerUrl && !ChainManager.getChain(params.chainId)) {
            errors.push(`unsupported chainId: ${params.chainId} (use providerUrl for custom networks)`);
        }
        // Validate custom provider URL if provided
        if (params.providerUrl) {
            try {
                new URL(params.providerUrl);
            } catch {
                errors.push(`invalid providerUrl format: ${params.providerUrl}`);
            }
        }
        // Validate optional addresses
        if (params.fallbackHandler && !ethers.isAddress(params.fallbackHandler)) {
            errors.push(`invalid fallbackHandler address: ${params.fallbackHandler}`);
        }
        if (params.paymentToken && !ethers.isAddress(params.paymentToken)) {
            errors.push(`invalid paymentToken address: ${params.paymentToken}`);
        }
        if (params.paymentReceiver && !ethers.isAddress(params.paymentReceiver)) {
            errors.push(`invalid paymentReceiver address: ${params.paymentReceiver}`);
        }
        return { isValid: errors.length === 0, errors };
    }
    /**
     * Validate deploy wallet parameters
     */
    validateDeployWalletParams(params) {
        const baseValidation = this.validateWalletConfigParams(params);
        const errors = [...baseValidation.errors];
        // Validate private key
        if (!params.signerPrivateKey) {
            errors.push('signerPrivateKey is required');
        }
        else {
            try {
                new ethers.Wallet(params.signerPrivateKey);
            }
            catch {
                errors.push('invalid signerPrivateKey format');
            }
        }
        // Validate gas parameters
        if (params.gasLimit && (isNaN(Number(params.gasLimit)) || Number(params.gasLimit) <= 0)) {
            errors.push('gasLimit must be a positive number');
        }
        if (params.gasPrice && (isNaN(Number(params.gasPrice)) || Number(params.gasPrice) <= 0)) {
            errors.push('gasPrice must be a positive number');
        }
        return { isValid: errors.length === 0, errors };
    }
    /**
     * Validate predict address parameters
     */
    validatePredictAddressParams(params) {
        return this.validateWalletConfigParams(params);
    }
    /**
     * Get supported tools list
     */
    static getSupportedTools() {
        return [
            {
                name: 'safe_create_wallet_config',
                description: 'Create a SAFE wallet configuration with specified owners and threshold',
                inputSchema: {
                    type: 'object',
                    properties: {
                        owners: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of owner addresses'
                        },
                        threshold: {
                            type: 'number',
                            description: 'Number of required signatures',
                            minimum: 1
                        },
                        chainId: {
                            type: 'number',
                            description: 'Blockchain network chain ID'
                        },
                        saltNonce: {
                            type: 'string',
                            description: 'Optional salt nonce for deterministic address generation'
                        },
                        fallbackHandler: {
                            type: 'string',
                            description: 'Optional fallback handler address'
                        }
                    },
                    required: ['owners', 'threshold', 'chainId']
                }
            },
            {
                name: 'safe_deploy_wallet',
                description: 'Deploy a SAFE wallet to the specified network',
                inputSchema: {
                    type: 'object',
                    properties: {
                        owners: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of owner addresses'
                        },
                        threshold: {
                            type: 'number',
                            description: 'Number of required signatures',
                            minimum: 1
                        },
                        chainId: {
                            type: 'number',
                            description: 'Blockchain network chain ID'
                        },
                        signerPrivateKey: {
                            type: 'string',
                            description: 'Private key of the deploying signer (must be an owner)'
                        },
                        saltNonce: {
                            type: 'string',
                            description: 'Optional salt nonce for deterministic address generation'
                        },
                        gasLimit: {
                            type: 'string',
                            description: 'Optional gas limit for deployment transaction'
                        }
                    },
                    required: ['owners', 'threshold', 'chainId', 'signerPrivateKey']
                }
            },
            {
                name: 'safe_predict_address',
                description: 'Predict the deterministic address of a SAFE wallet before deployment',
                inputSchema: {
                    type: 'object',
                    properties: {
                        owners: {
                            type: 'array',
                            items: { type: 'string' },
                            description: 'Array of owner addresses'
                        },
                        threshold: {
                            type: 'number',
                            description: 'Number of required signatures',
                            minimum: 1
                        },
                        chainId: {
                            type: 'number',
                            description: 'Blockchain network chain ID'
                        },
                        saltNonce: {
                            type: 'string',
                            description: 'Optional salt nonce for deterministic address generation'
                        }
                    },
                    required: ['owners', 'threshold', 'chainId']
                }
            }
        ];
    }
}
//# sourceMappingURL=wallet-creation.js.map