import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';
export interface SafeInfo {
    address: string;
    owners: string[];
    threshold: number;
    nonce: number;
    version: string;
    isDeployed: boolean;
    networkId: string;
    balance: string;
    modules: string[];
    guard?: string | undefined;
    fallbackHandler?: string | undefined;
}
export declare class WalletQueryTools {
    private contractRegistry;
    private providerFactory;
    constructor(contractRegistry: ContractRegistry);
    getTools(): Tool[];
    handleToolCall(name: string, arguments_: unknown): Promise<CallToolResult>;
    private handleGetSafeInfo;
    private getSafeInfo;
}
