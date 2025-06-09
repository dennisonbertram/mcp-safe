import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SafeProtocolKit } from './SafeProtocolKit';
import { NetworkProviderManager } from '../network/NetworkProviderManager';
import { ContractRegistry } from '../network/ContractRegistry';
import { SafeConfig } from '../config/types';

// Mock the Safe SDK modules
jest.mock('@safe-global/protocol-kit');
jest.mock('@safe-global/api-kit');

describe('SafeProtocolKit', () => {
  let safeKit: SafeProtocolKit;
  let mockProviderManager: NetworkProviderManager;
  let mockContractRegistry: ContractRegistry;
  let mockConfig: SafeConfig;

  beforeEach(() => {
    mockConfig = {
      networks: {
        'eip155:1': { rpcUrl: 'https://eth.example.com' },
      },
    };

    mockProviderManager = new NetworkProviderManager(mockConfig);
    mockContractRegistry = new ContractRegistry();
    safeKit = new SafeProtocolKit(mockProviderManager, mockContractRegistry);
  });

  describe('createSafeInstance', () => {
    it('should create Safe instance with valid parameters', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';

      const safeInstance = await safeKit.createSafeInstance(
        safeAddress,
        networkId
      );

      expect(safeInstance).toBeDefined();
      expect(safeInstance.getAddress()).toBe(safeAddress);
    });

    it('should throw error for invalid Safe address', async () => {
      const invalidAddress = '0x123';
      const networkId = 'eip155:1';

      await expect(
        safeKit.createSafeInstance(invalidAddress, networkId)
      ).rejects.toThrow('Invalid Safe address');
    });

    it('should throw error for unsupported network', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:999';

      await expect(
        safeKit.createSafeInstance(safeAddress, networkId)
      ).rejects.toThrow('Network eip155:999 is not supported');
    });

    it('should cache Safe instances for reuse', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';

      const instance1 = await safeKit.createSafeInstance(
        safeAddress,
        networkId
      );
      const instance2 = await safeKit.createSafeInstance(
        safeAddress,
        networkId
      );

      expect(instance1).toBe(instance2);
    });
  });

  describe('deploySafe', () => {
    it.skip('should deploy new Safe with valid configuration', async () => {
      // Skipped due to network dependency
    });

    it('should throw error for invalid threshold', async () => {
      const owners = ['0x1234567890123456789012345678901234567890'];
      const threshold = 2; // Greater than owners length
      const networkId = 'eip155:1';

      await expect(
        safeKit.deploySafe({
          owners,
          threshold,
          networkId,
        })
      ).rejects.toThrow('Threshold cannot be greater than number of owners');
    });

    it('should throw error for zero threshold', async () => {
      const owners = ['0x1234567890123456789012345678901234567890'];
      const threshold = 0;
      const networkId = 'eip155:1';

      await expect(
        safeKit.deploySafe({
          owners,
          threshold,
          networkId,
        })
      ).rejects.toThrow('Threshold must be greater than 0');
    });

    it.skip('should support custom salt for deterministic deployment', async () => {
      const owners = ['0x1234567890123456789012345678901234567890'];
      const threshold = 1;
      const networkId = 'eip155:1';
      const salt = '123456789';

      const deployResult = await safeKit.deploySafe({
        owners,
        threshold,
        networkId,
        saltNonce: salt,
      });

      expect(deployResult.safeAddress).toBeDefined();
      expect(deployResult.saltNonce).toBe(salt);
    });
  });

  describe('getSafeInfo', () => {
    it('should retrieve Safe information', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';

      const safeInfo = await safeKit.getSafeInfo(safeAddress, networkId);

      expect(safeInfo).toBeDefined();
      expect(safeInfo.address).toBe(safeAddress);
      expect(safeInfo.owners).toBeDefined();
      expect(Array.isArray(safeInfo.owners)).toBe(true);
      expect(safeInfo.threshold).toBeGreaterThan(0);
      expect(safeInfo.nonce).toBeGreaterThanOrEqual(0);
      expect(safeInfo.version).toBeDefined();
    });

    it('should throw error for non-existent Safe', async () => {
      const safeAddress = '0x9999999999999999999999999999999999999999';
      const networkId = 'eip155:1';

      await expect(safeKit.getSafeInfo(safeAddress, networkId)).rejects.toThrow(
        'Safe not found or not deployed'
      );
    });
  });

  describe('createTransaction', () => {
    it.skip('should create transaction with valid parameters', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000', // 1 ETH
        data: '0x',
      };

      const transaction = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );

      expect(transaction).toBeDefined();
      expect(transaction.to).toBe(txData.to);
      expect(transaction.value).toBe(txData.value);
      expect(transaction.data).toBe(txData.data);
      expect(transaction.safeTxGas).toBeDefined();
      expect(transaction.baseGas).toBeDefined();
    });

    it.skip('should support batch transactions', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const transactions = [
        {
          to: '0x2345678901234567890123456789012345678901',
          value: '1000000000000000000',
          data: '0x',
        },
        {
          to: '0x3456789012345678901234567890123456789012',
          value: '2000000000000000000',
          data: '0xa9059cbb',
        },
      ];

      const batchTransaction = await safeKit.createBatchTransaction(
        safeAddress,
        networkId,
        transactions
      );

      expect(batchTransaction).toBeDefined();
      expect(batchTransaction.data).toBeDefined();
      expect(batchTransaction.data.length).toBeGreaterThanOrEqual(10); // Should be encoded batch data
    });

    it.skip('should estimate gas correctly', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
      };

      const gasEstimate = await safeKit.estimateTransactionGas(
        safeAddress,
        networkId,
        txData
      );

      expect(gasEstimate).toBeDefined();
      expect(gasEstimate.safeTxGas).toBeGreaterThan(0);
      expect(gasEstimate.baseGas).toBeGreaterThan(0);
      expect(gasEstimate.gasPrice).toBeDefined();
    });
  });

  describe('signTransaction', () => {
    it.skip('should sign transaction with private key', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const privateKey =
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
      };

      const transaction = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );

      const signature = await safeKit.signTransaction(
        transaction,
        privateKey,
        networkId
      );

      expect(signature).toBeDefined();
      expect(signature.signer).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(signature.data).toBeDefined();
      expect(signature.data.length).toBeGreaterThan(10);
    });

    it('should validate signer is Safe owner', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const invalidPrivateKey =
        '0x5678901234567890123456789012345678901234567890123456789012345678';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
      };

      const transaction = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );

      await expect(
        safeKit.signTransaction(transaction, invalidPrivateKey, networkId)
      ).rejects.toThrow('Signer is not an owner of this Safe');
    });
  });

  describe('executeTransaction', () => {
    it.skip('should execute transaction when threshold is met', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const executorPrivateKey =
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
      };

      const transaction = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );

      // Mock that transaction has enough signatures
      const signatures = [
        {
          signer: '0x1234567890123456789012345678901234567890',
          data: '0x123456',
        },
      ];

      const executionResult = await safeKit.executeTransaction(
        transaction,
        signatures,
        executorPrivateKey,
        networkId
      );

      expect(executionResult).toBeDefined();
      expect(executionResult.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(executionResult.success).toBe(true);
      expect(executionResult.gasUsed).toBeGreaterThan(0);
    });

    it('should throw error when threshold not met', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const executorPrivateKey =
        '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
      };

      const transaction = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );

      const signatures: any[] = []; // Empty signatures

      await expect(
        safeKit.executeTransaction(
          transaction,
          signatures,
          executorPrivateKey,
          networkId
        )
      ).rejects.toThrow('Insufficient signatures to meet threshold');
    });
  });

  describe('getBalance', () => {
    it.skip('should get ETH balance', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';

      const balance = await safeKit.getBalance(safeAddress, networkId);

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      expect(balance).toMatch(/^\d+$/); // Should be a numeric string
    });

    it.skip('should get token balance', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const tokenAddress = '0xA0b86a33E6417aAb88a97C2D4cbC54b9F6Ae99b0'; // Mock token
      const networkId = 'eip155:1';

      const balance = await safeKit.getTokenBalance(
        safeAddress,
        tokenAddress,
        networkId
      );

      expect(balance).toBeDefined();
      expect(typeof balance).toBe('string');
      expect(balance).toMatch(/^\d+$/);
    });
  });

  describe('Transaction State Management', () => {
    it.skip('should cache transaction state', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';
      const txData = {
        to: '0x2345678901234567890123456789012345678901',
        value: '1000000000000000000',
        data: '0x',
      };

      const transaction1 = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );
      const transaction2 = await safeKit.createTransaction(
        safeAddress,
        networkId,
        txData
      );

      // Should cache based on transaction parameters
      expect(transaction1.nonce).toBe(transaction2.nonce);
    });

    it.skip('should handle nonce management', async () => {
      const safeAddress = '0x1234567890123456789012345678901234567890';
      const networkId = 'eip155:1';

      const currentNonce = await safeKit.getNextNonce(safeAddress, networkId);

      expect(currentNonce).toBeGreaterThanOrEqual(0);
      expect(typeof currentNonce).toBe('number');
    });
  });
});
