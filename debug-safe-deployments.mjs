#!/usr/bin/env node

/**
 * Debug SAFE deployment artifacts
 */

import {
  getSafeSingletonDeployment,
  getProxyFactoryDeployment,
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendDeployment,
  getMultiSendCallOnlyDeployment,
} from '@safe-global/safe-deployments';

function debugDeployment() {
  console.log('🔍 Debugging SAFE deployment artifacts...\n');

  const artifacts = [
    { name: 'Safe Singleton', getter: getSafeSingletonDeployment },
    { name: 'ProxyFactory', getter: getProxyFactoryDeployment },
    { name: 'FallbackHandler', getter: getCompatibilityFallbackHandlerDeployment },
    { name: 'MultiSend', getter: getMultiSendDeployment },
    { name: 'MultiSendCallOnly', getter: getMultiSendCallOnlyDeployment },
  ];

  for (const { name, getter } of artifacts) {
    console.log(`📦 ${name}:`);
    
    try {
      const artifact = getter({ version: "1.4.1" });
      
      if (!artifact) {
        console.log('  ❌ No artifact found');
        continue;
      }

      console.log(`  ✅ Artifact found`);
      console.log(`     Has ABI: ${artifact.abi ? 'Yes' : 'No'}`);
      console.log(`     Has bytecode: ${artifact.bytecode ? 'Yes' : 'No'}`);
      
      if (artifact.bytecode) {
        console.log(`     Bytecode length: ${artifact.bytecode.length} chars`);
        console.log(`     Bytecode starts with: ${artifact.bytecode.substring(0, 20)}...`);
      }
      
      console.log(`     Contract name: ${artifact.contractName || 'Unknown'}`);
      console.log(`     Version: ${artifact.version || 'Unknown'}`);
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    
    console.log('');
  }

  // Test with different versions
  console.log('🔍 Testing different versions...\n');
  
  const versions = ['1.4.1', '1.3.0', '1.2.0'];
  for (const version of versions) {
    console.log(`Version ${version}:`);
    try {
      const safe = getSafeSingletonDeployment({ version });
      console.log(`  Safe: ${safe ? '✅' : '❌'}`);
      
      const factory = getProxyFactoryDeployment({ version });
      console.log(`  Factory: ${factory ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`  Error: ${error.message}`);
    }
  }
}

debugDeployment();