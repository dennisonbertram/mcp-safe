import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';
export interface WalletConfig {
    owners: string[];
    threshold: number;
    networkId: string;
    saltNonce?: string;
    fallbackHandler?: string;
    modules?: string[];
    guard?: string;
    paymentToken?: string;
    payment?: string;
    paymentReceiver?: string;
}
export interface ConfigValidationResult {
    isValid: boolean;
    configuration?: WalletConfig | undefined;
    errors: string[];
    warnings: string[];
}
export interface AddressPredictionResult {
    address: string;
    isDeployed: boolean;
    networkId: string;
    configuration: WalletConfig;
    saltNonce?: string | undefined;
}
export interface WalletDeploymentConfig extends WalletConfig {
    privateKey: string;
}
export interface WalletDeploymentResult {
    address: string;
    transactionHash: string;
    isDeployed: boolean;
    networkId: string;
    configuration: WalletConfig;
    gasUsed?: string;
}
export declare class WalletCreationTools {
    private contractRegistry;
    constructor(contractRegistry: ContractRegistry);
    getTools(): Tool[];
    handleToolCall(name: string, arguments_: unknown): Promise<CallToolResult>;
    private handleCreateWalletConfig;
    private handlePredictAddress;
    private handleDeployWallet;
    private deploySafeWallet;
    private generateTransactionHash;
    private predictSafeAddress;
    private hashConfiguration;
    private simpleHash;
    private checkIfDeployed;
    private validateWalletConfig;
}
