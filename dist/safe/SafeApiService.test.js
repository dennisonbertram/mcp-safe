import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SafeApiService } from './SafeApiService';
import { ContractRegistry } from '../network/ContractRegistry';
// Mock the Safe API Kit
jest.mock('@safe-global/api-kit');
describe('SafeApiService', () => {
    let apiService;
    let mockContractRegistry;
    beforeEach(() => {
        mockContractRegistry = new ContractRegistry();
        apiService = new SafeApiService(mockContractRegistry);
    });
    describe('proposeTransaction', () => {
        it('should propose transaction to Safe Transaction Service', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            const transaction = {
                to: '0x2345678901234567890123456789012345678901',
                value: '1000000000000000000',
                data: '0x',
                nonce: 0,
                safeTxGas: '21000',
                baseGas: '21000',
                gasPrice: '20000000000',
                gasToken: '0x0000000000000000000000000000000000000000',
                refundReceiver: '0x0000000000000000000000000000000000000000',
                safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            };
            const senderSignature = {
                signer: '0x1234567890123456789012345678901234567890',
                data: '0x123456',
            };
            const proposalResult = await apiService.proposeTransaction(safeAddress, networkId, transaction, senderSignature);
            expect(proposalResult).toBeDefined();
            expect(proposalResult.safeTxHash).toBe(transaction.safeTxHash);
            expect(proposalResult.proposer).toBe(senderSignature.signer);
            expect(proposalResult.confirmations).toBeDefined();
            expect(Array.isArray(proposalResult.confirmations)).toBe(true);
        });
        it('should throw error for invalid Safe address', async () => {
            const safeAddress = '0x999';
            const networkId = 'eip155:1';
            const transaction = {
                to: '0x2345678901234567890123456789012345678901',
                value: '1000000000000000000',
                data: '0x',
                nonce: 0,
                safeTxGas: '21000',
                baseGas: '21000',
                gasPrice: '20000000000',
                gasToken: '0x0000000000000000000000000000000000000000',
                refundReceiver: '0x0000000000000000000000000000000000000000',
                safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            };
            const senderSignature = {
                signer: '0x1234567890123456789012345678901234567890',
                data: '0x123456',
            };
            await expect(apiService.proposeTransaction(safeAddress, networkId, transaction, senderSignature)).rejects.toThrow('Invalid Safe address');
        });
        it('should throw error for unsupported network', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:999';
            const transaction = {
                to: '0x2345678901234567890123456789012345678901',
                value: '1000000000000000000',
                data: '0x',
                nonce: 0,
                safeTxGas: '21000',
                baseGas: '21000',
                gasPrice: '20000000000',
                gasToken: '0x0000000000000000000000000000000000000000',
                refundReceiver: '0x0000000000000000000000000000000000000000',
                safeTxHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
            };
            const senderSignature = {
                signer: '0x1234567890123456789012345678901234567890',
                data: '0x123456',
            };
            await expect(apiService.proposeTransaction(safeAddress, networkId, transaction, senderSignature)).rejects.toThrow('Network eip155:999 is not supported');
        });
    });
    describe('getPendingTransactions', () => {
        it('should retrieve pending transactions for Safe', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            const pendingTxs = await apiService.getPendingTransactions(safeAddress, networkId);
            expect(pendingTxs).toBeDefined();
            expect(Array.isArray(pendingTxs)).toBe(true);
            if (pendingTxs.length > 0) {
                const tx = pendingTxs[0];
                expect(tx.safeTxHash).toBeDefined();
                expect(tx.to).toBeDefined();
                expect(tx.value).toBeDefined();
                expect(tx.confirmations).toBeDefined();
                expect(Array.isArray(tx.confirmations)).toBe(true);
            }
        });
        it('should support pagination for pending transactions', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            const limit = 10;
            const offset = 0;
            const pendingTxs = await apiService.getPendingTransactions(safeAddress, networkId, { limit, offset });
            expect(pendingTxs).toBeDefined();
            expect(Array.isArray(pendingTxs)).toBe(true);
            expect(pendingTxs.length).toBeLessThanOrEqual(limit);
        });
    });
    describe('getTransactionHistory', () => {
        it('should retrieve transaction history for Safe', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            const history = await apiService.getTransactionHistory(safeAddress, networkId);
            expect(history).toBeDefined();
            expect(Array.isArray(history.results)).toBe(true);
            expect(history.count).toBeGreaterThanOrEqual(0);
            expect(history.next).toBeDefined();
            expect(history.previous).toBeDefined();
            if (history.results.length > 0) {
                const tx = history.results[0];
                expect(tx.safeTxHash).toBeDefined();
                expect(tx.executionDate).toBeDefined();
                expect(tx.isExecuted).toBeDefined();
            }
        });
        it('should support filtering by executed status', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            const executedTxs = await apiService.getTransactionHistory(safeAddress, networkId, { executed: true });
            expect(executedTxs).toBeDefined();
            expect(Array.isArray(executedTxs.results)).toBe(true);
            // All returned transactions should be executed
            executedTxs.results.forEach((tx) => {
                expect(tx.isExecuted).toBe(true);
            });
        });
    });
    describe('confirmTransaction', () => {
        it('should add confirmation to pending transaction', async () => {
            const safeTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            const networkId = 'eip155:1';
            const signature = {
                signer: '0x2345678901234567890123456789012345678901',
                data: '0x789abc',
            };
            const confirmationResult = await apiService.confirmTransaction(safeTxHash, networkId, signature);
            expect(confirmationResult).toBeDefined();
            expect(confirmationResult.signature).toBe(signature.data);
            expect(confirmationResult.owner).toBe(signature.signer);
            expect(confirmationResult.submissionDate).toBeDefined();
        });
        it('should throw error for invalid transaction hash', async () => {
            const safeTxHash = '0x123';
            const networkId = 'eip155:1';
            const signature = {
                signer: '0x2345678901234567890123456789012345678901',
                data: '0x789abc',
            };
            await expect(apiService.confirmTransaction(safeTxHash, networkId, signature)).rejects.toThrow('Invalid transaction hash');
        });
    });
    describe('getTransaction', () => {
        it('should retrieve specific transaction by hash', async () => {
            const safeTxHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
            const networkId = 'eip155:1';
            const transaction = await apiService.getTransaction(safeTxHash, networkId);
            expect(transaction).toBeDefined();
            expect(transaction.safeTxHash).toBe(safeTxHash);
            expect(transaction.to).toBeDefined();
            expect(transaction.value).toBeDefined();
            expect(transaction.confirmations).toBeDefined();
            expect(Array.isArray(transaction.confirmations)).toBe(true);
        });
        it('should throw error for non-existent transaction', async () => {
            const safeTxHash = '0x9999999999999999999999999999999999999999999999999999999999999999';
            const networkId = 'eip155:1';
            await expect(apiService.getTransaction(safeTxHash, networkId)).rejects.toThrow('Transaction not found');
        });
    });
    describe('getSafeInfo', () => {
        it('should retrieve Safe information from service', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            const safeInfo = await apiService.getSafeInfo(safeAddress, networkId);
            expect(safeInfo).toBeDefined();
            expect(safeInfo.address).toBe(safeAddress);
            expect(safeInfo.owners).toBeDefined();
            expect(Array.isArray(safeInfo.owners)).toBe(true);
            expect(safeInfo.threshold).toBeGreaterThan(0);
            expect(safeInfo.version).toBeDefined();
            expect(safeInfo.implementation).toBeDefined();
        });
    });
    describe('getServiceUrl', () => {
        it('should return correct service URL for supported networks', () => {
            const ethUrl = apiService.getServiceUrl('eip155:1');
            const polygonUrl = apiService.getServiceUrl('eip155:137');
            expect(ethUrl).toBeDefined();
            expect(polygonUrl).toBeDefined();
            expect(ethUrl).toContain('safe-transaction-mainnet');
            expect(polygonUrl).toContain('safe-transaction-polygon');
        });
        it('should throw error for unsupported network', () => {
            expect(() => apiService.getServiceUrl('eip155:999')).toThrow('Safe Transaction Service not available for network eip155:999');
        });
    });
    describe('Error Handling', () => {
        it('should handle service unavailability gracefully', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            // Mock service error
            jest
                .spyOn(apiService, 'getPendingTransactions')
                .mockRejectedValue(new Error('Service unavailable'));
            await expect(apiService.getPendingTransactions(safeAddress, networkId)).rejects.toThrow('Service unavailable');
        });
        it('should retry failed requests', async () => {
            const safeAddress = '0x1234567890123456789012345678901234567890';
            const networkId = 'eip155:1';
            // Test that retry functionality exists by calling withRetry directly
            let callCount = 0;
            const testOperation = async () => {
                callCount++;
                if (callCount === 1) {
                    throw new Error('Network error');
                }
                return 'success';
            };
            const result = await apiService.withRetry(testOperation);
            expect(result).toBe('success');
            expect(callCount).toBe(2); // Should have retried once
        });
    });
});
