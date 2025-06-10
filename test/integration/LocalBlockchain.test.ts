/**
 * Integration tests for local blockchain environment
 */

import { JsonRpcProvider } from 'ethers';
import { TestUtils } from '../../src/test/TestUtils';
import { TestAccountManager } from '../../src/test/TestAccountManager';

describe('Local Blockchain Integration', () => {
  let provider: JsonRpcProvider;
  let testUtils: TestUtils;
  let accountManager: TestAccountManager;

  beforeAll(async () => {
    // Connect to local Hardhat network
    provider = new JsonRpcProvider('http://127.0.0.1:8545');
    testUtils = new TestUtils(provider);
    accountManager = new TestAccountManager(provider);

    // Verify network is running
    const network = await provider.getNetwork();
    expect(network.chainId).toBe(31337n);
  });

  describe('Test Account Management', () => {
    test('should load Hardhat test accounts', async () => {
      const accounts = await accountManager.getTestAccounts(5);
      
      expect(accounts).toHaveLength(5);
      expect(accounts[0].address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      expect(accounts[0].privateKey).toBe('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
      expect(parseFloat(accounts[0].balance)).toBeGreaterThan(1000); // Should have plenty of ETH
    });

    test('should create wallet instances', async () => {
      const wallet = await accountManager.createWallet(0);
      expect(wallet.address).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
    });

    test('should fund accounts', async () => {
      const accounts = await accountManager.getTestAccounts(2);
      const initialBalance = await testUtils.getBalance(accounts[1].address);
      
      await testUtils.fundAccount(accounts[1].address, '100.0', 0);
      
      const newBalance = await testUtils.getBalance(accounts[1].address);
      expect(parseFloat(newBalance)).toBeGreaterThan(parseFloat(initialBalance));
    });
  });

  describe('Safe Contract Deployment Verification', () => {
    test('should have deployed Safe contracts', () => {
      const deployment = testUtils.getDeploymentInfo();
      
      expect(deployment.network).toBe('localhost');
      expect(deployment.chainId).toBe(31337);
      expect(deployment.contracts.safeSingleton).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(deployment.contracts.safeProxyFactory).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    test('should verify Safe singleton contract', async () => {
      const deployment = testUtils.getDeploymentInfo();
      const code = await provider.getCode(deployment.contracts.safeSingleton);
      
      expect(code).not.toBe('0x');
      expect(code.length).toBeGreaterThan(100); // Should have substantial bytecode
    });

    test('should verify Safe factory contract', async () => {
      const deployment = testUtils.getDeploymentInfo();
      const code = await provider.getCode(deployment.contracts.safeProxyFactory);
      
      expect(code).not.toBe('0x');
      expect(code.length).toBeGreaterThan(100);
    });
  });

  describe('Safe Wallet Deployment', () => {
    test('should deploy a single-owner Safe', async () => {
      const accounts = await accountManager.getTestAccounts(1);
      const owners = [accounts[0].address];
      
      const safeDeployment = await testUtils.deployTestSafe(owners, 1, 0);
      
      expect(safeDeployment.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(safeDeployment.owners).toEqual(owners);
      expect(safeDeployment.threshold).toBe(1);
      expect(safeDeployment.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    test('should deploy a multi-sig Safe', async () => {
      const accounts = await accountManager.getTestAccounts(3);
      const owners = accounts.map(acc => acc.address);
      
      const safeDeployment = await testUtils.deployTestSafe(owners, 2, 0);
      
      expect(safeDeployment.owners).toEqual(owners);
      expect(safeDeployment.threshold).toBe(2);
      
      // Verify the deployment
      const verification = await testUtils.verifySafeDeployment(safeDeployment.address);
      expect(verification.isDeployed).toBe(true);
      expect(verification.owners).toEqual(owners);
      expect(verification.threshold).toBe(2);
    });
  });

  describe('Multi-Signature Test Scenario', () => {
    test('should create complete multi-sig scenario', async () => {
      const scenario = await testUtils.createMultiSigTestScenario();
      
      expect(scenario.owners).toHaveLength(3);
      expect(scenario.threshold).toBe(2);
      expect(scenario.safeDeployment.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      
      // Verify all owners are different
      const ownerAddresses = scenario.owners.map(owner => owner.address);
      const uniqueAddresses = new Set(ownerAddresses);
      expect(uniqueAddresses.size).toBe(3);
    });
  });

  describe('Network Operations', () => {
    test('should get current block number', async () => {
      const blockNumber = await testUtils.getCurrentBlock();
      expect(blockNumber).toBeGreaterThan(0);
    });

    test('should wait for transaction confirmation', async () => {
      const accounts = await accountManager.getTestAccounts(2);
      const wallet = await accountManager.createWallet(0);
      
      const tx = await wallet.sendTransaction({
        to: accounts[1].address,
        value: 1000000000000000000n // 1 ETH
      });
      
      const receipt = await testUtils.waitForConfirmation(tx.hash);
      expect(receipt.status).toBe(1); // Success
    });
  });
});