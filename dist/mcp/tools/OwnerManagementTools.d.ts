import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';
/**
 * Owner Management Tools for Safe MCP Server
 *
 * Provides tools for managing Safe wallet owners:
 * - safe_add_owner: Add a new owner to a Safe wallet
 * - safe_remove_owner: Remove an existing owner from a Safe wallet
 * - safe_change_threshold: Change the signature threshold for a Safe wallet
 */
export declare class OwnerManagementTools {
    private contractRegistry;
    constructor(contractRegistry: ContractRegistry);
    /**
     * Get list of available owner management tools
     */
    getTools(): Tool[];
    /**
     * Handle tool calls for owner management
     */
    handleToolCall(name: string, args: any): Promise<CallToolResult>;
    /**
     * Add a new owner to a Safe wallet
     */
    private addOwner;
    /**
     * Remove an existing owner from a Safe wallet
     */
    private removeOwner;
    /**
     * Change the signature threshold for a Safe wallet
     */
    private changeThreshold;
    /**
     * Validate Ethereum address format
     */
    private isValidAddress;
    /**
     * Validate private key format
     */
    private isValidPrivateKey;
    /**
     * Generate mock transaction hash
     */
    private generateTransactionHash;
}
