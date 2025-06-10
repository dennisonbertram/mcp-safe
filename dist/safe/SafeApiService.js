import { SafeError } from '../utils/SafeError.js';
// Mock Safe API Kit class for testing
class MockSafeApiKit {
    constructor(config) {
        // Mock constructor
    }
}
export class SafeApiService {
    contractRegistry;
    apiClients = new Map();
    serviceUrls = {
        'eip155:1': 'https://safe-transaction-mainnet.safe.global',
        'eip155:137': 'https://safe-transaction-polygon.safe.global',
        'eip155:42161': 'https://safe-transaction-arbitrum.safe.global',
        'eip155:11155111': 'https://safe-transaction-sepolia.safe.global',
    };
    constructor(contractRegistry) {
        this.contractRegistry = contractRegistry;
    }
    async getApiClient(networkId) {
        if (!this.contractRegistry.isNetworkSupported(networkId)) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED');
        }
        if (this.apiClients.has(networkId)) {
            return this.apiClients.get(networkId);
        }
        const serviceUrl = this.getServiceUrl(networkId);
        const apiClient = new MockSafeApiKit({
            txServiceUrl: serviceUrl,
        });
        this.apiClients.set(networkId, apiClient);
        return apiClient;
    }
    getServiceUrl(networkId) {
        if (!(networkId in this.serviceUrls)) {
            throw new SafeError(`Safe Transaction Service not available for network ${networkId}`, 'SERVICE_NOT_AVAILABLE');
        }
        return this.serviceUrls[networkId];
    }
    async proposeTransaction(safeAddress, networkId, transaction, senderSignature) {
        // Validate inputs
        if (!this.contractRegistry.validateSafeAddress(safeAddress)) {
            throw new SafeError('Invalid Safe address', 'INVALID_ADDRESS');
        }
        await this.getApiClient(networkId);
        // Mock proposal result
        const proposalResult = {
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
    async getPendingTransactions(safeAddress, networkId, options) {
        await this.getApiClient(networkId);
        // Mock pending transactions
        const pendingTxs = [
            {
                safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
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
    async getTransactionHistory(safeAddress, networkId, filter) {
        await this.getApiClient(networkId);
        // Mock transaction history
        const mockResults = [
            {
                safeTxHash: '0xdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc',
                to: '0x3456789012345678901234567890123456789012',
                value: '2000000000000000000',
                data: '0xa9059cbb',
                confirmations: [
                    {
                        owner: '0x1234567890123456789012345678901234567890',
                        signature: '0x789abc',
                        signatureType: 'EOA',
                        submissionDate: new Date(Date.now() - 86400000).toISOString(),
                    },
                    {
                        owner: '0x2345678901234567890123456789012345678901',
                        signature: '0xdef123',
                        signatureType: 'EOA',
                        submissionDate: new Date(Date.now() - 82800000).toISOString(),
                    },
                ],
                isExecuted: true,
                executionDate: new Date(Date.now() - 82800000).toISOString(),
                submissionDate: new Date(Date.now() - 86400000).toISOString(),
                transactionHash: '0x456789abcdef123456789abcdef123456789abcdef123456789abcdef123456789',
                gasUsed: 65432,
            },
        ];
        // Apply filters
        let filteredResults = mockResults;
        if (filter?.executed !== undefined) {
            filteredResults = filteredResults.filter((tx) => tx.isExecuted === filter.executed);
        }
        // Apply pagination
        const limit = filter?.limit || 20;
        const offset = filter?.offset || 0;
        const paginatedResults = filteredResults.slice(offset, offset + limit);
        return {
            count: filteredResults.length,
            next: offset + limit < filteredResults.length ? 'next-url' : null,
            previous: offset > 0 ? 'prev-url' : null,
            results: paginatedResults,
        };
    }
    async confirmTransaction(safeTxHash, networkId, signature) {
        // Validate transaction hash
        if (!safeTxHash.match(/^0x[a-fA-F0-9]{64}$/)) {
            throw new SafeError('Invalid transaction hash', 'INVALID_HASH');
        }
        await this.getApiClient(networkId);
        // Mock confirmation result
        const confirmation = {
            owner: signature.signer,
            signature: signature.data,
            signatureType: 'EOA',
            submissionDate: new Date().toISOString(),
        };
        return confirmation;
    }
    async getTransaction(safeTxHash, networkId) {
        await this.getApiClient(networkId);
        // Check if transaction exists (mock check)
        if (safeTxHash ===
            '0x9999999999999999999999999999999999999999999999999999999999999999') {
            throw new SafeError('Transaction not found', 'TRANSACTION_NOT_FOUND');
        }
        // Mock transaction data
        const transaction = {
            safeTxHash,
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
        };
        return transaction;
    }
    async getSafeInfo(safeAddress, networkId) {
        await this.getApiClient(networkId);
        // Mock Safe info from service
        const safeInfo = {
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
    async withRetry(operation, maxRetries = 2) {
        let lastError;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt === maxRetries) {
                    throw lastError;
                }
                // Wait before retry
                await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
            }
        }
        throw lastError;
    }
}
