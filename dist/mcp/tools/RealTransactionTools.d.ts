import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { OperationType } from '@safe-global/safe-core-sdk-types';
import { ContractRegistry } from '../../network/ContractRegistry.js';
export interface SafeTransactionData {
    to: string;
    value: string;
    data?: string;
    operation?: OperationType;
    safeTxGas?: string;
    baseGas?: string;
    gasPrice?: string;
    gasToken?: string;
    refundReceiver?: string;
    nonce?: number;
}
export interface TransactionResult {
    safeTxHash: string;
    transactionHash?: string;
    status: 'proposed' | 'executed' | 'failed';
    confirmations: number;
    requiredConfirmations: number;
    gasUsed?: string;
    networkId: string;
}
/**
 * Real transaction management tools using Safe Global Protocol Kit
 */
export declare class RealTransactionTools {
    private contractRegistry;
    private providerFactory;
    constructor(contractRegistry: ContractRegistry);
    getTools(): Tool[];
    handleToolCall(name: string, arguments_: unknown): Promise<CallToolResult>;
    private handleProposeTransaction;
    private handleExecuteTransaction;
    private proposeTransaction;
    private executeTransaction;
    private validateTransactionArgs;
}
