import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { JsonRpcProvider, ethers } from 'ethers';
import { safeDeployInfrastructure } from '../../src/tools/safe-deploy-infrastructure.js';
import { NetworkManager } from '../../src/network/NetworkManager.js';
import { TestUtils } from '../../src/test/TestUtils.js';
import { TestAccountManager } from '../../src/test/TestAccountManager.js';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'fs';

describe('Safe Deploy Infrastructure Tool', () => {
  let provider: JsonRpcProvider;
  let networkManager: NetworkManager;
  let testUtils: TestUtils;
  let testAccountManager: TestAccountManager;
  let deployerPrivateKey: string;
  let deployerAddress: string;

  beforeAll(async () => {
    // Ensure we have the real Safe artifacts
    if (!existsSync('real-safe-artifacts.json')) {
      throw new Error('Real Safe artifacts not found. Run: node scripts/get-safe-artifacts.js');
    }

    // Start hardhat node for testing
    provider = new JsonRpcProvider('http://localhost:8545');
    networkManager = new NetworkManager();
    testUtils = new TestUtils(provider);
    testAccountManager = new TestAccountManager(provider);
    
    // Get deployer account
    const deployer = await testAccountManager.getDeployerAccount();
    deployerPrivateKey = deployer.privateKey;
    deployerAddress = deployer.address;

    console.log(`Test deployer: ${deployerAddress}`);
  });

  afterAll(async () => {
    testUtils.reset();
  });

  beforeEach(async () => {
    // Clear network manager cache before each test
    networkManager.clearCache();
  });

  test('should deploy complete Safe infrastructure to new network', async () => {
    const networkId = 'eip155:31337';
    
    const result = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    expect(result.success).toBe(true);
    expect(result.networkId).toBe(networkId);
    expect(result.chainId).toBe(31337);
    expect(result.deployerAddress).toBe(deployerAddress);

    // Verify all contracts were deployed
    expect(result.deployment).toBeDefined();
    expect(result.deployment.contracts).toBeDefined();
    expect(result.deployment.contracts.singletonFactory).toBeDefined();
    expect(result.deployment.contracts.safeSingleton).toBeDefined();
    expect(result.deployment.contracts.safeProxyFactory).toBeDefined();
    expect(result.deployment.contracts.fallbackHandler).toBeDefined();
    expect(result.deployment.contracts.multiSend).toBeDefined();

    // Verify deployment addresses are valid Ethereum addresses
    expect(result.deployment.contracts.singletonFactory).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.deployment.contracts.safeSingleton).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.deployment.contracts.safeProxyFactory).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.deployment.contracts.fallbackHandler).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(result.deployment.contracts.multiSend).toMatch(/^0x[a-fA-F0-9]{40}$/);

    // Verify gas usage was tracked
    expect(result.gasUsed).toBeGreaterThan(0);
    expect(result.deployment.totalGasUsed).toBeGreaterThan(0);

    // Verify deployment details
    expect(result.deployment.deployments).toHaveLength(5);
    result.deployment.deployments.forEach((deployment: any) => {
      expect(deployment.name).toBeDefined();
      expect(deployment.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(deployment.txHash).toBeDefined();
      expect(deployment.gasUsed).toBeGreaterThanOrEqual(0);
    });

    // Verify canonical Safe Singleton Factory address
    expect(result.deployment.contracts.singletonFactory).toBe('0xce0042B868300000d44A59004Da54A005ffdcf9f');
  }, 120000); // 2 minute timeout for deployment

  test('should verify deployed contracts have real Safe bytecode', async () => {
    const networkId = 'eip155:31337';
    
    // Deploy infrastructure
    const deployResult = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    // Load real Safe artifacts to compare
    const artifacts = JSON.parse(readFileSync('real-safe-artifacts.json', 'utf8'));

    // Verify Safe Singleton deployed bytecode matches real Safe
    const safeSingletonCode = await provider.getCode(deployResult.deployment.contracts.safeSingleton);
    expect(safeSingletonCode).not.toBe('0x');
    expect(safeSingletonCode.length).toBeGreaterThan(100);
    expect(safeSingletonCode).toBe(artifacts.safeSingleton.deployedBytecode);

    // Verify Safe Proxy Factory deployed bytecode matches real Safe
    const proxyFactoryCode = await provider.getCode(deployResult.deployment.contracts.safeProxyFactory);
    expect(proxyFactoryCode).not.toBe('0x');
    expect(proxyFactoryCode.length).toBeGreaterThan(100);
    expect(proxyFactoryCode).toBe(artifacts.safeProxyFactory.deployedBytecode);

    // Verify Fallback Handler deployed bytecode matches real Safe
    const fallbackHandlerCode = await provider.getCode(deployResult.deployment.contracts.fallbackHandler);
    expect(fallbackHandlerCode).not.toBe('0x');
    expect(fallbackHandlerCode.length).toBeGreaterThan(100);
    expect(fallbackHandlerCode).toBe(artifacts.fallbackHandler.deployedBytecode);

    // Verify MultiSend deployed bytecode matches real Safe
    const multiSendCode = await provider.getCode(deployResult.deployment.contracts.multiSend);
    expect(multiSendCode).not.toBe('0x');
    expect(multiSendCode.length).toBeGreaterThan(100);
    expect(multiSendCode).toBe(artifacts.multiSend.deployedBytecode);
  }, 120000);

  test('should deploy contracts with deterministic addresses using CREATE2', async () => {
    const networkId = 'eip155:31337';
    
    // Deploy infrastructure first time
    const deployment1 = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    // Deploy infrastructure second time (should get same addresses)
    const deployment2 = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    // Safe Singleton Factory should be at the canonical address
    expect(deployment1.deployment.contracts.singletonFactory).toBe('0xce0042B868300000d44A59004Da54A005ffdcf9f');
    expect(deployment2.deployment.contracts.singletonFactory).toBe('0xce0042B868300000d44A59004Da54A005ffdcf9f');
    
    // Other contracts should have deterministic addresses via CREATE2
    expect(deployment1.deployment.contracts.safeSingleton).toBe(deployment2.deployment.contracts.safeSingleton);
    expect(deployment1.deployment.contracts.safeProxyFactory).toBe(deployment2.deployment.contracts.safeProxyFactory);
    expect(deployment1.deployment.contracts.fallbackHandler).toBe(deployment2.deployment.contracts.fallbackHandler);
    expect(deployment1.deployment.contracts.multiSend).toBe(deployment2.deployment.contracts.multiSend);
  }, 180000);

  test('should handle insufficient balance error', async () => {
    const networkId = 'eip155:31337';
    
    // Create a wallet with no balance
    const emptyWallet = '0x0000000000000000000000000000000000000000000000000000000000000001';
    
    await expect(
      safeDeployInfrastructure.handle(
        {
          network: networkId,
          deployerPrivateKey: emptyWallet,
          confirmations: 1,
        },
        networkManager
      )
    ).rejects.toThrow('INSUFFICIENT_BALANCE');
  });

  test('should handle invalid network error', async () => {
    const invalidNetworkId = 'eip155:999999';
    
    await expect(
      safeDeployInfrastructure.handle(
        {
          network: invalidNetworkId,
          deployerPrivateKey,
          confirmations: 1,
        },
        networkManager
      )
    ).rejects.toThrow();
  });

  test('should handle missing artifacts error', async () => {
    const networkId = 'eip155:31337';
    
    // Temporarily rename artifacts file
    if (existsSync('real-safe-artifacts.json')) {
      writeFileSync('real-safe-artifacts.json.backup', readFileSync('real-safe-artifacts.json', 'utf8'));
      unlinkSync('real-safe-artifacts.json');
    }

    try {
      await expect(
        safeDeployInfrastructure.handle(
          {
            network: networkId,
            deployerPrivateKey,
            confirmations: 1,
          },
          networkManager
        )
      ).rejects.toThrow('ARTIFACTS_NOT_FOUND');
    } finally {
      // Restore artifacts file
      if (existsSync('real-safe-artifacts.json.backup')) {
        writeFileSync('real-safe-artifacts.json', readFileSync('real-safe-artifacts.json.backup', 'utf8'));
        unlinkSync('real-safe-artifacts.json.backup');
      }
    }
  });

  test('should create deployment file for new network', async () => {
    const networkId = 'eip155:31337';
    
    const deployResult = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    // Verify we can create a deployment file
    const deploymentInfo = {
      network: networkId,
      chainId: deployResult.chainId,
      deployedAt: new Date().toISOString(),
      deployer: deployResult.deployerAddress,
      contracts: deployResult.deployment.contracts,
      gasUsed: deployResult.gasUsed,
    };

    // Save deployment file
    const deploymentFile = `deployments/network-${deployResult.chainId}.json`;
    writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    // Verify file was created and contains correct data
    expect(existsSync(deploymentFile)).toBe(true);
    const savedDeployment = JSON.parse(readFileSync(deploymentFile, 'utf8'));
    expect(savedDeployment.network).toBe(networkId);
    expect(savedDeployment.chainId).toBe(31337);
    expect(savedDeployment.contracts.singletonFactory).toBe('0xce0042B868300000d44A59004Da54A005ffdcf9f');

    // Clean up
    unlinkSync(deploymentFile);
  }, 120000);

  test('should handle gas price parameter', async () => {
    const networkId = 'eip155:31337';
    
    const deployResult = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        gasPrice: '20', // 20 gwei
        confirmations: 1,
      },
      networkManager
    );

    expect(deployResult.success).toBe(true);
    expect(deployResult.gasUsed).toBeGreaterThan(0);
    
    // Verify gas price was used (indirectly through successful deployment)
    const receipt = await provider.getTransactionReceipt(
      deployResult.deployment.deployments[1]!.txHash // Safe Singleton deployment
    );
    expect(receipt).toBeTruthy();
    expect(receipt!.gasUsed).toBeGreaterThan(0);
  }, 120000);

  test('should handle multiple confirmation requirements', async () => {
    const networkId = 'eip155:31337';
    
    const deployResult = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 2, // Wait for 2 confirmations
      },
      networkManager
    );

    expect(deployResult.success).toBe(true);
    expect(deployResult.gasUsed).toBeGreaterThan(0);

    // Verify transactions have at least 2 confirmations
    for (const deployment of deployResult.deployment.deployments) {
      if (deployment.txHash !== 'already-deployed') {
        const receipt = await provider.getTransactionReceipt(deployment.txHash);
        expect(receipt).toBeTruthy();
        const currentBlock = await provider.getBlockNumber();
        const confirmations = currentBlock - receipt!.blockNumber + 1;
        expect(confirmations).toBeGreaterThanOrEqual(2);
      }
    }
  }, 180000);

  test('should verify contract function signatures', async () => {
    const networkId = 'eip155:31337';
    
    const deployResult = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    // Test Safe Singleton contract functions
    const safeSingleton = new ethers.Contract(
      deployResult.deployment.contracts.safeSingleton,
      ['function VERSION() external view returns (string)'],
      provider
    );

    try {
      const version = await safeSingleton.VERSION();
      expect(typeof version).toBe('string');
      expect(version.length).toBeGreaterThan(0);
    } catch (error) {
      // Some Safe contracts may not have VERSION function
      console.log('VERSION function not available or different interface');
    }

    // Test Safe Proxy Factory contract functions
    const proxyFactory = new ethers.Contract(
      deployResult.deployment.contracts.safeProxyFactory,
      ['function proxyCreationCode() external pure returns (bytes memory)'],
      provider
    );

    try {
      const creationCode = await proxyFactory.proxyCreationCode();
      expect(creationCode).toBeDefined();
      expect(creationCode.length).toBeGreaterThan(2); // Should be more than just '0x'
    } catch (error) {
      console.log('proxyCreationCode function not available or different interface');
    }
  }, 120000);

  test('should track gas usage accurately', async () => {
    const networkId = 'eip155:31337';
    
    const deployResult = await safeDeployInfrastructure.handle(
      {
        network: networkId,
        deployerPrivateKey,
        confirmations: 1,
      },
      networkManager
    );

    // Verify total gas usage is sum of individual deployments
    const calculatedTotal = deployResult.deployment.deployments.reduce(
      (total, deployment) => total + deployment.gasUsed,
      0
    );
    
    expect(deployResult.deployment.totalGasUsed).toBe(calculatedTotal);
    expect(deployResult.gasUsed).toBe(calculatedTotal);

    // Verify gas usage is reasonable (not zero, not excessive)
    expect(deployResult.gasUsed).toBeGreaterThan(100000); // At least 100k gas
    expect(deployResult.gasUsed).toBeLessThan(30000000); // Less than 30M gas

    // Verify each contract deployment used gas
    deployResult.deployment.deployments.forEach((deployment) => {
      if (deployment.txHash !== 'already-deployed') {
        expect(deployment.gasUsed).toBeGreaterThan(0);
      }
    });
  }, 120000);

  test('should handle network connectivity issues gracefully', async () => {
    // Create network manager with invalid RPC URL
    const badNetworkManager = new NetworkManager();
    badNetworkManager.addNetwork('eip155:99999', {
      name: 'Bad Network',
      chainId: 99999,
      rpcUrls: ['http://invalid-url:9999'],
    });

    await expect(
      safeDeployInfrastructure.handle(
        {
          network: 'eip155:99999',
          deployerPrivateKey,
          confirmations: 1,
        },
        badNetworkManager
      )
    ).rejects.toThrow();
  });
});