// Network and chain types
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  safeServiceUrl?: string;
  contractAddresses: SafeContractAddresses;
}

export interface SafeContractAddresses {
  safeSingletonAddress: string;
  safeProxyFactoryAddress: string;
  multiSendAddress: string;
  multiSendCallOnlyAddress: string;
  fallbackHandlerAddress: string;
  signMessageLibAddress: string;
  createCallAddress: string;
  simulateTxAccessorAddress: string;
}

// SAFE wallet types
export interface SafeWalletConfig {
  owners: string[];
  threshold: number;
  saltNonce?: string;
}

export interface SafeWalletInfo {
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
  version: string;
  modules: string[];
  guard?: string;
  fallbackHandler?: string;
}

// Transaction types
export interface SafeTransaction {
  to: string;
  value: string;
  data: string;
  operation: OperationType;
  safeTxGas: string;
  baseGas: string;
  gasPrice: string;
  gasToken: string;
  refundReceiver: string;
  nonce: number;
  signatures?: string;
}

export enum OperationType {
  Call = 0,
  DelegateCall = 1,
}

export interface TransactionData {
  to: string;
  value: string;
  data: string;
  operation?: OperationType;
}

// MCP tool parameter types
export interface CreateWalletParams {
  owners: string[];
  threshold: number;
  saltNonce?: string;
  networkId: number;
}

export interface AddOwnerParams {
  safeAddress: string;
  ownerAddress: string;
  threshold?: number;
  networkId: number;
}

export interface RemoveOwnerParams {
  safeAddress: string;
  ownerAddress: string;
  newThreshold?: number;
  networkId: number;
}

export interface SwapOwnerParams {
  safeAddress: string;
  oldOwnerAddress: string;
  newOwnerAddress: string;
  networkId: number;
}

export interface ChangeThresholdParams {
  safeAddress: string;
  newThreshold: number;
  networkId: number;
}

export interface CreateTransactionParams {
  safeAddress: string;
  transactions: TransactionData[];
  networkId: number;
  safeTxGas?: string;
  baseGas?: string;
  gasPrice?: string;
  gasToken?: string;
  refundReceiver?: string;
  nonce?: number;
}

export interface SignTransactionParams {
  safeAddress: string;
  transaction: SafeTransaction;
  networkId: number;
}

export interface ExecuteTransactionParams {
  safeAddress: string;
  transaction: SafeTransaction;
  networkId: number;
}

// Error types
export class SafeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SafeError';
  }
}

export class NetworkError extends SafeError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', details);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends SafeError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class TransactionError extends SafeError {
  constructor(message: string, details?: unknown) {
    super(message, 'TRANSACTION_ERROR', details);
    this.name = 'TransactionError';
  }
}
