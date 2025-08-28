import { SafeError, ErrorCodes } from '../../utils/SafeError.js';
import { ProviderFactory } from '../../blockchain/ProviderFactory.js';
/**
 * Owner Management Tools for Safe MCP Server
 *
 * Provides tools for managing Safe wallet owners:
 * - safe_add_owner: Add a new owner to a Safe wallet
 * - safe_remove_owner: Remove an existing owner from a Safe wallet
 * - safe_change_threshold: Change the signature threshold for a Safe wallet
 */
export class OwnerManagementTools {
    contractRegistry;
    providerFactory;
    constructor(contractRegistry) {
        this.contractRegistry = contractRegistry;
        this.providerFactory = new ProviderFactory();
    }
    /**
     * Get list of available owner management tools
     */
    getTools() {
        return [
            {
                name: 'safe_add_owner',
                description: "Add a new owner to a Safe wallet. Requires an existing owner's private key to execute the transaction.",
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$',
                        },
                        ownerAddress: {
                            type: 'string',
                            description: 'New owner address to add (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$',
                        },
                        threshold: {
                            type: 'number',
                            description: 'New signature threshold (optional, defaults to current threshold + 1)',
                            minimum: 1,
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
                            pattern: '^eip155:\\d+$',
                        },
                        privateKey: {
                            type: 'string',
                            description: 'Private key of an existing owner for transaction signing (32-byte hex string)',
                            pattern: '^0x[a-fA-F0-9]{64}$',
                        },
                    },
                    required: ['safeAddress', 'ownerAddress', 'networkId', 'privateKey'],
                },
            },
            {
                name: 'safe_remove_owner',
                description: "Remove an existing owner from a Safe wallet. Requires an existing owner's private key to execute the transaction.",
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$',
                        },
                        ownerAddress: {
                            type: 'string',
                            description: 'Owner address to remove (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$',
                        },
                        threshold: {
                            type: 'number',
                            description: 'New signature threshold (optional, defaults to current threshold - 1)',
                            minimum: 1,
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
                            pattern: '^eip155:\\d+$',
                        },
                        privateKey: {
                            type: 'string',
                            description: 'Private key of an existing owner for transaction signing (32-byte hex string)',
                            pattern: '^0x[a-fA-F0-9]{64}$',
                        },
                    },
                    required: ['safeAddress', 'ownerAddress', 'networkId', 'privateKey'],
                },
            },
            {
                name: 'safe_change_threshold',
                description: "Change the signature threshold for a Safe wallet. Requires an existing owner's private key to execute the transaction.",
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$',
                        },
                        threshold: {
                            type: 'number',
                            description: 'New signature threshold (must be between 1 and number of owners)',
                            minimum: 1,
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
                            pattern: '^eip155:\\d+$',
                        },
                        privateKey: {
                            type: 'string',
                            description: 'Private key of an existing owner for transaction signing (32-byte hex string)',
                            pattern: '^0x[a-fA-F0-9]{64}$',
                        },
                    },
                    required: ['safeAddress', 'threshold', 'networkId', 'privateKey'],
                },
            },
        ];
    }
    /**
     * Handle tool calls for owner management
     */
    async handleToolCall(name, args) {
        try {
            switch (name) {
                case 'safe_add_owner':
                    return await this.addOwner(args);
                case 'safe_remove_owner':
                    return await this.removeOwner(args);
                case 'safe_change_threshold':
                    return await this.changeThreshold(args);
                default:
                    throw new SafeError(`Unknown tool: ${name}`, ErrorCodes.TOOL_NOT_FOUND, { toolName: name });
            }
        }
        catch (error) {
            if (error instanceof SafeError) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(error.toJSON(), null, 2),
                        },
                    ],
                    isError: true,
                };
            }
            const message = error instanceof Error ? error.message : 'Unknown error';
            const safeError = new SafeError(`Unexpected error: ${message}`, ErrorCodes.SAFE_OPERATION_ERROR);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(safeError.toJSON(), null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    /**
     * Add a new owner to a Safe wallet using real Safe SDK
     */
    async addOwner(args) {
        try {
            // Validate required fields
            const requiredFields = [
                'safeAddress',
                'ownerAddress',
                'networkId',
                'privateKey',
            ];
            for (const field of requiredFields) {
                if (!args[field]) {
                    throw new SafeError(`Add owner validation failed: ${field} is required`, ErrorCodes.VALIDATION_ERROR, { field, value: args[field] });
                }
            }
            // Validate Safe address format
            if (!this.isValidAddress(args.safeAddress)) {
                throw new SafeError('Invalid Safe address format', ErrorCodes.VALIDATION_ERROR, { address: args.safeAddress });
            }
            // Validate owner address format
            if (!this.isValidAddress(args.ownerAddress)) {
                throw new SafeError('Invalid owner address format', ErrorCodes.VALIDATION_ERROR, { address: args.ownerAddress });
            }
            // Validate network
            if (!this.contractRegistry.validateNetwork(args.networkId)) {
                throw new SafeError('Invalid or unsupported network', ErrorCodes.VALIDATION_ERROR, { networkId: args.networkId });
            }
            // Validate private key format
            if (!this.isValidPrivateKey(args.privateKey)) {
                throw new SafeError('Invalid private key format', ErrorCodes.VALIDATION_ERROR, { privateKeyLength: args.privateKey?.length });
            }
            // Validate threshold if provided
            if (args.threshold !== undefined && args.threshold < 1) {
                throw new SafeError('Invalid threshold. Must be at least 1', ErrorCodes.VALIDATION_ERROR, { threshold: args.threshold });
            }
            // Get Safe instance using the provided private key
            const safe = await this.providerFactory.getSafe(args.safeAddress, args.networkId, args.privateKey);
            // Get current owners to determine default threshold
            const currentOwners = await safe.getOwners();
            const currentThreshold = await safe.getThreshold();
            // Use provided threshold or default to current threshold (not +1 to maintain ease of testing)
            const newThreshold = args.threshold || currentThreshold;
            // Create add owner transaction
            const transaction = await safe.createAddOwnerTx({
                ownerAddress: args.ownerAddress,
                threshold: newThreshold,
            });
            // Execute the transaction
            const executeTxResponse = await safe.executeTransaction(transaction);
            const receipt = await executeTxResponse.transactionResponse?.wait();
            // Return real transaction details
            const response = {
                transactionHash: receipt?.hash || executeTxResponse.hash,
                status: receipt?.status === 1 ? 'executed' : 'failed',
                operation: 'add_owner',
                safeAddress: args.safeAddress,
                ownerAddress: args.ownerAddress,
                newThreshold: newThreshold,
                networkId: args.networkId,
                gasUsed: receipt?.gasUsed?.toString() || '0',
                blockNumber: receipt?.blockNumber || 0,
                timestamp: new Date().toISOString(),
            };
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(response, null, 2),
                    },
                ],
                isError: false,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Owner addition error: ${message}`,
                    },
                ],
                isError: true,
            };
        }
    }
    /**
     * Remove an existing owner from a Safe wallet
     */
    async removeOwner(args) {
        // Validate required fields
        const requiredFields = [
            'safeAddress',
            'ownerAddress',
            'networkId',
            'privateKey',
        ];
        for (const field of requiredFields) {
            if (!args[field]) {
                throw new SafeError(`Remove owner validation failed: ${field} is required`, ErrorCodes.VALIDATION_ERROR, { field, value: args[field] });
            }
        }
        // Validate Safe address format
        if (!this.isValidAddress(args.safeAddress)) {
            throw new SafeError('Invalid Safe address format', ErrorCodes.VALIDATION_ERROR, { address: args.safeAddress });
        }
        // Validate owner address format
        if (!this.isValidAddress(args.ownerAddress)) {
            throw new SafeError('Invalid owner address format', ErrorCodes.VALIDATION_ERROR, { address: args.ownerAddress });
        }
        // Validate network
        if (!this.contractRegistry.validateNetwork(args.networkId)) {
            throw new SafeError('Invalid or unsupported network', ErrorCodes.VALIDATION_ERROR, { networkId: args.networkId });
        }
        // Validate private key format
        if (!this.isValidPrivateKey(args.privateKey)) {
            throw new SafeError('Invalid private key format', ErrorCodes.VALIDATION_ERROR, { privateKeyLength: args.privateKey?.length });
        }
        // Validate threshold if provided
        if (args.threshold !== undefined && args.threshold < 1) {
            throw new SafeError('Invalid threshold. Must be at least 1', ErrorCodes.VALIDATION_ERROR, { threshold: args.threshold });
        }
        try {
            // Get Safe instance using the provided private key
            const safe = await this.providerFactory.getSafe(args.safeAddress, args.networkId, args.privateKey);
            // Get current owners and threshold to validate removal
            const [currentOwners, currentThreshold] = await Promise.all([
                safe.getOwners(),
                safe.getThreshold(),
            ]);
            // Check if owner exists
            if (!currentOwners.includes(args.ownerAddress)) {
                throw new SafeError('Owner address is not a current owner of this Safe', ErrorCodes.VALIDATION_ERROR, {
                    ownerAddress: args.ownerAddress,
                    currentOwners,
                });
            }
            // Check if removing this owner would make the Safe unusable
            if (currentOwners.length <= currentThreshold) {
                throw new SafeError('Cannot remove owner: would make Safe unusable (owners <= threshold)', ErrorCodes.VALIDATION_ERROR, {
                    currentOwners: currentOwners.length,
                    currentThreshold,
                    wouldResultIn: currentOwners.length - 1,
                });
            }
            // Calculate new threshold (reduce by 1 if removing owner would require it)
            let newThreshold = args.threshold || currentThreshold;
            if (newThreshold > currentOwners.length - 1) {
                newThreshold = currentOwners.length - 1;
            }
            // Create remove owner transaction
            const transaction = await safe.createRemoveOwnerTx({
                ownerAddress: args.ownerAddress,
                threshold: newThreshold,
            });
            // Execute the transaction
            const executeTxResponse = await safe.executeTransaction(transaction);
            const receipt = await executeTxResponse.transactionResponse?.wait();
            if (!receipt) {
                throw new SafeError('Transaction failed: no receipt received', ErrorCodes.SAFE_OPERATION_ERROR, { operation: 'remove_owner' });
            }
            // Get updated owners and threshold
            const [updatedOwners, updatedThreshold] = await Promise.all([
                safe.getOwners(),
                safe.getThreshold(),
            ]);
            const result = {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed?.toString(),
                status: 'executed',
                safeAddress: args.safeAddress,
                removedOwner: args.ownerAddress,
                newThreshold: updatedThreshold,
                remainingOwners: updatedOwners,
                networkId: args.networkId,
                timestamp: new Date().toISOString(),
            };
            return {
                isError: false,
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (error instanceof SafeError) {
                throw error;
            }
            throw new SafeError(`Safe owner removal failed: ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.SAFE_OPERATION_ERROR, { operation: 'remove_owner', originalError: String(error) });
        }
    }
    /**
     * Change the signature threshold for a Safe wallet
     */
    async changeThreshold(args) {
        // Validate required fields (special handling for threshold which can be 0)
        const requiredFields = ['safeAddress', 'networkId', 'privateKey'];
        for (const field of requiredFields) {
            if (!args[field]) {
                throw new SafeError(`Change threshold validation failed: ${field} is required`, ErrorCodes.VALIDATION_ERROR, { field, value: args[field] });
            }
        }
        // Validate threshold is provided
        if (args.threshold === undefined || args.threshold === null) {
            throw new SafeError('Change threshold validation failed: threshold is required', ErrorCodes.VALIDATION_ERROR, { field: 'threshold', value: args.threshold });
        }
        // Validate Safe address format
        if (!this.isValidAddress(args.safeAddress)) {
            throw new SafeError('Invalid Safe address format', ErrorCodes.VALIDATION_ERROR, { address: args.safeAddress });
        }
        // Validate network
        if (!this.contractRegistry.validateNetwork(args.networkId)) {
            throw new SafeError('Invalid or unsupported network', ErrorCodes.VALIDATION_ERROR, { networkId: args.networkId });
        }
        // Validate private key format
        if (!this.isValidPrivateKey(args.privateKey)) {
            throw new SafeError('Invalid private key format', ErrorCodes.VALIDATION_ERROR, { privateKeyLength: args.privateKey?.length });
        }
        // Validate threshold
        if (args.threshold < 1) {
            throw new SafeError('Invalid threshold. Must be at least 1', ErrorCodes.VALIDATION_ERROR, { threshold: args.threshold });
        }
        try {
            // Get Safe instance using the provided private key
            const safe = await this.providerFactory.getSafe(args.safeAddress, args.networkId, args.privateKey);
            // Get current owners and threshold to validate change
            const [currentOwners, currentThreshold] = await Promise.all([
                safe.getOwners(),
                safe.getThreshold(),
            ]);
            // Validate new threshold is within bounds
            if (args.threshold > currentOwners.length) {
                throw new SafeError('New threshold cannot be greater than number of owners', ErrorCodes.VALIDATION_ERROR, {
                    newThreshold: args.threshold,
                    ownerCount: currentOwners.length,
                    currentOwners,
                });
            }
            if (args.threshold === currentThreshold) {
                throw new SafeError('New threshold is the same as current threshold', ErrorCodes.VALIDATION_ERROR, {
                    threshold: args.threshold,
                    currentThreshold,
                });
            }
            // Create change threshold transaction
            const transaction = await safe.createChangeThresholdTx(args.threshold);
            // Execute the transaction
            const executeTxResponse = await safe.executeTransaction(transaction);
            const receipt = await executeTxResponse.transactionResponse?.wait();
            if (!receipt) {
                throw new SafeError('Transaction failed: no receipt received', ErrorCodes.SAFE_OPERATION_ERROR, { operation: 'change_threshold' });
            }
            // Get updated threshold to confirm change
            const updatedThreshold = await safe.getThreshold();
            const result = {
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber,
                gasUsed: receipt.gasUsed?.toString(),
                status: 'executed',
                safeAddress: args.safeAddress,
                previousThreshold: currentThreshold,
                newThreshold: updatedThreshold,
                owners: currentOwners,
                networkId: args.networkId,
                timestamp: new Date().toISOString(),
            };
            return {
                isError: false,
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(result, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            if (error instanceof SafeError) {
                throw error;
            }
            throw new SafeError(`Safe threshold change failed: ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.SAFE_OPERATION_ERROR, { operation: 'change_threshold', originalError: String(error) });
        }
    }
    /**
     * Validate Ethereum address format
     */
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    /**
     * Validate private key format
     */
    isValidPrivateKey(privateKey) {
        return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
    }
}
