const fs = require('fs');
const path = require('path');

/**
 * Extract real Safe contract bytecodes from @safe-global/safe-contracts
 */
function getSafeArtifacts() {
  try {
    // Safe Singleton artifact
    const safeArtifactPath = require.resolve('@safe-global/safe-contracts/build/artifacts/contracts/Safe.sol/Safe.json');
    const safeArtifact = JSON.parse(fs.readFileSync(safeArtifactPath, 'utf8'));
    
    // Safe Proxy Factory artifact
    const proxyFactoryArtifactPath = require.resolve('@safe-global/safe-contracts/build/artifacts/contracts/proxies/SafeProxyFactory.sol/SafeProxyFactory.json');
    const proxyFactoryArtifact = JSON.parse(fs.readFileSync(proxyFactoryArtifactPath, 'utf8'));
    
    // Compatibility Fallback Handler artifact
    const fallbackHandlerArtifactPath = require.resolve('@safe-global/safe-contracts/build/artifacts/contracts/handler/CompatibilityFallbackHandler.sol/CompatibilityFallbackHandler.json');
    const fallbackHandlerArtifact = JSON.parse(fs.readFileSync(fallbackHandlerArtifactPath, 'utf8'));
    
    // MultiSend artifact
    const multiSendArtifactPath = require.resolve('@safe-global/safe-contracts/build/artifacts/contracts/libraries/MultiSend.sol/MultiSend.json');
    const multiSendArtifact = JSON.parse(fs.readFileSync(multiSendArtifactPath, 'utf8'));

    console.log('Safe Singleton Artifact Info:', {
      contractName: safeArtifact.contractName,
      sourceName: safeArtifact.sourceName,
      bytecode: safeArtifact.bytecode ? 'Available' : 'Not available',
      deployedBytecode: safeArtifact.deployedBytecode ? 'Available' : 'Not available',
      abi: safeArtifact.abi ? 'Available' : 'Not available',
      bytecodeLength: safeArtifact.bytecode ? safeArtifact.bytecode.length : 0
    });

    console.log('Proxy Factory Artifact Info:', {
      contractName: proxyFactoryArtifact.contractName,
      sourceName: proxyFactoryArtifact.sourceName,
      bytecode: proxyFactoryArtifact.bytecode ? 'Available' : 'Not available',
      deployedBytecode: proxyFactoryArtifact.deployedBytecode ? 'Available' : 'Not available',
      abi: proxyFactoryArtifact.abi ? 'Available' : 'Not available',
      bytecodeLength: proxyFactoryArtifact.bytecode ? proxyFactoryArtifact.bytecode.length : 0
    });

    console.log('Fallback Handler Artifact Info:', {
      contractName: fallbackHandlerArtifact.contractName,
      sourceName: fallbackHandlerArtifact.sourceName,
      bytecode: fallbackHandlerArtifact.bytecode ? 'Available' : 'Not available',
      deployedBytecode: fallbackHandlerArtifact.deployedBytecode ? 'Available' : 'Not available',
      abi: fallbackHandlerArtifact.abi ? 'Available' : 'Not available',
      bytecodeLength: fallbackHandlerArtifact.bytecode ? fallbackHandlerArtifact.bytecode.length : 0
    });

    console.log('MultiSend Artifact Info:', {
      contractName: multiSendArtifact.contractName,
      sourceName: multiSendArtifact.sourceName,
      bytecode: multiSendArtifact.bytecode ? 'Available' : 'Not available',
      deployedBytecode: multiSendArtifact.deployedBytecode ? 'Available' : 'Not available',
      abi: multiSendArtifact.abi ? 'Available' : 'Not available',
      bytecodeLength: multiSendArtifact.bytecode ? multiSendArtifact.bytecode.length : 0
    });

    const artifacts = {
      safeSingleton: {
        contractName: safeArtifact.contractName,
        sourceName: safeArtifact.sourceName,
        bytecode: safeArtifact.bytecode,
        deployedBytecode: safeArtifact.deployedBytecode,
        abi: safeArtifact.abi
      },
      safeProxyFactory: {
        contractName: proxyFactoryArtifact.contractName,
        sourceName: proxyFactoryArtifact.sourceName,
        bytecode: proxyFactoryArtifact.bytecode,
        deployedBytecode: proxyFactoryArtifact.deployedBytecode,
        abi: proxyFactoryArtifact.abi
      },
      fallbackHandler: {
        contractName: fallbackHandlerArtifact.contractName,
        sourceName: fallbackHandlerArtifact.sourceName,
        bytecode: fallbackHandlerArtifact.bytecode,
        deployedBytecode: fallbackHandlerArtifact.deployedBytecode,
        abi: fallbackHandlerArtifact.abi
      },
      multiSend: {
        contractName: multiSendArtifact.contractName,
        sourceName: multiSendArtifact.sourceName,
        bytecode: multiSendArtifact.bytecode,
        deployedBytecode: multiSendArtifact.deployedBytecode,
        abi: multiSendArtifact.abi
      }
    };

    // Save artifacts
    fs.writeFileSync(
      'real-safe-artifacts.json',
      JSON.stringify(artifacts, null, 2)
    );

    console.log('\nReal Safe artifacts extracted and saved to real-safe-artifacts.json');
    
    // Output bytecode previews
    if (safeArtifact.bytecode) {
      console.log('\nSafe Singleton Bytecode Preview:', safeArtifact.bytecode.substring(0, 100) + '...');
    }

    if (proxyFactoryArtifact.bytecode) {
      console.log('Proxy Factory Bytecode Preview:', proxyFactoryArtifact.bytecode.substring(0, 100) + '...');
    }

    if (fallbackHandlerArtifact.bytecode) {
      console.log('Fallback Handler Bytecode Preview:', fallbackHandlerArtifact.bytecode.substring(0, 100) + '...');
    }

    if (multiSendArtifact.bytecode) {
      console.log('MultiSend Bytecode Preview:', multiSendArtifact.bytecode.substring(0, 100) + '...');
    }

    return artifacts;

  } catch (error) {
    console.error('Error extracting Safe artifacts:', error.message);
    console.error('Make sure @safe-global/safe-contracts is installed');
    throw error;
  }
}

getSafeArtifacts();