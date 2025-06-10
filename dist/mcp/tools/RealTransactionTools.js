import { OperationType } from '@safe-global/safe-core-sdk-types';
import { ProviderFactory } from '../../blockchain/ProviderFactory.js';
import { SafeError, ErrorCodes } from '../../utils/SafeError.js';
import { parseEther } from 'ethers';
/**
 * Real transaction management tools using Safe Global Protocol Kit
 */
export class RealTransactionTools {
    contractRegistry;
    providerFactory;
    constructor(contractRegistry) {
        this.contractRegistry = contractRegistry;
        this.providerFactory = new ProviderFactory();
    }
    getTools() {
        return [
            {
                name: 'safe_propose_transaction',
                description: 'Propose a transaction to a Safe wallet',
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address',
                        },
                        to: {
                            type: 'string',
                            description: 'Recipient address',
                        },
                        value: {
                            type: 'string',
                            description: 'Amount in ETH to send',
                        },
                        data: {
                            type: 'string',
                            description: 'Transaction data (optional)',
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier',
                            pattern: '^eip155:\\d+$',
                        },
                        privateKey: {
                            type: 'string',
                            description: 'Private key for signing',
                            pattern: '^0x[a-fA-F0-9]{64}$',
                        },
                        rpcUrl: {
                            type: 'string',
                            description: 'Custom RPC URL',
                        },
                    },
                    required: ['safeAddress', 'to', 'value', 'networkId', 'privateKey'],
                },
            },
            {
                name: 'safe_execute_transaction',
                description: 'Execute a Safe transaction directly',
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address',
                        },
                        to: {
                            type: 'string',
                            description: 'Recipient address',
                        },
                        value: {
                            type: 'string',
                            description: 'Amount in ETH to send',
                        },
                        data: {
                            type: 'string',
                            description: 'Transaction data (optional)',
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier',
                            pattern: '^eip155:\\d+$',
                        },
                        privateKey: {
                            type: 'string',
                            description: 'Private key for signing and execution',
                            pattern: '^0x[a-fA-F0-9]{64}$',
                        },
                        rpcUrl: {
                            type: 'string',
                            description: 'Custom RPC URL',
                        },
                    },
                    required: ['safeAddress', 'to', 'value', 'networkId', 'privateKey'],
                },
            },
        ];
    }
    async handleToolCall(name, arguments_) {
        try {
            switch (name) {
                case 'safe_propose_transaction':
                    return await this.handleProposeTransaction(arguments_);
                case 'safe_execute_transaction':
                    return await this.handleExecuteTransaction(arguments_);
                default:
                    throw new SafeError(`Unknown tool: ${name}`, ErrorCodes.TOOL_NOT_FOUND);
            }
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async handleProposeTransaction(arguments_) {
        const args = this.validateTransactionArgs(arguments_);
        try {
            const result = await this.proposeTransaction(args);
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
            throw new SafeError(`Failed to propose transaction: ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.SAFE_OPERATION_ERROR);
        }
    }
    async handleExecuteTransaction(arguments_) {
        const args = this.validateTransactionArgs(arguments_);
        try {
            const result = await this.executeTransaction(args);
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
            throw new SafeError(`Failed to execute transaction: ${error instanceof Error ? error.message : String(error)}`, ErrorCodes.SAFE_OPERATION_ERROR);
        }
    }
    async proposeTransaction(args) {
        // Create Safe SDK instance
        const safeSdk = await this.providerFactory.getSafe(args.safeAddress, args.networkId, args.privateKey, args.rpcUrl);
        // Create transaction data
        const safeTransactionData = {
            to: args.to,
            value: parseEther(args.value).toString(),
            data: args.data || '0x',
            operation: OperationType.Call,
        };
        // Create Safe transaction
        const safeTransaction = await safeSdk.createTransaction({
            transactions: [safeTransactionData]
        });
        // Sign the transaction
        const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction);
        // Get transaction hash
        const safeTxHash = await safeSdk.getTransactionHash(signedSafeTransaction);
        // Get current threshold and confirmations
        const threshold = await safeSdk.getThreshold();
        const confirmations = signedSafeTransaction.signatures.size;
        return {
            safeTxHash,
            status: confirmations >= threshold ? 'executed' : 'proposed',
            confirmations,
            requiredConfirmations: threshold,
            networkId: args.networkId,
        };
    }
    async executeTransaction(args) {
        // Create Safe SDK instance
        const safeSdk = await this.providerFactory.getSafe(args.safeAddress, args.networkId, args.privateKey, args.rpcUrl);
        // Create transaction data
        const safeTransactionData = {
            to: args.to,
            value: parseEther(args.value).toString(),
            data: args.data || '0x',
            operation: OperationType.Call,
        };
        // Create Safe transaction
        const safeTransaction = await safeSdk.createTransaction({
            transactions: [safeTransactionData]
        });
        // Sign the transaction
        const signedSafeTransaction = await safeSdk.signTransaction(safeTransaction);
        // Get transaction hash
        const safeTxHash = await safeSdk.getTransactionHash(signedSafeTransaction);
        try {
            // Execute the transaction
            const executeTxResponse = await safeSdk.executeTransaction(signedSafeTransaction);
            const receipt = await executeTxResponse.transactionResponse?.wait();
            const threshold = await safeSdk.getThreshold();
            return {
                safeTxHash,
                transactionHash: receipt?.hash,
                status: 'executed',
                confirmations: threshold,
                requiredConfirmations: threshold,
                gasUsed: receipt?.gasUsed?.toString(),
                networkId: args.networkId,
            };
        }
        catch (error) {
            const threshold = await safeSdk.getThreshold();
            return {
                safeTxHash,
                status: 'failed',
                confirmations: 1,
                requiredConfirmations: threshold,
                networkId: args.networkId,
            };
        }
    }
    validateTransactionArgs(arguments_) {
        if (!arguments_ || typeof arguments_ !== 'object') {
            throw new SafeError('Invalid input: arguments object required', ErrorCodes.INVALID_INPUT);
        }
        const args = arguments_;
        // Validate required fields
        if (!args.safeAddress || !this.contractRegistry.validateSafeAddress(args.safeAddress)) {
            throw new SafeError('Valid Safe address is required', ErrorCodes.INVALID_ADDRESS);
        }
        if (!args.to || !this.contractRegistry.validateSafeAddress(args.to)) {
            throw new SafeError('Valid recipient address is required', ErrorCodes.INVALID_ADDRESS);
        }
        if (!args.value || typeof args.value !== 'string') {
            throw new SafeError('Value is required as string', ErrorCodes.INVALID_INPUT);
        }
        // Validate value format
        try {
            parseEther(args.value);
        }
        catch {
            throw new SafeError('Invalid value format', ErrorCodes.INVALID_INPUT);
        }
        if (!args.networkId || !this.contractRegistry.isNetworkSupported(args.networkId)) {
            throw new SafeError('Valid network ID is required', ErrorCodes.NETWORK_NOT_SUPPORTED);
        }
        if (!args.privateKey || !/^0x[a-fA-F0-9]{64}$/.test(args.privateKey)) {
            throw new SafeError('Valid private key is required', ErrorCodes.INVALID_INPUT);
        }
        return args;
    }
}
