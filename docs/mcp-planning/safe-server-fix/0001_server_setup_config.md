# Task 1: Server Foundation & Provider Integration

## Overview
Fix the core infrastructure that all Safe tools depend on. This involves establishing proper blockchain provider connections, fixing the network management system, and setting up the Safe SDK initialization patterns that will be reused across all tools.

## Current Problems
1. **ProviderFactory exists but is disconnected** from the actual tools
2. **Network management uses CAIP-2** format but providers aren't initialized
3. **Safe SDK imports exist** but are never properly instantiated
4. **Mock toggle infrastructure** exists but doesn't activate real implementations

## Implementation Requirements

### 1. Fix ProviderFactory Integration

**Current State** (likely mocked):
```typescript
// src/blockchain/ProviderFactory.ts
export class ProviderFactory {
  static async getProvider(networkId: string): Promise<any> {
    // Returns mock provider
  }
}
```

**Required Implementation**:
```typescript
import { ethers } from 'ethers';
import { NetworkManager } from '../network/NetworkManager';

export class ProviderFactory {
  private static providers: Map<string, ethers.JsonRpcProvider> = new Map();
  
  static async getProvider(networkId: string): Promise<ethers.JsonRpcProvider> {
    // Check cache
    if (this.providers.has(networkId)) {
      return this.providers.get(networkId)!;
    }
    
    // Get RPC URL from NetworkManager
    const rpcUrl = await NetworkManager.getRpcUrl(networkId);
    if (!rpcUrl) {
      throw new Error(`No RPC URL configured for network ${networkId}`);
    }
    
    // Create and cache provider
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    this.providers.set(networkId, provider);
    
    // Validate connection
    try {
      await provider.getNetwork();
    } catch (error) {
      this.providers.delete(networkId);
      throw new Error(`Failed to connect to network ${networkId}: ${error.message}`);
    }
    
    return provider;
  }
  
  static clearCache(networkId?: string): void {
    if (networkId) {
      this.providers.delete(networkId);
    } else {
      this.providers.clear();
    }
  }
}
```

### 2. Create SafeSDKFactory

**New File Required**: `src/safe/SafeSDKFactory.ts`
```typescript
import Safe, { SafeFactory, SafeAccountConfig, EthersAdapter } from '@safe-global/protocol-kit';
import { ethers } from 'ethers';
import { ProviderFactory } from '../blockchain/ProviderFactory';

export class SafeSDKFactory {
  /**
   * Create a SafeFactory instance for deploying new Safes
   */
  static async createSafeFactory(
    networkId: string,
    signerKey?: string
  ): Promise<SafeFactory> {
    const provider = await ProviderFactory.getProvider(networkId);
    
    // Create signer if private key provided
    const signer = signerKey 
      ? new ethers.Wallet(signerKey, provider)
      : provider; // Read-only mode
    
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: signer
    });
    
    const safeFactory = await SafeFactory.create({ 
      ethAdapter,
      // Contract addresses will be auto-detected from safe-deployments
    });
    
    return safeFactory;
  }
  
  /**
   * Connect to existing Safe
   */
  static async createSafeSDK(
    networkId: string,
    safeAddress: string,
    signerKey?: string
  ): Promise<Safe> {
    const provider = await ProviderFactory.getProvider(networkId);
    
    const signer = signerKey 
      ? new ethers.Wallet(signerKey, provider)
      : undefined;
    
    const safeSdk = await Safe.init({
      provider: provider.connection.url,
      signer: signerKey,
      safeAddress
    });
    
    return safeSdk;
  }
}
```

### 3. Update NetworkManager

**File**: `src/network/NetworkManager.ts`
```typescript
export class NetworkManager {
  // Network ID to chain ID mapping
  private static NETWORK_MAPPING: Record<string, number> = {
    'eip155:1': 1,        // Ethereum Mainnet
    'eip155:137': 137,    // Polygon
    'eip155:42161': 42161, // Arbitrum One
    'eip155:11155111': 11155111, // Sepolia
    'eip155:100': 100,    // Gnosis Chain
    'eip155:8453': 8453,  // Base
    'eip155:10': 10,      // Optimism
  };
  
  static async getRpcUrl(networkId: string): Promise<string | undefined> {
    // Try environment variable first
    const envKey = `SAFE_RPC_${networkId.replace(':', '_').toUpperCase()}`;
    const envUrl = process.env[envKey];
    if (envUrl) return envUrl;
    
    // Fallback to public RPCs (for development)
    const publicRpcs: Record<string, string> = {
      'eip155:11155111': 'https://sepolia.infura.io/v3/YOUR_KEY',
      'eip155:1': 'https://eth.llamarpc.com',
      // Add more public RPCs
    };
    
    return publicRpcs[networkId];
  }
  
  static getChainId(networkId: string): number {
    const chainId = this.NETWORK_MAPPING[networkId];
    if (!chainId) {
      throw new Error(`Unknown network ID: ${networkId}`);
    }
    return chainId;
  }
  
  static isSupported(networkId: string): boolean {
    return networkId in this.NETWORK_MAPPING;
  }
}
```

### 4. Create Base Tool Handler

**New File**: `src/mcp/tools/BaseToolHandler.ts`
```typescript
import { SafeSDKFactory } from '../../safe/SafeSDKFactory';
import { NetworkManager } from '../../network/NetworkManager';

export abstract class BaseToolHandler {
  protected async validateNetwork(networkId: string): Promise<void> {
    if (!NetworkManager.isSupported(networkId)) {
      throw new Error(`Unsupported network: ${networkId}`);
    }
  }
  
  protected async getSafeFactory(networkId: string, privateKey?: string) {
    await this.validateNetwork(networkId);
    return SafeSDKFactory.createSafeFactory(networkId, privateKey);
  }
  
  protected async getSafeSDK(
    networkId: string, 
    safeAddress: string, 
    privateKey?: string
  ) {
    await this.validateNetwork(networkId);
    return SafeSDKFactory.createSafeSDK(networkId, safeAddress, privateKey);
  }
  
  protected formatError(error: any): { error: string; details?: any } {
    if (error.reason) {
      return { error: error.reason, details: error.data };
    }
    return { error: error.message || 'Unknown error' };
  }
}
```

## Testing Strategy

### Phase 1: Direct Provider Testing
```typescript
// test-scripts/test-provider.ts
import { ProviderFactory } from '../src/blockchain/ProviderFactory';

async function testProvider() {
  // Test Sepolia connection
  const provider = await ProviderFactory.getProvider('eip155:11155111');
  const network = await provider.getNetwork();
  console.log('Connected to:', network.name, network.chainId);
  
  // Test block number
  const blockNumber = await provider.getBlockNumber();
  console.log('Current block:', blockNumber);
}

testProvider().catch(console.error);
```

### Phase 2: Safe SDK Testing
```typescript
// test-scripts/test-safe-sdk.ts
import { SafeSDKFactory } from '../src/safe/SafeSDKFactory';

async function testSafeSDK() {
  // Test SafeFactory creation
  const factory = await SafeSDKFactory.createSafeFactory('eip155:11155111');
  console.log('SafeFactory created successfully');
  
  // Test predictable address
  const config = {
    owners: ['0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9b'],
    threshold: 1
  };
  
  const predictedAddress = await factory.predictSafeAddress(config);
  console.log('Predicted Safe address:', predictedAddress);
}

testSafeSDK().catch(console.error);
```

### Phase 3: MCP Tool Testing
```bash
# Test network validation
echo '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"safe_get_info","arguments":{"address":"0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9b","networkId":"eip155:11155111"}},"id":1}' | npm start
```

## Environment Setup

### Required `.env` Configuration
```bash
# Sepolia (for testing)
SAFE_RPC_EIP155_11155111=https://sepolia.infura.io/v3/YOUR_KEY

# Mainnet (production)
SAFE_RPC_EIP155_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY

# Polygon
SAFE_RPC_EIP155_137=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# Enable real tools
USE_REAL_TOOLS=true
```

## Local Testing Setup

### Hardhat Configuration
```javascript
// hardhat.config.js
module.exports = {
  networks: {
    hardhat: {
      chainId: 31337,
      forking: {
        url: process.env.SAFE_RPC_EIP155_11155111,
        blockNumber: 4900000 // Recent Sepolia block
      }
    }
  }
};
```

### Deploy Safe Contracts Locally
```typescript
// test-scripts/deploy-safe-local.ts
import { ethers } from 'hardhat';
import { getSafeL2SingletonDeployment } from '@safe-global/safe-deployments';

async function deployLocalSafe() {
  const deployment = getSafeL2SingletonDeployment();
  
  // Deploy Safe singleton
  const SafeContract = await ethers.getContractFactory(
    deployment.abi,
    deployment.bytecode
  );
  
  const safe = await SafeContract.deploy();
  await safe.deployed();
  
  console.log('Safe deployed to:', safe.address);
}
```

## Success Criteria

- [ ] ProviderFactory successfully connects to networks
- [ ] SafeSDKFactory creates SafeFactory instances
- [ ] SafeSDKFactory connects to existing Safes
- [ ] NetworkManager properly maps CAIP-2 to chain IDs
- [ ] BaseToolHandler provides reusable SDK patterns
- [ ] Environment variables properly configure RPC URLs
- [ ] Local Hardhat testing environment works
- [ ] Error handling provides clear feedback

## Dependencies
- `@safe-global/protocol-kit` - Already installed
- `@safe-global/safe-deployments` - Already installed
- `ethers` - Already installed
- `hardhat` - Need to install for local testing

## Common Issues & Solutions

### Issue: "Cannot find Safe deployment for network"
**Solution**: Network might not have Safe deployed. Check safe-deployments package for supported networks.

### Issue: "Provider connection timeout"
**Solution**: Check RPC URL validity and API key. Some providers require authentication.

### Issue: "Signer required for this operation"
**Solution**: Some operations need a private key. Ensure proper key management.

## Next Steps
After this foundation is complete:
1. Implement `safe_get_info` tool using real SDK
2. Test with MCP Inspector
3. Move to wallet deployment tools
4. Continue with transaction management