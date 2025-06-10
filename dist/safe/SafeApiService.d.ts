import { ContractRegistry } from '../network/ContractRegistry.js';
export interface SafeTransactionProposal {
    to: string;
    value: string;
    data: string;
    nonce: number;
    safeTxGas: string;
    baseGas: string;
    gasPrice: string;
    gasToken: string;
    refundReceiver: string;
    safeTxHash: string;
}
export interface SafeSignature {
    signer: string;
    data: string;
}
export interface TransactionProposalResult {
    safeTxHash: string;
    proposer: string;
    confirmations: SafeConfirmation[];
    confirmationsRequired: number;
    isExecuted: boolean;
}
export interface SafeConfirmation {
    owner: string;
    signature: string;
    signatureType: string;
    submissionDate: string;
}
export interface PendingTransaction {
    safeTxHash: string;
    to: string;
    value: string;
    data: string;
    confirmations: SafeConfirmation[];
    confirmationsRequired: number;
    nonce: number;
    submissionDate: string;
    isExecuted: boolean;
}
export interface TransactionHistory {
    count: number;
    next: string | null;
    previous: string | null;
    results: HistoricalTransaction[];
}
export interface HistoricalTransaction {
    safeTxHash: string;
    to: string;
    value: string;
    data: string;
    confirmations: SafeConfirmation[];
    isExecuted: boolean;
    executionDate: string | null;
    submissionDate: string;
    transactionHash: string | null;
    gasUsed: number | null;
}
export interface SafeServiceInfo {
    address: string;
    owners: string[];
    threshold: number;
    version: string;
    implementation: string;
    modules: string[];
    guard?: string;
}
export interface PaginationOptions {
    limit?: number;
    offset?: number;
}
export interface HistoryFilter extends PaginationOptions {
    executed?: boolean;
    queued?: boolean;
    trusted?: boolean;
}
export declare class SafeApiService {
    private contractRegistry;
    private apiClients;
    private serviceUrls;
    constructor(contractRegistry: ContractRegistry);
    private getApiClient;
    getServiceUrl(networkId: string): string;
    proposeTransaction(safeAddress: string, networkId: string, transaction: SafeTransactionProposal, senderSignature: SafeSignature): Promise<TransactionProposalResult>;
    getPendingTransactions(safeAddress: string, networkId: string, options?: PaginationOptions): Promise<PendingTransaction[]>;
    getTransactionHistory(safeAddress: string, networkId: string, filter?: HistoryFilter): Promise<TransactionHistory>;
    confirmTransaction(safeTxHash: string, networkId: string, signature: SafeSignature): Promise<SafeConfirmation>;
    getTransaction(safeTxHash: string, networkId: string): Promise<PendingTransaction>;
    getSafeInfo(safeAddress: string, networkId: string): Promise<SafeServiceInfo>;
    private withRetry;
}
