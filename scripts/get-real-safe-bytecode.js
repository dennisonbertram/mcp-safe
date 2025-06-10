import pkg from '@safe-global/safe-deployments';
const { 
  getSafeSingletonDeployment, 
  getProxyFactoryDeployment,
  getCompatibilityFallbackHandlerDeployment,
  getMultiSendDeployment
} = pkg;
import fs from 'fs';

/**
 * Extract real Safe contract bytecodes from official Safe deployments
 */
async function getRealSafeBytecode() {
  try {
    // Get Safe Singleton deployment
    const safeDeployment = getSafeSingletonDeployment({ version: '1.4.1' });
    console.log('Safe Singleton Deployment Info:', {
      contractName: safeDeployment.contractName,
      version: safeDeployment.version,
      abi: safeDeployment.abi ? 'Available' : 'Not available',
      bytecode: safeDeployment.bytecode ? 'Available' : 'Not available',
      deployedBytecode: safeDeployment.deployedBytecode ? 'Available' : 'Not available'
    });

    // Get Safe Proxy Factory deployment
    const proxyFactoryDeployment = getProxyFactoryDeployment({ version: '1.4.1' });
    console.log('Proxy Factory Deployment Info:', {
      contractName: proxyFactoryDeployment.contractName,
      version: proxyFactoryDeployment.version,
      abi: proxyFactoryDeployment.abi ? 'Available' : 'Not available',
      bytecode: proxyFactoryDeployment.bytecode ? 'Available' : 'Not available',
      deployedBytecode: proxyFactoryDeployment.deployedBytecode ? 'Available' : 'Not available'
    });

    // Get Fallback Handler deployment
    const fallbackHandlerDeployment = getCompatibilityFallbackHandlerDeployment({ version: '1.4.1' });
    console.log('Fallback Handler Deployment Info:', {
      contractName: fallbackHandlerDeployment.contractName,
      version: fallbackHandlerDeployment.version,
      abi: fallbackHandlerDeployment.abi ? 'Available' : 'Not available',
      bytecode: fallbackHandlerDeployment.bytecode ? 'Available' : 'Not available',
      deployedBytecode: fallbackHandlerDeployment.deployedBytecode ? 'Available' : 'Not available'
    });

    // Get MultiSend deployment
    const multiSendDeployment = getMultiSendDeployment({ version: '1.4.1' });
    console.log('MultiSend Deployment Info:', {
      contractName: multiSendDeployment.contractName,
      version: multiSendDeployment.version,
      abi: multiSendDeployment.abi ? 'Available' : 'Not available',
      bytecode: multiSendDeployment.bytecode ? 'Available' : 'Not available',
      deployedBytecode: multiSendDeployment.deployedBytecode ? 'Available' : 'Not available'
    });

    // Extract bytecode if available
    const bytecodes = {
      safeSingleton: {
        bytecode: safeDeployment.bytecode || null,
        deployedBytecode: safeDeployment.deployedBytecode || null,
        abi: safeDeployment.abi || null
      },
      safeProxyFactory: {
        bytecode: proxyFactoryDeployment.bytecode || null,
        deployedBytecode: proxyFactoryDeployment.deployedBytecode || null,
        abi: proxyFactoryDeployment.abi || null
      },
      fallbackHandler: {
        bytecode: fallbackHandlerDeployment.bytecode || null,
        deployedBytecode: fallbackHandlerDeployment.deployedBytecode || null,
        abi: fallbackHandlerDeployment.abi || null
      },
      multiSend: {
        bytecode: multiSendDeployment.bytecode || null,
        deployedBytecode: multiSendDeployment.deployedBytecode || null,
        abi: multiSendDeployment.abi || null
      }
    };

    // Save to file
    fs.writeFileSync(
      'real-safe-bytecodes.json',
      JSON.stringify(bytecodes, null, 2)
    );

    console.log('Real Safe bytecodes extracted and saved to real-safe-bytecodes.json');
    
    // Output bytecode for immediate use
    if (safeDeployment.bytecode) {
      console.log('\nSafe Singleton Bytecode Length:', safeDeployment.bytecode.length);
      console.log('Safe Singleton Bytecode Preview:', safeDeployment.bytecode.substring(0, 100) + '...');
    }

    if (proxyFactoryDeployment.bytecode) {
      console.log('\nProxy Factory Bytecode Length:', proxyFactoryDeployment.bytecode.length);
      console.log('Proxy Factory Bytecode Preview:', proxyFactoryDeployment.bytecode.substring(0, 100) + '...');
    }

    if (fallbackHandlerDeployment.bytecode) {
      console.log('\nFallback Handler Bytecode Length:', fallbackHandlerDeployment.bytecode.length);
      console.log('Fallback Handler Bytecode Preview:', fallbackHandlerDeployment.bytecode.substring(0, 100) + '...');
    }

    if (multiSendDeployment.bytecode) {
      console.log('\nMultiSend Bytecode Length:', multiSendDeployment.bytecode.length);
      console.log('MultiSend Bytecode Preview:', multiSendDeployment.bytecode.substring(0, 100) + '...');
    }

    return bytecodes;

  } catch (error) {
    console.error('Error extracting Safe bytecodes:', error);
    throw error;
  }
}

getRealSafeBytecode().catch(console.error);