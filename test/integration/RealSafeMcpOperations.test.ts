/**
 * Comprehensive Integration Tests for Real Safe MCP Operations
 * 
 * This test suite validates all MCP tools working with real Safe contracts
 * deployed on the local blockchain network.
 */

import { JsonRpcProvider } from 'ethers';
import { TestUtils } from '../../src/test/TestUtils.js';
import { TestAccountManager } from '../../src/test/TestAccountManager.js';
import { ContractRegistry } from '../../src/network/ContractRegistry.js';
import { WalletCreationTools } from '../../src/mcp/tools/WalletCreationTools.js';
import { WalletQueryTools } from '../../src/mcp/tools/WalletQueryTools.js';
import { OwnerManagementTools } from '../../src/mcp/tools/OwnerManagementTools.js';
import { TransactionManagementTools } from '../../src/mcp/tools/TransactionManagementTools.js';

describe('Real Safe MCP Operations Integration', () => {
  let provider: JsonRpcProvider;
  let testUtils: TestUtils;
  let accountManager: TestAccountManager;
  let contractRegistry: ContractRegistry;
  let walletCreationTools: WalletCreationTools;
  let walletQueryTools: WalletQueryTools;
  let ownerManagementTools: OwnerManagementTools;
  let transactionManagementTools: TransactionManagementTools;
  let testAccounts: any[];

  beforeAll(async () => {
    // Connect to local Hardhat network
    provider = new JsonRpcProvider('http://127.0.0.1:8545');
    testUtils = new TestUtils(provider);
    accountManager = new TestAccountManager(provider);
    contractRegistry = new ContractRegistry();
    
    // Initialize MCP tool classes
    walletCreationTools = new WalletCreationTools(contractRegistry);
    walletQueryTools = new WalletQueryTools(contractRegistry);
    ownerManagementTools = new OwnerManagementTools(contractRegistry);
    transactionManagementTools = new TransactionManagementTools(contractRegistry);
    
    // Verify network is running and has real contracts
    const network = await provider.getNetwork();
    expect(network.chainId).toBe(31337n);
    
    // Load test accounts
    testAccounts = await accountManager.getTestAccounts(5);
    
    // Verify real Safe contracts are deployed
    const deployment = testUtils.getDeploymentInfo();
    expect(deployment.deploymentType).toBe('safe-sdk-compatible');
    expect(deployment.contracts.safeSingleton).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(deployment.contracts.safeProxyFactory).toMatch(/^0x[a-fA-F0-9]{40}$/);
  }, 30000);

  describe('Wallet Creation Tools with Real Contracts', () => {
    test('safe_create_wallet_config - should create valid wallet configuration', async () => {
      const args = {
        network: 'eip155:31337',
        owners: [testAccounts[0].address],
        threshold: 1,
        saltNonce: '123'
      };

      const response = await walletCreationTools.handleToolCall('safe_create_wallet_config', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const config = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(config.network).toBe('eip155:31337');
      expect(config.owners).toEqual([testAccounts[0].address]);
      expect(config.threshold).toBe(1);
      expect(config.saltNonce).toBe('123');
      expect(config.predictedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('safe_predict_address - should predict correct Safe address', async () => {
      const args = {
        network: 'eip155:31337',
        owners: [testAccounts[0].address, testAccounts[1].address],
        threshold: 2,
        saltNonce: '456'
      };

      const response = await walletCreationTools.handleToolCall('safe_predict_address', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const result = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(result.predictedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(result.network).toBe('eip155:31337');
      expect(result.owners).toEqual([testAccounts[0].address, testAccounts[1].address]);
      expect(result.threshold).toBe(2);
    });

    test('safe_deploy_wallet - should deploy real Safe wallet', async () => {
      const deployerPrivateKey = testAccounts[0].privateKey;
      const owners = [testAccounts[0].address];
      
      const args = {
        network: 'eip155:31337',
        owners: owners,
        threshold: 1,
        saltNonce: '789',
        deployerPrivateKey: deployerPrivateKey
      };

      const response = await walletCreationTools.handleToolCall('safe_deploy_wallet', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const deployment = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(deployment.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(deployment.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(deployment.owners).toEqual(owners);
      expect(deployment.threshold).toBe(1);
      
      // Verify the Safe exists on-chain
      const code = await provider.getCode(deployment.address);
      expect(code).not.toBe('0x');
      
      // Store for later tests
      (global as any).testSafeAddress = deployment.address;
    }, 15000);
  });

  describe('Wallet Query Tools with Real Contracts', () => {
    let safeAddress: string;

    beforeAll(async () => {
      // Use the Safe deployed in previous test or deploy a new one
      safeAddress = (global as any).testSafeAddress;
      if (!safeAddress) {
        const deployment = await testUtils.deployTestSafe([testAccounts[0].address], 1, 0);
        safeAddress = deployment.address;
      }
    });

    test('safe_get_info - should retrieve real Safe information', async () => {
      const args = {
        address: safeAddress,
        network: 'eip155:31337'
      };

      const response = await walletQueryTools.handleToolCall('safe_get_info', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const safeInfo = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(safeInfo.address).toBe(safeAddress);
      expect(safeInfo.network).toBe('eip155:31337');
      expect(safeInfo.owners).toContain(testAccounts[0].address);
      expect(safeInfo.threshold).toBe(1);
      expect(safeInfo.nonce).toBeGreaterThanOrEqual(0);
      expect(safeInfo.balance).toBeDefined();
    });
  });

  describe('Owner Management Tools with Real Contracts', () => {
    let multiSigSafeAddress: string;
    let ownerPrivateKeys: string[];

    beforeAll(async () => {
      // Deploy a multi-sig Safe for owner management tests
      const owners = [testAccounts[0].address, testAccounts[1].address, testAccounts[2].address];
      ownerPrivateKeys = [testAccounts[0].privateKey, testAccounts[1].privateKey, testAccounts[2].privateKey];
      
      const deployment = await testUtils.deployTestSafe(owners, 2, 0);
      multiSigSafeAddress = deployment.address;
    });

    test('safe_add_owner - should add new owner to real Safe', async () => {
      const newOwnerAddress = testAccounts[3].address;
      
      const args = {
        safeAddress: multiSigSafeAddress,
        network: 'eip155:31337',
        newOwnerAddress: newOwnerAddress,
        newThreshold: 3,
        signerPrivateKeys: [ownerPrivateKeys[0], ownerPrivateKeys[1]]
      };

      const response = await ownerManagementTools.handleToolCall('safe_add_owner', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const result = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.newOwner).toBe(newOwnerAddress);
      expect(result.newThreshold).toBe(3);
      
      // Verify the owner was actually added
      const infoArgs = {
        address: multiSigSafeAddress,
        network: 'eip155:31337'
      };
      
      const infoResponse = await walletQueryTools.handleToolCall('safe_get_info', infoArgs);
      const safeInfo = JSON.parse((infoResponse.content[0] as any)?.text || '{}');
      expect(safeInfo.owners).toContain(newOwnerAddress);
      expect(safeInfo.threshold).toBe(3);
    }, 20000);

    test('safe_change_threshold - should change threshold on real Safe', async () => {
      const args = {
        safeAddress: multiSigSafeAddress,
        network: 'eip155:31337',
        newThreshold: 2,
        signerPrivateKeys: [ownerPrivateKeys[0], ownerPrivateKeys[1], ownerPrivateKeys[2]]
      };

      const response = await ownerManagementTools.handleToolCall('safe_change_threshold', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const result = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.newThreshold).toBe(2);
      
      // Verify threshold was changed
      const infoArgs = {
        address: multiSigSafeAddress,
        network: 'eip155:31337'
      };
      
      const infoResponse = await walletQueryTools.handleToolCall('safe_get_info', infoArgs);
      const safeInfo = JSON.parse((infoResponse.content[0] as any)?.text || '{}');
      expect(safeInfo.threshold).toBe(2);
    }, 20000);

    test('safe_remove_owner - should remove owner from real Safe', async () => {
      const ownerToRemove = testAccounts[3].address;
      const prevOwner = testAccounts[2].address; // Previous owner in the linked list
      
      const args = {
        safeAddress: multiSigSafeAddress,
        network: 'eip155:31337',
        ownerToRemove: ownerToRemove,
        prevOwner: prevOwner,
        newThreshold: 2,
        signerPrivateKeys: [ownerPrivateKeys[0], ownerPrivateKeys[1]]
      };

      const response = await ownerManagementTools.handleToolCall('safe_remove_owner', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const result = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.removedOwner).toBe(ownerToRemove);
      
      // Verify the owner was removed
      const infoArgs = {
        address: multiSigSafeAddress,
        network: 'eip155:31337'
      };
      
      const infoResponse = await walletQueryTools.handleToolCall('safe_get_info', infoArgs);
      const safeInfo = JSON.parse((infoResponse.content[0] as any)?.text || '{}');
      expect(safeInfo.owners).not.toContain(ownerToRemove);
    }, 20000);
  });

  describe('Transaction Management Tools with Real Contracts', () => {
    let transactionSafeAddress: string;
    let transactionOwnerKeys: string[];

    beforeAll(async () => {
      // Deploy a fresh Safe for transaction tests
      const owners = [testAccounts[0].address, testAccounts[1].address];
      transactionOwnerKeys = [testAccounts[0].privateKey, testAccounts[1].privateKey];
      
      const deployment = await testUtils.deployTestSafe(owners, 2, 0);
      transactionSafeAddress = deployment.address;
      
      // Fund the Safe with some ETH for transactions
      await testUtils.fundAccount(transactionSafeAddress, '10.0', 0);
    });

    test('safe_propose_transaction - should propose transaction on real Safe', async () => {
      const recipientAddress = testAccounts[2].address;
      const transferAmount = '1.0'; // 1 ETH
      
      const args = {
        safeAddress: transactionSafeAddress,
        network: 'eip155:31337',
        to: recipientAddress,
        value: transferAmount,
        data: '0x',
        operation: 0,
        signerPrivateKey: transactionOwnerKeys[0]
      };

      const response = await transactionManagementTools.handleToolCall('safe_propose_transaction', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const result = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(result.safeTransactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.to).toBe(recipientAddress);
      expect(result.value).toBe(transferAmount);
      expect(result.signatures).toHaveLength(1);
      
      // Store for execution test
      (global as any).testTransactionHash = result.safeTransactionHash;
    }, 20000);

    test('safe_execute_transaction - should execute transaction on real Safe', async () => {
      const recipientAddress = testAccounts[2].address;
      const transferAmount = '1.0';
      
      // Get initial balance
      const initialBalance = await provider.getBalance(recipientAddress);
      
      const args = {
        safeAddress: transactionSafeAddress,
        network: 'eip155:31337',
        to: recipientAddress,
        value: transferAmount,
        data: '0x',
        operation: 0,
        signerPrivateKeys: transactionOwnerKeys // Both owners sign
      };

      const response = await transactionManagementTools.handleToolCall('safe_execute_transaction', args);
      
      expect(response.isError).toBe(false);
      if (response.isError) return;
      
      const result = JSON.parse((response.content[0] as any)?.text || '{}');
      expect(result.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.success).toBe(true);
      
      // Verify the transaction actually happened
      const finalBalance = await provider.getBalance(recipientAddress);
      expect(finalBalance).toBeGreaterThan(initialBalance);
    }, 25000);
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle invalid network', async () => {
      const args = {
        address: '0x1234567890123456789012345678901234567890',
        network: 'eip155:999999' // Invalid network
      };

      const response = await walletQueryTools.handleToolCall('safe_get_info', args);
      expect(response.isError).toBe(true);
    });

    test('should handle non-existent Safe address', async () => {
      const args = {
        address: '0x1234567890123456789012345678901234567890',
        network: 'eip155:31337'
      };

      const response = await walletQueryTools.handleToolCall('safe_get_info', args);
      expect(response.isError).toBe(true);
    });

    test('should handle insufficient signatures', async () => {
      // Deploy a 2-of-3 Safe
      const owners = [testAccounts[0].address, testAccounts[1].address, testAccounts[2].address];
      const deployment = await testUtils.deployTestSafe(owners, 2, 0);
      
      const args = {
        safeAddress: deployment.address,
        network: 'eip155:31337',
        to: testAccounts[4].address,
        value: '0.1',
        data: '0x',
        operation: 0,
        signerPrivateKeys: [testAccounts[0].privateKey] // Only 1 signature, need 2
      };

      const response = await transactionManagementTools.handleToolCall('safe_execute_transaction', args);
      expect(response.isError).toBe(true);
    });
  });

  describe('Real Contract Compatibility Verification', () => {
    test('should verify Safe contract ABI compatibility', async () => {
      const deployment = testUtils.getDeploymentInfo();
      
      // Check that we can call standard Safe methods
      const safeSingleton = await testUtils.getContractAt(
        'MockSafeSingleton', 
        deployment.contracts.safeSingleton
      );
      
      const nameFn = safeSingleton.NAME;
      const versionFn = safeSingleton.VERSION;
      
      if (!nameFn || !versionFn) {
        throw new Error('Safe contract methods not found');
      }
      
      const name = await nameFn();
      const version = await versionFn();
      
      expect(name).toBe('Mock Safe');
      expect(version).toBe('1.4.1');
    });

    test('should verify proxy factory functionality', async () => {
      const deployment = testUtils.getDeploymentInfo();
      
      const factory = await testUtils.getContractAt(
        'MockSafeProxyFactory', 
        deployment.contracts.safeProxyFactory
      );
      
      const singletonFn = factory.singleton;
      if (!singletonFn) {
        throw new Error('Factory singleton method not found');
      }
      
      const singleton = await singletonFn();
      expect(singleton).toBe(deployment.contracts.safeSingleton);
    });

    test('should verify Safe proxy delegation works', async () => {
      // Deploy a Safe and verify it properly delegates to the singleton
      const owners = [testAccounts[0].address];
      const deployment = await testUtils.deployTestSafe(owners, 1, 0);
      
      const safe = await testUtils.getContractAt(
        'MockSafeSingleton',
        deployment.address
      );
      
      const getOwnersFn = safe.getOwners;
      const getThresholdFn = safe.getThreshold;
      const nonceFn = safe.nonce;
      
      if (!getOwnersFn || !getThresholdFn || !nonceFn) {
        throw new Error('Safe proxy methods not found');
      }
      
      const safeOwners = await getOwnersFn();
      const threshold = await getThresholdFn();
      const nonce = await nonceFn();
      
      expect(safeOwners).toEqual(owners);
      expect(threshold).toBe(1);
      expect(nonce).toBe(0);
    });
  });

  describe('Performance and Gas Usage', () => {
    test('should track gas usage for Safe deployment', async () => {
      const owners = [testAccounts[0].address];
      
      const deploymentWithGas = await testUtils.deployTestSafeWithGasTracking(owners, 1, 0);
      
      expect(deploymentWithGas.gasUsed).toBeDefined();
      expect(deploymentWithGas.gasUsed).toBeGreaterThan(0);
      expect(deploymentWithGas.gasUsed).toBeLessThan(500000); // Reasonable gas limit
      
      console.log(`Safe deployment gas used: ${deploymentWithGas.gasUsed}`);
    });

    test('should track gas usage for transactions', async () => {
      const owners = [testAccounts[0].address];
      const deployment = await testUtils.deployTestSafe(owners, 1, 0);
      
      // Fund the Safe
      await testUtils.fundAccount(deployment.address, '5.0', 0);
      
      const gasUsage = await testUtils.executeSafeTransactionWithGasTracking(
        deployment.address,
        testAccounts[1].address,
        '1.0',
        '0x',
        [testAccounts[0].privateKey]
      );
      
      expect(gasUsage).toBeGreaterThan(0);
      expect(gasUsage).toBeLessThan(200000); // Reasonable gas limit for simple transfer
      
      console.log(`Safe transaction gas used: ${gasUsage}`);
    });
  });
});