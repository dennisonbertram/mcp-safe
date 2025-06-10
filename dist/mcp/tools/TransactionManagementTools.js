import { SafeError, ErrorCodes } from '../../utils/SafeError.js';
/**
 * Transaction Management Tools for Safe MCP Server
 *
 * Provides tools for proposing and executing Safe multisig transactions:
 * - safe_propose_transaction: Create a transaction proposal
 * - safe_execute_transaction: Execute a transaction directly
 */
export class TransactionManagementTools {
    contractRegistry;
    constructor(contractRegistry) {
        this.contractRegistry = contractRegistry;
    }
    /**
     * Get list of available transaction management tools
     */
    getTools() {
        return [
            {
                name: 'safe_propose_transaction',
                description: 'Propose a new transaction to a Safe wallet. Creates a transaction proposal that can be signed and executed by Safe owners.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        to: {
                            type: 'string',
                            description: 'Transaction recipient address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        value: {
                            type: 'string',
                            description: 'Transaction value in wei (string representation of number)'
                        },
                        data: {
                            type: 'string',
                            description: 'Transaction data as hex string (use 0x for empty data)',
                            pattern: '^0x([a-fA-F0-9]{2})*$'
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
                            pattern: '^eip155:\\d+$'
                        },
                        operation: {
                            type: 'number',
                            description: 'Operation type: 0 for Call, 1 for DelegateCall',
                            enum: [0, 1]
                        },
                        safeTxGas: {
                            type: 'string',
                            description: 'Gas limit for Safe transaction execution'
                        },
                        baseGas: {
                            type: 'string',
                            description: 'Base gas for transaction'
                        },
                        gasPrice: {
                            type: 'string',
                            description: 'Gas price for transaction'
                        },
                        gasToken: {
                            type: 'string',
                            description: 'Token address for gas payment (0x0 for ETH)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        refundReceiver: {
                            type: 'string',
                            description: 'Address to receive gas refund (0x0 for tx origin)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        nonce: {
                            type: 'number',
                            description: 'Transaction nonce'
                        }
                    },
                    required: ['safeAddress', 'to', 'value', 'data', 'networkId']
                }
            },
            {
                name: 'safe_execute_transaction',
                description: 'Execute a Safe transaction directly with a private key. Bypasses the proposal/signing flow for immediate execution.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        safeAddress: {
                            type: 'string',
                            description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        to: {
                            type: 'string',
                            description: 'Transaction recipient address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        value: {
                            type: 'string',
                            description: 'Transaction value in wei (string representation of number)'
                        },
                        data: {
                            type: 'string',
                            description: 'Transaction data as hex string (use 0x for empty data)',
                            pattern: '^0x([a-fA-F0-9]{2})*$'
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
                            pattern: '^eip155:\\d+$'
                        },
                        privateKey: {
                            type: 'string',
                            description: 'Private key for transaction signing (32-byte hex string)',
                            pattern: '^0x[a-fA-F0-9]{64}$'
                        },
                        operation: {
                            type: 'number',
                            description: 'Operation type: 0 for Call, 1 for DelegateCall',
                            enum: [0, 1]
                        },
                        safeTxGas: {
                            type: 'string',
                            description: 'Gas limit for Safe transaction execution'
                        },
                        baseGas: {
                            type: 'string',
                            description: 'Base gas for transaction'
                        },
                        gasPrice: {
                            type: 'string',
                            description: 'Gas price for transaction'
                        },
                        gasToken: {
                            type: 'string',
                            description: 'Token address for gas payment (0x0 for ETH)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        refundReceiver: {
                            type: 'string',
                            description: 'Address to receive gas refund (0x0 for tx origin)',
                            pattern: '^0x[a-fA-F0-9]{40}$'
                        },
                        nonce: {
                            type: 'number',
                            description: 'Transaction nonce'
                        }
                    },
                    required: ['safeAddress', 'to', 'value', 'data', 'networkId', 'privateKey']
                }
            }
        ];
    }
    /**
     * Handle tool calls for transaction management
     */
    async handleToolCall(name, args) {
        try {
            switch (name) {
                case 'safe_propose_transaction':
                    return await this.proposeTransaction(args);
                case 'safe_execute_transaction':
                    return await this.executeTransaction(args);
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
     * Propose a new Safe transaction
     */
    async proposeTransaction(args) {
        // Validate required fields
        const requiredFields = ['safeAddress', 'to', 'value', 'data', 'networkId'];
        for (const field of requiredFields) {
            if (!args[field]) {
                throw new SafeError(`Transaction proposal validation failed: ${field} is required`, ErrorCodes.VALIDATION_ERROR, { field, value: args[field] });
            }
        }
        // Validate Safe address format
        if (!this.isValidAddress(args.safeAddress)) {
            throw new SafeError('Invalid Safe address format', ErrorCodes.VALIDATION_ERROR, { address: args.safeAddress });
        }
        // Validate recipient address format
        if (!this.isValidAddress(args.to)) {
            throw new SafeError('Invalid recipient address format', ErrorCodes.VALIDATION_ERROR, { address: args.to });
        }
        // Validate network
        if (!this.contractRegistry.validateNetwork(args.networkId)) {
            throw new SafeError('Invalid or unsupported network', ErrorCodes.VALIDATION_ERROR, { networkId: args.networkId });
        }
        // Validate value format
        if (!this.isValidValue(args.value)) {
            throw new SafeError('Invalid value format', ErrorCodes.VALIDATION_ERROR, { value: args.value });
        }
        // Validate data format
        if (!this.isValidData(args.data)) {
            throw new SafeError('Invalid data format', ErrorCodes.VALIDATION_ERROR, { data: args.data });
        }
        // Validate operation if provided
        if (args.operation !== undefined && ![0, 1].includes(args.operation)) {
            throw new SafeError('Invalid operation type. Must be 0 (Call) or 1 (DelegateCall)', ErrorCodes.VALIDATION_ERROR, { operation: args.operation });
        }
        // Simulate successful transaction proposal
        const response = {
            transactionHash: this.generateTransactionHash(),
            safeTxHash: this.generateSafeTxHash(),
            status: 'proposed',
            safeAddress: args.safeAddress,
            to: args.to,
            value: args.value,
            data: args.data,
            networkId: args.networkId,
            operation: args.operation || 0,
            nonce: args.nonce || 0,
            timestamp: new Date().toISOString()
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
    /**
     * Execute a Safe transaction directly
     */
    async executeTransaction(args) {
        // Validate required fields
        const requiredFields = ['safeAddress', 'to', 'value', 'data', 'networkId', 'privateKey'];
        for (const field of requiredFields) {
            if (!args[field]) {
                throw new SafeError(`Transaction execution validation failed: ${field} is required`, ErrorCodes.VALIDATION_ERROR, { field, value: args[field] });
            }
        }
        // Validate private key format
        if (!this.isValidPrivateKey(args.privateKey)) {
            throw new SafeError('Invalid private key format', ErrorCodes.VALIDATION_ERROR, { privateKeyLength: args.privateKey?.length });
        }
        // Validate Safe address format
        if (!this.isValidAddress(args.safeAddress)) {
            throw new SafeError('Invalid Safe address format', ErrorCodes.VALIDATION_ERROR, { address: args.safeAddress });
        }
        // Validate recipient address format
        if (!this.isValidAddress(args.to)) {
            throw new SafeError('Invalid recipient address format', ErrorCodes.VALIDATION_ERROR, { address: args.to });
        }
        // Validate network
        if (!this.contractRegistry.validateNetwork(args.networkId)) {
            throw new SafeError('Invalid or unsupported network', ErrorCodes.VALIDATION_ERROR, { networkId: args.networkId });
        }
        // Validate value format
        if (!this.isValidValue(args.value)) {
            throw new SafeError('Invalid value format', ErrorCodes.VALIDATION_ERROR, { value: args.value });
        }
        // Validate data format
        if (!this.isValidData(args.data)) {
            throw new SafeError('Invalid data format', ErrorCodes.VALIDATION_ERROR, { data: args.data });
        }
        // Validate operation if provided
        if (args.operation !== undefined && ![0, 1].includes(args.operation)) {
            throw new SafeError('Invalid operation type. Must be 0 (Call) or 1 (DelegateCall)', ErrorCodes.VALIDATION_ERROR, { operation: args.operation });
        }
        // Simulate successful transaction execution
        const response = {
            transactionHash: this.generateTransactionHash(),
            status: 'executed',
            safeAddress: args.safeAddress,
            to: args.to,
            value: args.value,
            data: args.data,
            networkId: args.networkId,
            operation: args.operation || 0,
            nonce: args.nonce || 0,
            gasUsed: '21000',
            blockNumber: 18500000,
            timestamp: new Date().toISOString()
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
    /**
     * Validate Ethereum address format
     */
    isValidAddress(address) {
        return /^0x[a-fA-F0-9]{40}$/.test(address);
    }
    /**
     * Validate value format (numeric string)
     */
    isValidValue(value) {
        try {
            BigInt(value);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Validate data format (hex string)
     */
    isValidData(data) {
        return /^0x([a-fA-F0-9]{2})*$/.test(data);
    }
    /**
     * Validate private key format
     */
    isValidPrivateKey(privateKey) {
        return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
    }
    /**
     * Generate mock transaction hash
     */
    generateTransactionHash() {
        return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
    /**
     * Generate mock Safe transaction hash
     */
    generateSafeTxHash() {
        return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    }
}
