import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';
export interface WalletConfig {
    owners: string[];
    threshold: number;
    networkId: string;
    saltNonce?: string;
    fallbackHandler?: string;
    rpcUrl?: string;
}
export interface WalletDeploymentConfig extends WalletConfig {
    privateKey: string;
}
export interface WalletDeploymentResult {
    address: string;
    transactionHash: string;
    isDeployed: boolean;
    networkId: string;
    gasUsed: string;
    owners: string[];
    threshold: number;
}
export interface AddressPredictionResult {
    address: string;
    isDeployed: boolean;
    networkId: string;
    saltNonce?: string;
}
/**
 * Real wallet creation tools using Safe Global Protocol Kit
 */
export declare class RealWalletCreationTools {
    private contractRegistry;
    private providerFactory;
    constructor(contractRegistry: ContractRegistry);
    getTools(): Tool[];
    handleToolCall(name: string, arguments_: unknown): Promise<CallToolResult>;
    private handleCreateWalletConfig;
    private handlePredictAddress;
    private handleDeployWallet;
    private validateConfig;
    private getConfigWarnings;
}
