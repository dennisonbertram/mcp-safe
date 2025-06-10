import { z } from 'zod';
import { NetworkManager } from '../network/NetworkManager.js';
/**
 * Tool handler function signature
 */
export interface ToolHandler<T = any> {
    name: string;
    description: string;
    inputSchema: z.ZodSchema<T>;
    handle(input: T, networkManager: NetworkManager): Promise<any>;
}
/**
 * Safe contract deployment information
 */
export interface SafeDeployment {
    address: string;
    transactionHash: string;
    blockNumber: number;
    gasUsed: number;
    deployer: string;
}
/**
 * Network deployment information
 */
export interface NetworkDeployment {
    networkId: string;
    chainId: number;
    contracts: {
        singletonFactory: string;
        safeSingleton: string;
        safeProxyFactory: string;
        fallbackHandler: string;
        multiSend: string;
    };
    deployments: ContractDeployment[];
    totalGasUsed: number;
}
/**
 * Individual contract deployment details
 */
export interface ContractDeployment {
    name: string;
    address: string;
    txHash: string;
    gasUsed: number;
}
/**
 * Gas estimation information
 */
export interface GasEstimate {
    gasLimit: bigint;
    gasPrice: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    estimatedCost: bigint;
}
/**
 * Transaction options
 */
export interface TransactionOptions {
    gasLimit?: bigint;
    gasPrice?: bigint;
    maxFeePerGas?: bigint;
    maxPriorityFeePerGas?: bigint;
    nonce?: number;
    value?: bigint;
}
/**
 * Safe wallet information
 */
export interface SafeWalletInfo {
    address: string;
    owners: string[];
    threshold: number;
    nonce: number;
    balance: string;
    modules: string[];
    guards: string[];
    version: string;
    isDeployed: boolean;
}
/**
 * Safe transaction data
 */
export interface SafeTransactionData {
    to: string;
    value: string;
    data: string;
    operation: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
}
/**
 * Safe transaction execution result
 */
export interface SafeTransactionResult {
    transactionHash: string;
    success: boolean;
    gasUsed: number;
    blockNumber: number;
    confirmations: number;
    events?: any[];
}
/**
 * Owner management operation result
 */
export interface OwnerManagementResult {
    transactionHash: string;
    success: boolean;
    gasUsed: number;
    newOwners: string[];
    newThreshold: number;
}
/**
 * Error context for Safe operations
 */
export interface SafeErrorContext {
    networkId?: string;
    address?: string;
    transactionHash?: string;
    blockNumber?: number;
    [key: string]: any;
}
/**
 * Configuration for Safe contract deployment
 */
export interface SafeDeploymentConfig {
    owners: string[];
    threshold: number;
    fallbackHandler?: string;
    paymentToken?: string;
    payment?: string;
    paymentReceiver?: string;
    salt?: string;
}
/**
 * Safe contract ABI interfaces
 */
export interface SafeContractABI {
    [methodName: string]: string[];
}
/**
 * Network provider configuration
 */
export interface ProviderConfig {
    url: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
}
/**
 * Multi-signature scenario for testing
 */
export interface MultiSigScenario {
    owners: string[];
    threshold: number;
    privateKeys: string[];
    scenario: string;
}
/**
 * Contract verification result
 */
export interface ContractVerification {
    isVerified: boolean;
    contractName?: string;
    sourceCode?: string;
    abi?: any[];
    constructorArguments?: string;
}
/**
 * Blockchain network information
 */
export interface NetworkInfo {
    networkId: string;
    chainId: number;
    name: string;
    blockNumber: number;
    gasPrice: string;
    isTestnet: boolean;
}
/**
 * Safe module information
 */
export interface SafeModuleInfo {
    address: string;
    name: string;
    version: string;
    isEnabled: boolean;
}
/**
 * Safe guard information
 */
export interface SafeGuardInfo {
    address: string;
    name: string;
    version: string;
    isEnabled: boolean;
}
/**
 * Transaction history entry
 */
export interface TransactionHistoryEntry {
    transactionHash: string;
    blockNumber: number;
    timestamp: number;
    from: string;
    to: string;
    value: string;
    gasUsed: number;
    success: boolean;
    data?: string;
    logs?: any[];
}
/**
 * Safe creation parameters
 */
export interface SafeCreationParams {
    owners: string[];
    threshold: number;
    fallbackHandler?: string;
    salt?: string;
    callback?: string;
}
/**
 * Deployment verification parameters
 */
export interface DeploymentVerification {
    expectedAddress: string;
    actualAddress: string;
    isMatch: boolean;
    hasCode: boolean;
    codeHash: string;
}
/**
 * Infrastructure deployment result
 */
export interface InfrastructureDeploymentResult {
    success: boolean;
    networkId: string;
    chainId: number;
    deployerAddress: string;
    deployment: NetworkDeployment;
    gasUsed: number;
    message: string;
}
