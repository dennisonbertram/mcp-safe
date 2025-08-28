import { ContractRegistry } from '../network/ContractRegistry.js';
import { SafeError } from '../utils/SafeError.js';

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

export class SafeApiService {
  private contractRegistry: ContractRegistry;
  private apiClients: Map<string, any> = new Map();
  private serviceUrls: Record<string, string> = {
    'eip155:1': 'https://safe-transaction-mainnet.safe.global',
    'eip155:137': 'https://safe-transaction-polygon.safe.global',
    'eip155:42161': 'https://safe-transaction-arbitrum.safe.global',
    'eip155:11155111': 'https://safe-transaction-sepolia.safe.global',
  };

  constructor(contractRegistry: ContractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  private async getApiClient(networkId: string): Promise<any> {
    if (!this.contractRegistry.isNetworkSupported(networkId)) {
      throw new SafeError(
        `Network ${networkId} is not supported`,
        'NETWORK_NOT_SUPPORTED'
      );
    }

    if (this.apiClients.has(networkId)) {
      return this.apiClients.get(networkId)!;
    }

    const serviceUrl = this.getServiceUrl(networkId);

    // Convert CAIP-2 networkId to chainId
    const chainIdStr = networkId.split(':')[1];
    if (!chainIdStr) {
      throw new SafeError('Invalid network ID format', 'INVALID_NETWORK_ID');
    }
    const chainId = BigInt(chainIdStr);

    // Dynamic import to handle ESM/CJS interop for Safe API Kit
    const SafeApiKitModule = await import('@safe-global/api-kit');
    const SafeApiKit = SafeApiKitModule.default;

    const apiClient = new SafeApiKit({
      txServiceUrl: serviceUrl,
      chainId: chainId,
    });

    this.apiClients.set(networkId, apiClient);
    return apiClient;
  }

  getServiceUrl(networkId: string): string {
    if (!(networkId in this.serviceUrls)) {
      throw new SafeError(
        `Safe Transaction Service not available for network ${networkId}`,
        'SERVICE_NOT_AVAILABLE'
      );
    }
    return this.serviceUrls[networkId]!;
  }

  async proposeTransaction(
    safeAddress: string,
    networkId: string,
    transaction: SafeTransactionProposal,
    senderSignature: SafeSignature
  ): Promise<TransactionProposalResult> {
    // Validate inputs
    if (!this.contractRegistry.validateSafeAddress(safeAddress)) {
      throw new SafeError('Invalid Safe address', 'INVALID_ADDRESS');
    }

    await this.getApiClient(networkId);

    // Mock proposal result
    const proposalResult: TransactionProposalResult = {
      safeTxHash: transaction.safeTxHash,
      proposer: senderSignature.signer,
      confirmations: [
        {
          owner: senderSignature.signer,
          signature: senderSignature.data,
          signatureType: 'EOA',
          submissionDate: new Date().toISOString(),
        },
      ],
      confirmationsRequired: 2, // Mock threshold
      isExecuted: false,
    };

    return proposalResult;
  }

  async getPendingTransactions(
    safeAddress: string,
    networkId: string,
    options?: PaginationOptions
  ): Promise<PendingTransaction[]> {
    await this.getApiClient(networkId);

    // Mock pending transactions
    const pendingTxs: PendingTransaction[] = [
      {
        safeTxHash:
          '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
        confirmations: [
          {
            owner: '0x1234567890123456789012345678901234567890',
            signature: '0x123456',
            signatureType: 'EOA',
            submissionDate: new Date().toISOString(),
          },
        ],
        confirmationsRequired: 2,
        nonce: 0,
        submissionDate: new Date().toISOString(),
        isExecuted: false,
      },
    ];

    // Apply pagination
    const limit = options?.limit || 20;
    const offset = options?.offset || 0;

    return pendingTxs.slice(offset, offset + limit);
  }

  async getTransactionHistory(
    safeAddress: string,
    networkId: string,
    filter?: HistoryFilter
  ): Promise<TransactionHistory> {
    try {
      const apiClient = await this.getApiClient(networkId);

      // Validate Safe address format
      if (!this.contractRegistry.validateSafeAddress(safeAddress)) {
        throw new SafeError('Invalid Safe address', 'INVALID_ADDRESS');
      }

      // Get multisig transactions from Safe Transaction Service
      const limit = filter?.limit || 20;
      const offset = filter?.offset || 0;

      let executed: boolean | undefined = filter?.executed;
      let queued: boolean | undefined = filter?.queued;

      // Get multisig transactions with filters
      const transactionListResponse = await apiClient.getMultisigTransactions(
        safeAddress,
        {
          executed,
          queued,
          limit: limit.toString(),
          offset: offset.toString(),
        }
      );

      // Transform API response to our interface
      const results: HistoricalTransaction[] =
        transactionListResponse.results.map((tx: any) => ({
          safeTxHash: tx.safeTxHash,
          to: tx.to,
          value: tx.value,
          data: tx.data || '0x',
          confirmations: tx.confirmations.map((conf: any) => ({
            owner: conf.owner,
            signature: conf.signature,
            signatureType: conf.signatureType,
            submissionDate: conf.submissionDate,
          })),
          isExecuted: tx.isExecuted,
          executionDate: tx.executionDate,
          submissionDate: tx.submissionDate,
          transactionHash: tx.transactionHash,
          gasUsed: tx.gasUsed || 0,
        }));

      return {
        count: transactionListResponse.count,
        next: transactionListResponse.next,
        previous: transactionListResponse.previous,
        results: results,
      };
    } catch (error) {
      throw new SafeError(
        `Failed to fetch transaction history: ${error instanceof Error ? error.message : String(error)}`,
        'API_ERROR',
        { safeAddress, networkId, originalError: String(error) }
      );
    }
  }

  async confirmTransaction(
    safeTxHash: string,
    networkId: string,
    signature: SafeSignature
  ): Promise<SafeConfirmation> {
    // Validate transaction hash
    if (!safeTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
      throw new SafeError('Invalid transaction hash', 'INVALID_HASH');
    }

    await this.getApiClient(networkId);

    // Mock confirmation result
    const confirmation: SafeConfirmation = {
      owner: signature.signer,
      signature: signature.data,
      signatureType: 'EOA',
      submissionDate: new Date().toISOString(),
    };

    return confirmation;
  }

  async getTransaction(
    safeTxHash: string,
    networkId: string
  ): Promise<PendingTransaction> {
    try {
      const apiClient = await this.getApiClient(networkId);

      // Validate transaction hash format
      if (!safeTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
        throw new SafeError('Invalid transaction hash format', 'INVALID_HASH');
      }

      // Get transaction details from Safe Transaction Service
      const txDetails = await apiClient.getTransaction(safeTxHash);

      // Transform API response to our interface
      const transaction: PendingTransaction = {
        safeTxHash: txDetails.safeTxHash,
        to: txDetails.to,
        value: txDetails.value,
        data: txDetails.data || '0x',
        confirmations:
          txDetails.confirmations?.map((conf: any) => ({
            owner: conf.owner,
            signature: conf.signature,
            signatureType: conf.signatureType,
            submissionDate: conf.submissionDate,
          })) || [],
        confirmationsRequired: txDetails.confirmationsRequired,
        nonce: txDetails.nonce,
        submissionDate: txDetails.submissionDate,
        isExecuted: txDetails.isExecuted,
      };

      return transaction;
    } catch (error) {
      // Handle specific "not found" errors
      if (
        error instanceof Error &&
        (error.message.includes('404') || error.message.includes('not found'))
      ) {
        throw new SafeError('Transaction not found', 'TRANSACTION_NOT_FOUND', {
          safeTxHash,
        });
      }

      throw new SafeError(
        `Failed to fetch transaction: ${error instanceof Error ? error.message : String(error)}`,
        'API_ERROR',
        { safeTxHash, networkId, originalError: String(error) }
      );
    }
  }

  async getSafeInfo(
    safeAddress: string,
    networkId: string
  ): Promise<SafeServiceInfo> {
    await this.getApiClient(networkId);

    // Mock Safe info from service
    const safeInfo: SafeServiceInfo = {
      address: safeAddress,
      owners: [
        '0x1234567890123456789012345678901234567890',
        '0x2345678901234567890123456789012345678901',
      ],
      threshold: 2,
      version: '1.4.1',
      implementation: '0xabcd1234567890abcd1234567890abcd12345678',
      modules: [],
    };

    return safeInfo;
  }

  // Retry mechanism for failed requests
  private async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          throw lastError;
        }

        // Wait before retry
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * (attempt + 1))
        );
      }
    }

    throw lastError!;
  }
}
