#!/usr/bin/env node

/**
 * Deploy Actual SAFE Contracts to Local Blockchain
 * Uses official SAFE bytecode from @safe-global/safe-deployments
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Import official SAFE deployment artifacts
import {
  getSafeSingletonDeployment,
  getProxyFactoryDeployment,
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendDeployment,
  getMultiSendCallOnlyDeployment,
  getCreateCallDeployment,
  getSignMessageLibDeployment
} from '@safe-global/safe-deployments';

// ActualSafeDeployment interface definition (as comment for reference)
// {
//   chainId: number,
//   network: string,
//   contracts: { singleton, proxyFactory, fallbackHandler, multiSend, multiSendCallOnly, createCall, signMessageLib },
//   deployer: string,
//   blockNumber: number,
//   timestamp: number,
//   gasUsed: { ... }
// }

async function deployActualSafeContracts() {
  console.log('🚀 Deploying ACTUAL SAFE Contracts with Official Bytecode');
  console.log('=======================================================');

  // Connect to local hardhat network
  const provider = new ethers.JsonRpcProvider('http://localhost:8545');
  
  // Use first account as deployer
  const deployer = await provider.getSigner(0);
  const deployerAddress = await deployer.getAddress();
  const balance = await provider.getBalance(deployerAddress);
  const network = await provider.getNetwork();
  
  console.log(`📋 Deployer: ${deployerAddress}`);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);
  console.log(`🌐 Network: ${network.name} (${network.chainId})`);
  console.log('');

  // Get official SAFE deployment artifacts - use latest v1.4.1
  console.log('📦 Loading official SAFE deployment artifacts...');
  const safeDeployment = getSafeSingletonDeployment({ version: "1.4.1" });
  const proxyFactoryDeployment = getProxyFactoryDeployment({ version: "1.4.1" });
  const fallbackHandlerDeployment = getCompatibilityFallbackHandlerDeployment({ version: "1.4.1" });
  const multiSendDeployment = getMultiSendDeployment({ version: "1.4.1" });
  const multiSendCallOnlyDeployment = getMultiSendCallOnlyDeployment({ version: "1.4.1" });
  const createCallDeployment = getCreateCallDeployment({ version: "1.4.1" });
  const signMessageLibDeployment = getSignMessageLibDeployment({ version: "1.4.1" });

  if (!safeDeployment || !proxyFactoryDeployment || !fallbackHandlerDeployment || 
      !multiSendDeployment || !multiSendCallOnlyDeployment || !createCallDeployment || 
      !signMessageLibDeployment) {
    throw new Error("Failed to get SAFE deployment artifacts");
  }
  console.log('✅ Official SAFE artifacts loaded');
  console.log('');

  const deployedContracts = {};
  const gasUsed = {};

  // Deploy SAFE Singleton
  console.log('📦 Deploying SAFE Singleton...');
  const safeSingletonFactory = new ethers.ContractFactory(
    safeDeployment.abi,
    safeDeployment.bytecode,
    deployer
  );
  const safeSingleton = await safeSingletonFactory.deploy();
  const singletonReceipt = await safeSingleton.deploymentTransaction().wait();
  deployedContracts.singleton = await safeSingleton.getAddress();
  gasUsed.singleton = singletonReceipt.gasUsed.toString();
  console.log(`✅ SAFE Singleton deployed at: ${deployedContracts.singleton}`);
  console.log(`   Gas used: ${gasUsed.singleton}`);

  // Deploy SafeProxyFactory
  console.log('📦 Deploying SafeProxyFactory...');
  const proxyFactoryFactory = new ethers.ContractFactory(
    proxyFactoryDeployment.abi,
    proxyFactoryDeployment.bytecode,
    deployer
  );
  const proxyFactory = await proxyFactoryFactory.deploy();
  const proxyFactoryReceipt = await proxyFactory.deploymentTransaction().wait();
  deployedContracts.proxyFactory = await proxyFactory.getAddress();
  gasUsed.proxyFactory = proxyFactoryReceipt.gasUsed.toString();
  console.log(`✅ SafeProxyFactory deployed at: ${deployedContracts.proxyFactory}`);
  console.log(`   Gas used: ${gasUsed.proxyFactory}`);

  // Deploy CompatibilityFallbackHandler
  console.log('📦 Deploying CompatibilityFallbackHandler...');
  const fallbackHandlerFactory = new ethers.ContractFactory(
    fallbackHandlerDeployment.abi,
    fallbackHandlerDeployment.bytecode,
    deployer
  );
  const fallbackHandler = await fallbackHandlerFactory.deploy();
  const fallbackHandlerReceipt = await fallbackHandler.deploymentTransaction().wait();
  deployedContracts.fallbackHandler = await fallbackHandler.getAddress();
  gasUsed.fallbackHandler = fallbackHandlerReceipt.gasUsed.toString();
  console.log(`✅ CompatibilityFallbackHandler deployed at: ${deployedContracts.fallbackHandler}`);
  console.log(`   Gas used: ${gasUsed.fallbackHandler}`);

  // Deploy MultiSend
  console.log('📦 Deploying MultiSend...');
  const multiSendFactory = new ethers.ContractFactory(
    multiSendDeployment.abi,
    multiSendDeployment.bytecode,
    deployer
  );
  const multiSend = await multiSendFactory.deploy();
  const multiSendReceipt = await multiSend.deploymentTransaction().wait();
  deployedContracts.multiSend = await multiSend.getAddress();
  gasUsed.multiSend = multiSendReceipt.gasUsed.toString();
  console.log(`✅ MultiSend deployed at: ${deployedContracts.multiSend}`);
  console.log(`   Gas used: ${gasUsed.multiSend}`);

  // Deploy MultiSendCallOnly
  console.log('📦 Deploying MultiSendCallOnly...');
  const multiSendCallOnlyFactory = new ethers.ContractFactory(
    multiSendCallOnlyDeployment.abi,
    multiSendCallOnlyDeployment.bytecode,
    deployer
  );
  const multiSendCallOnly = await multiSendCallOnlyFactory.deploy();
  const multiSendCallOnlyReceipt = await multiSendCallOnly.deploymentTransaction().wait();
  deployedContracts.multiSendCallOnly = await multiSendCallOnly.getAddress();
  gasUsed.multiSendCallOnly = multiSendCallOnlyReceipt.gasUsed.toString();
  console.log(`✅ MultiSendCallOnly deployed at: ${deployedContracts.multiSendCallOnly}`);
  console.log(`   Gas used: ${gasUsed.multiSendCallOnly}`);

  // Deploy CreateCall
  console.log('📦 Deploying CreateCall...');
  const createCallFactory = new ethers.ContractFactory(
    createCallDeployment.abi,
    createCallDeployment.bytecode,
    deployer
  );
  const createCall = await createCallFactory.deploy();
  const createCallReceipt = await createCall.deploymentTransaction().wait();
  deployedContracts.createCall = await createCall.getAddress();
  gasUsed.createCall = createCallReceipt.gasUsed.toString();
  console.log(`✅ CreateCall deployed at: ${deployedContracts.createCall}`);
  console.log(`   Gas used: ${gasUsed.createCall}`);

  // Deploy SignMessageLib
  console.log('📦 Deploying SignMessageLib...');
  const signMessageLibFactory = new ethers.ContractFactory(
    signMessageLibDeployment.abi,
    signMessageLibDeployment.bytecode,
    deployer
  );
  const signMessageLib = await signMessageLibFactory.deploy();
  const signMessageLibReceipt = await signMessageLib.deploymentTransaction().wait();
  deployedContracts.signMessageLib = await signMessageLib.getAddress();
  gasUsed.signMessageLib = signMessageLibReceipt.gasUsed.toString();
  console.log(`✅ SignMessageLib deployed at: ${deployedContracts.signMessageLib}`);
  console.log(`   Gas used: ${gasUsed.signMessageLib}`);

  // Get current block info
  const latestBlock = await provider.getBlock('latest');
  if (!latestBlock) throw new Error('Failed to get latest block');

  const deployment = {
    chainId: Number(network.chainId),
    network: 'localhost',
    contracts: deployedContracts,
    deployer: deployerAddress,
    blockNumber: latestBlock.number,
    timestamp: latestBlock.timestamp,
    gasUsed,
  };

  console.log('');
  console.log('🎉 ACTUAL SAFE Contracts Successfully Deployed!');
  console.log('==============================================');
  console.log('Contract Addresses:');
  console.log(`  Safe Singleton:           ${deployment.contracts.singleton}`);
  console.log(`  SafeProxyFactory:         ${deployment.contracts.proxyFactory}`);
  console.log(`  CompatibilityFallback:    ${deployment.contracts.fallbackHandler}`);
  console.log(`  MultiSend:                ${deployment.contracts.multiSend}`);
  console.log(`  MultiSendCallOnly:        ${deployment.contracts.multiSendCallOnly}`);
  console.log(`  CreateCall:               ${deployment.contracts.createCall}`);
  console.log(`  SignMessageLib:           ${deployment.contracts.signMessageLib}`);
  console.log('');
  console.log(`📅 Deployment Block: ${deployment.blockNumber}`);
  console.log(`⏰ Timestamp: ${new Date(deployment.timestamp * 1000).toISOString()}`);

  // Calculate total gas used
  const totalGasUsed = Object.values(gasUsed).reduce((total, gas) => total + BigInt(gas), 0n);
  console.log(`⛽ Total Gas Used: ${totalGasUsed.toString()}`);

  // Save deployment info to registry
  const registryPath = './test/contracts/registry/localhost.json';
  const registryDir = path.dirname(registryPath);
  
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }
  
  fs.writeFileSync(registryPath, JSON.stringify(deployment, null, 2));
  console.log(`💾 Deployment registry updated: ${registryPath}`);

  // Verify all contracts are deployed correctly
  console.log('');
  console.log('🔍 Verifying contract deployments...');
  for (const [name, address] of Object.entries(deployedContracts)) {
    const code = await provider.getCode(address);
    if (code === '0x') {
      throw new Error(`Contract ${name} at ${address} has no code!`);
    }
    console.log(`✅ ${name} verified with ${code.length} bytes of code`);
  }

  console.log('');
  console.log('🎯 ALL CONTRACTS SUCCESSFULLY DEPLOYED AND VERIFIED!');
  console.log('Ready for real SAFE wallet creation and transactions!');

  return deployment;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  deployActualSafeContracts()
    .then((deployment) => {
      console.log('\n✅ Actual SAFE contract deployment completed successfully!');
      console.log('🚀 Ready for real wallet lifecycle testing');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Actual SAFE deployment failed:', error);
      process.exit(1);
    });
}

export { deployActualSafeContracts };