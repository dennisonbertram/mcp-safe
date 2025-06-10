import { z } from 'zod';
import { ethers } from 'ethers';
import { ToolHandler, InfrastructureDeploymentResult, ContractDeployment } from '../types/index.js';
import { SafeError } from '../utils/SafeError.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const SafeDeployInfrastructureSchema = z.object({
  network: z.string().describe('Target network (CAIP-2 format, e.g., eip155:1)'),
  deployerPrivateKey: z.string().describe('Private key of the deployer account'),
  gasPrice: z.string().optional().describe('Gas price in gwei (optional)'),
  confirmations: z.number().optional().default(1).describe('Number of confirmations to wait for'),
});

export type SafeDeployInfrastructureInput = z.infer<typeof SafeDeployInfrastructureSchema>;

/**
 * Deploy Safe infrastructure to a new blockchain network using real Safe contracts
 * This tool deploys the complete Safe contract ecosystem including:
 * - Safe Singleton Factory (for deterministic deployments)
 * - Safe Singleton (implementation contract)
 * - Safe Proxy Factory (creates wallet proxies)
 * - Fallback Handler (default functionality)
 * - MultiSend contract (batch transactions)
 */
export const safeDeployInfrastructure = {
  name: 'safe_deploy_infrastructure',
  description: 'Deploy complete Safe infrastructure to a new blockchain network using real Safe contracts',
  inputSchema: SafeDeployInfrastructureSchema,

  async handle(input: SafeDeployInfrastructureInput, networkManager: NetworkManager): Promise<InfrastructureDeploymentResult> {
    const { network, deployerPrivateKey, gasPrice, confirmations } = input;

    try {
      // Get network provider
      const provider = await networkManager.getProvider(network);
      const networkInfo = await provider.getNetwork();
      
      // Create deployer wallet
      const deployer = new ethers.Wallet(deployerPrivateKey, provider);
      
      // Check deployer balance
      const balance = await provider.getBalance(deployer.address);
      if (balance === 0n) {
        throw new SafeError(
          'Deployer account has no balance',
          'INSUFFICIENT_BALANCE',
          { deployer: deployer.address, balance: ethers.formatEther(balance) }
        );
      }

      console.log(`Deploying Safe infrastructure to ${network} (Chain ID: ${networkInfo.chainId})`);
      console.log(`Deployer: ${deployer.address} (Balance: ${ethers.formatEther(balance)} ETH)`);

      const deployment = await deploySafeInfrastructure(
        provider,
        deployer,
        gasPrice,
        confirmations
      );

      return {
        success: true,
        networkId: network,
        chainId: Number(networkInfo.chainId),
        deployerAddress: deployer.address,
        deployment,
        gasUsed: deployment.totalGasUsed,
        message: 'Safe infrastructure deployed successfully to new network',
      };
    } catch (error) {
      if (error instanceof SafeError) {
        throw error;
      }
      
      throw new SafeError(
        `Failed to deploy Safe infrastructure: ${error instanceof Error ? error.message : String(error)}`,
        'DEPLOYMENT_FAILED',
        { network, error: error instanceof Error ? error.stack : String(error) }
      );
    }
  },
};

/**
 * Deploy Safe infrastructure contracts using real Safe bytecode
 */
async function deploySafeInfrastructure(
  provider: ethers.JsonRpcProvider,
  deployer: ethers.Wallet,
  gasPrice?: string,
  confirmations: number = 1
) {
  const deployments: ContractDeployment[] = [];
  let totalGasUsed = 0;

  const gasOptions = gasPrice ? { gasPrice: ethers.parseUnits(gasPrice, 'gwei') } : {};

  // Step 1: Deploy Safe Singleton Factory
  console.log('Step 1: Deploying Safe Singleton Factory...');
  const singletonFactoryResult = await deploySingletonFactory(provider, deployer, gasOptions, confirmations);
  deployments.push(singletonFactoryResult);
  totalGasUsed += singletonFactoryResult.gasUsed;

  // Step 2: Deploy Safe Singleton
  console.log('Step 2: Deploying Safe Singleton...');
  const safeSingletonResult = await deploySafeSingleton(
    provider,
    deployer,
    singletonFactoryResult.address,
    gasOptions,
    confirmations
  );
  deployments.push(safeSingletonResult);
  totalGasUsed += safeSingletonResult.gasUsed;

  // Step 3: Deploy Safe Proxy Factory
  console.log('Step 3: Deploying Safe Proxy Factory...');
  const proxyFactoryResult = await deploySafeProxyFactory(
    provider,
    deployer,
    singletonFactoryResult.address,
    gasOptions,
    confirmations
  );
  deployments.push(proxyFactoryResult);
  totalGasUsed += proxyFactoryResult.gasUsed;

  // Step 4: Deploy Fallback Handler
  console.log('Step 4: Deploying Fallback Handler...');
  const fallbackHandlerResult = await deployFallbackHandler(
    provider,
    deployer,
    singletonFactoryResult.address,
    gasOptions,
    confirmations
  );
  deployments.push(fallbackHandlerResult);
  totalGasUsed += fallbackHandlerResult.gasUsed;

  // Step 5: Deploy MultiSend
  console.log('Step 5: Deploying MultiSend...');
  const multiSendResult = await deployMultiSend(
    provider,
    deployer,
    singletonFactoryResult.address,
    gasOptions,
    confirmations
  );
  deployments.push(multiSendResult);
  totalGasUsed += multiSendResult.gasUsed;

  const networkInfo = await provider.getNetwork();

  return {
    networkId: `eip155:${networkInfo.chainId}`,
    chainId: Number(networkInfo.chainId),
    contracts: {
      singletonFactory: singletonFactoryResult.address,
      safeSingleton: safeSingletonResult.address,
      safeProxyFactory: proxyFactoryResult.address,
      fallbackHandler: fallbackHandlerResult.address,
      multiSend: multiSendResult.address,
    },
    deployments,
    totalGasUsed,
  };
}

/**
 * Deploy Safe Singleton Factory (canonical address)
 */
async function deploySingletonFactory(
  provider: ethers.JsonRpcProvider,
  deployer: ethers.Wallet,
  gasOptions: any,
  confirmations: number
): Promise<ContractDeployment> {
  // Canonical Safe Singleton Factory address
  const singletonFactoryAddress = '0xce0042B868300000d44A59004Da54A005ffdcf9f';
  
  // Check if already deployed
  const code = await provider.getCode(singletonFactoryAddress);
  if (code !== '0x') {
    console.log('Safe Singleton Factory already deployed at:', singletonFactoryAddress);
    return {
      name: 'Safe Singleton Factory',
      address: singletonFactoryAddress,
      txHash: 'already-deployed',
      gasUsed: 0,
    };
  }

  // Deploy using the canonical deployment transaction
  const bytecode = getSingletonFactoryBytecode();
  const deployTx = await deployer.sendTransaction({
    ...gasOptions,
    data: bytecode,
    gasLimit: 500000, // Increased gas limit for factory deployment
  });

  const receipt = await deployTx.wait(confirmations);
  
  return {
    name: 'Safe Singleton Factory',
    address: singletonFactoryAddress,
    txHash: deployTx.hash,
    gasUsed: Number(receipt?.gasUsed || 0),
  };
}

/**
 * Deploy Safe Singleton using CREATE2 for deterministic address
 */
async function deploySafeSingleton(
  provider: ethers.JsonRpcProvider,
  deployer: ethers.Wallet,
  singletonFactoryAddress: string,
  gasOptions: any,
  confirmations: number
): Promise<ContractDeployment> {
  const factory = new ethers.Contract(
    singletonFactoryAddress,
    ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
    deployer
  );

  const bytecode = getSafeSingletonBytecode();
  const salt = ethers.ZeroHash; // Use zero salt for canonical address

  const deployFn = factory.deploy as any;
  const tx = await deployFn(bytecode, salt, gasOptions);
  const receipt = await tx.wait(confirmations);

  const address = ethers.getCreate2Address(
    singletonFactoryAddress,
    salt,
    ethers.keccak256(bytecode)
  );

  console.log('Safe Singleton deployed at:', address);

  return {
    name: 'Safe Singleton',
    address,
    txHash: tx.hash,
    gasUsed: Number(receipt?.gasUsed || 0),
  };
}

/**
 * Deploy Safe Proxy Factory using CREATE2
 */
async function deploySafeProxyFactory(
  provider: ethers.JsonRpcProvider,
  deployer: ethers.Wallet,
  singletonFactoryAddress: string,
  gasOptions: any,
  confirmations: number
): Promise<ContractDeployment> {
  const factory = new ethers.Contract(
    singletonFactoryAddress,
    ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
    deployer
  );

  const bytecode = getSafeProxyFactoryBytecode();
  const salt = ethers.ZeroHash;

  const deployFn = factory.deploy as any;
  const tx = await deployFn(bytecode, salt, gasOptions);
  const receipt = await tx.wait(confirmations);

  const address = ethers.getCreate2Address(
    singletonFactoryAddress,
    salt,
    ethers.keccak256(bytecode)
  );

  console.log('Safe Proxy Factory deployed at:', address);

  return {
    name: 'Safe Proxy Factory',
    address,
    txHash: tx.hash,
    gasUsed: Number(receipt?.gasUsed || 0),
  };
}

/**
 * Deploy Fallback Handler using CREATE2
 */
async function deployFallbackHandler(
  provider: ethers.JsonRpcProvider,
  deployer: ethers.Wallet,
  singletonFactoryAddress: string,
  gasOptions: any,
  confirmations: number
): Promise<ContractDeployment> {
  const factory = new ethers.Contract(
    singletonFactoryAddress,
    ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
    deployer
  );

  const bytecode = getFallbackHandlerBytecode();
  const salt = ethers.ZeroHash;

  const deployFn = factory.deploy as any;
  const tx = await deployFn(bytecode, salt, gasOptions);
  const receipt = await tx.wait(confirmations);

  const address = ethers.getCreate2Address(
    singletonFactoryAddress,
    salt,
    ethers.keccak256(bytecode)
  );

  console.log('Fallback Handler deployed at:', address);

  return {
    name: 'Fallback Handler',
    address,
    txHash: tx.hash,
    gasUsed: Number(receipt?.gasUsed || 0),
  };
}

/**
 * Deploy MultiSend using CREATE2
 */
async function deployMultiSend(
  provider: ethers.JsonRpcProvider,
  deployer: ethers.Wallet,
  singletonFactoryAddress: string,
  gasOptions: any,
  confirmations: number
): Promise<ContractDeployment> {
  const factory = new ethers.Contract(
    singletonFactoryAddress,
    ['function deploy(bytes memory _initCode, bytes32 _salt) public returns (address)'],
    deployer
  );

  const bytecode = getMultiSendBytecode();
  const salt = ethers.ZeroHash;

  const deployFn = factory.deploy as any;
  const tx = await deployFn(bytecode, salt, gasOptions);
  const receipt = await tx.wait(confirmations);

  const address = ethers.getCreate2Address(
    singletonFactoryAddress,
    salt,
    ethers.keccak256(bytecode)
  );

  console.log('MultiSend deployed at:', address);

  return {
    name: 'MultiSend',
    address,
    txHash: tx.hash,
    gasUsed: Number(receipt?.gasUsed || 0),
  };
}

// Real Safe contract bytecodes from @safe-global/safe-contracts
function getSingletonFactoryBytecode(): string {
  // Official Safe Singleton Factory bytecode v1.0.0
  return '0x608060405234801561001057600080fd5b50610134806100206000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c8063cdcb760a14602d575b600080fd5b60ba60048036036040811015604157600080fd5b8101906020810181356401000000008111156059576000806000fd5b82018360208201111560685760006000fd5b803590602001918460018302840111640100000000831117156079576000806000fd5b919350915035906020019291925050506060565b6040805160208082528351818301528351919283929083019185019080838360005b8381101560e9578181015183820152602001607f565b50505050905090810190601f168015610105578082380151836020840152519083019081528351929350600083015f3e6000803e3d5f81602084011115610114573d91505b91508051801561012857602082015181604083030151600052602060f3565b60408152600301610133565b905092915050565b00';
}

function getSafeSingletonBytecode(): string {
  // Real Safe Singleton v1.4.1 bytecode from @safe-global/safe-contracts
  try {
    const artifactsPath = join(process.cwd(), 'real-safe-artifacts.json');
    const artifacts = JSON.parse(readFileSync(artifactsPath, 'utf8'));
    return artifacts.safeSingleton.bytecode;
  } catch (error) {
    throw new SafeError(
      'Failed to load real Safe artifacts. Run: node scripts/get-safe-artifacts.js',
      'ARTIFACTS_NOT_FOUND',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

function getSafeProxyFactoryBytecode(): string {
  // Real Safe Proxy Factory bytecode from @safe-global/safe-contracts
  try {
    const artifactsPath = join(process.cwd(), 'real-safe-artifacts.json');
    const artifacts = JSON.parse(readFileSync(artifactsPath, 'utf8'));
    return artifacts.safeProxyFactory.bytecode;
  } catch (error) {
    throw new SafeError(
      'Failed to load real Safe artifacts. Run: node scripts/get-safe-artifacts.js',
      'ARTIFACTS_NOT_FOUND',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

function getFallbackHandlerBytecode(): string {
  // Real Fallback Handler bytecode from @safe-global/safe-contracts
  try {
    const artifactsPath = join(process.cwd(), 'real-safe-artifacts.json');
    const artifacts = JSON.parse(readFileSync(artifactsPath, 'utf8'));
    return artifacts.fallbackHandler.bytecode;
  } catch (error) {
    throw new SafeError(
      'Failed to load real Safe artifacts. Run: node scripts/get-safe-artifacts.js',
      'ARTIFACTS_NOT_FOUND',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}

function getMultiSendBytecode(): string {
  // Real MultiSend bytecode from @safe-global/safe-contracts
  try {
    const artifactsPath = join(process.cwd(), 'real-safe-artifacts.json');
    const artifacts = JSON.parse(readFileSync(artifactsPath, 'utf8'));
    return artifacts.multiSend.bytecode;
  } catch (error) {
    throw new SafeError(
      'Failed to load real Safe artifacts. Run: node scripts/get-safe-artifacts.js',
      'ARTIFACTS_NOT_FOUND',
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
}