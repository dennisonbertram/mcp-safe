import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';
/**
 * Transaction Management Tools for Safe MCP Server
 *
 * Provides tools for proposing and executing Safe multisig transactions:
 * - safe_propose_transaction: Create a transaction proposal
 * - safe_execute_transaction: Execute a transaction directly
 */
export declare class TransactionManagementTools {
    private contractRegistry;
    private providerFactory;
    constructor(contractRegistry: ContractRegistry);
    /**
     * Get list of available transaction management tools
     */
    getTools(): Tool[];
    /**
     * Handle tool calls for transaction management
     */
    handleToolCall(name: string, args: any): Promise<CallToolResult>;
    /**
     * Propose a new Safe transaction
     */
    private proposeTransaction;
    /**
     * Execute a Safe transaction directly
     */
    private executeTransaction;
    /**
     * Validate Ethereum address format
     */
    private isValidAddress;
    /**
     * Validate value format (numeric string)
     */
    private isValidValue;
    /**
     * Validate data format (hex string)
     */
    private isValidData;
    /**
     * Validate private key format
     */
    private isValidPrivateKey;
    /**
     * Generate mock transaction hash
     */
    private generateTransactionHash;
    /**
     * Generate mock Safe transaction hash
     */
    private generateSafeTxHash;
}
