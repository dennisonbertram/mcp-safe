import { NetworkProviderManager } from '../network/NetworkProviderManager.js';
import { ContractRegistry } from '../network/ContractRegistry.js';
declare class MockSafe {
    private address;
    constructor(address: string);
    getAddress(): string;
    getOwners(): Promise<string[]>;
    getThreshold(): Promise<number>;
    getNonce(): Promise<number>;
    getContractVersion(): Promise<string>;
    getModules(): Promise<string[]>;
    createTransaction(txData: any): Promise<any>;
    createSafeDeploymentTransaction(config: any, salt?: string): Promise<any>;
}
export interface SafeDeployConfig {
    owners: string[];
    threshold: number;
    networkId: string;
    saltNonce?: string | undefined;
    fallbackHandler?: string;
    paymentToken?: string;
    payment?: string;
    paymentReceiver?: string;
}
export interface SafeDeployResult {
    safeAddress: string;
    transactionHash: string;
    gasUsed: number;
    saltNonce?: string | undefined;
}
export interface SafeInfo {
    address: string;
    owners: string[];
    threshold: number;
    nonce: number;
    version: string;
    implementation: string;
    modules: string[];
    guard?: string;
}
export interface TransactionData {
    to: string;
    value: string;
    data: string;
}
export interface SafeTransactionData extends TransactionData {
    nonce: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    safeTxHash?: string;
}
export interface SafeSignature {
    signer: string;
    data: string;
}
export interface GasEstimate {
    safeTxGas: number;
    baseGas: number;
    gasPrice: string;
    gasToken: string;
}
export interface ExecutionResult {
    transactionHash: string;
    success: boolean;
    gasUsed: number;
    blockNumber: number;
}
export declare class SafeProtocolKit {
    private providerManager;
    private contractRegistry;
    private safeInstances;
    private transactionCache;
    constructor(providerManager: NetworkProviderManager, contractRegistry: ContractRegistry);
    createSafeInstance(safeAddress: string, networkId: string): Promise<MockSafe>;
    deploySafe(config: SafeDeployConfig): Promise<SafeDeployResult>;
    private validateDeployConfig;
    getSafeInfo(safeAddress: string, networkId: string): Promise<SafeInfo>;
    createTransaction(safeAddress: string, networkId: string, txData: TransactionData): Promise<SafeTransactionData>;
    createBatchTransaction(safeAddress: string, networkId: string, transactions: TransactionData[]): Promise<SafeTransactionData>;
    estimateTransactionGas(safeAddress: string, networkId: string, txData: TransactionData): Promise<GasEstimate>;
    signTransaction(transaction: SafeTransactionData, privateKey: string, networkId: string): Promise<SafeSignature>;
    executeTransaction(transaction: SafeTransactionData, signatures: SafeSignature[], executorPrivateKey: string, networkId: string): Promise<ExecutionResult>;
    getBalance(safeAddress: string, networkId: string): Promise<string>;
    getTokenBalance(safeAddress: string, tokenAddress: string, networkId: string): Promise<string>;
    getNextNonce(safeAddress: string, networkId: string): Promise<number>;
}
export {};
