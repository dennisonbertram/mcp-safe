#!/usr/bin/env node

/**
 * Deploy simple valid contracts for testing
 * Uses very basic but valid bytecode that will deploy successfully
 */

import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';

// Very simple valid contract bytecode - just returns true for any call
const SIMPLE_CONTRACT_BYTECODE = "0x6080604052348015600f57600080fd5b50603f80601d6000396000f3fe6080604052348015600f57600080fd5b506004361060285760003560e01c80632e1a7d4d14602d575b600080fd5b60336035565b005b56fea264697066735822122000000000000000000000000000000000000000000000000000000000000000064736f6c63430008070033";

async function deploySimpleContracts() {
  console.log('🚀 Deploying Simple Test Contracts');
  console.log('=================================');

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

  const deployedContracts = {};
  const gasUsed = {};

  // List of contracts to deploy
  const contractNames = [
    'singleton',
    'proxyFactory',
    'fallbackHandler',
    'multiSend',
    'multiSendCallOnly',
    'createCall',
    'signMessageLib'
  ];

  // Deploy each contract
  for (const contractName of contractNames) {
    console.log(`📦 Deploying ${contractName}...`);
    
    try {
      const tx = await deployer.sendTransaction({
        data: SIMPLE_CONTRACT_BYTECODE,
        gasLimit: 1000000
      });
      
      const receipt = await tx.wait();
      const contractAddress = receipt.contractAddress;
      
      deployedContracts[contractName] = contractAddress;
      gasUsed[contractName] = receipt.gasUsed.toString();
      console.log(`✅ ${contractName} deployed at: ${contractAddress}`);
      
    } catch (error) {
      console.error(`❌ Failed to deploy ${contractName}:`, error.message);
      throw error;
    }
  }

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
    version: 'simple-test',
    note: 'Simple test contracts for MCP server development'
  };

  console.log('');
  console.log('🎉 Simple Test Contracts Successfully Deployed!');
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
  console.log('🎯 SIMPLE TEST CONTRACTS DEPLOYED AND VERIFIED!');
  console.log('🚀 Ready for MCP server testing with real contract addresses!');
  console.log('📝 Note: These are minimal test contracts, not full SAFE implementations');

  return deployment;
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  deploySimpleContracts()
    .then((deployment) => {
      console.log('\n✅ Simple contract deployment completed successfully!');
      console.log('🚀 Ready for MCP server testing with real deployed contracts');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Simple contract deployment failed:', error);
      process.exit(1);
    });
}

export { deploySimpleContracts };