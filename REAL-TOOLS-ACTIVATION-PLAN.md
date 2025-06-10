# Real Tools Activation Plan

## Overview

This plan outlines the steps to activate real blockchain operations for the SAFE MCP Server, moving from mock implementations to actual Safe wallet interactions.

## Phase 1: Local Test Environment Setup

### Task 24: Set up local blockchain test environment with Hardhat
**Duration:** 4-6 hours
**Priority:** High

#### Objectives:
- Create deterministic local blockchain for testing
- Fast transaction confirmation (no waiting for network blocks)
- Predictable test accounts with known private keys
- Safe contract deployment automation

#### Implementation Steps:

1. **Install Hardhat Development Environment**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init # Choose TypeScript project
   ```

2. **Configure Hardhat for Safe Development**
   ```typescript
   // hardhat.config.ts
   import { HardhatUserConfig } from "hardhat/config";
   
   const config: HardhatUserConfig = {
     solidity: "0.8.19",
     networks: {
       localhost: {
         url: "http://127.0.0.1:8545",
         chainId: 31337,
         accounts: "remote" // Use Hardhat's test accounts
       }
     },
     paths: {
       sources: "./contracts",
       tests: "./test/hardhat",
       cache: "./cache",
       artifacts: "./artifacts"
     }
   };
   ```

3. **Create Test Network Scripts**
   ```bash
   # scripts/start-local-network.sh
   #!/bin/bash
   npx hardhat node --hostname 0.0.0.0 --port 8545
   ```

4. **Add Local Network to Provider Factory**
   ```typescript
   // Add eip155:31337 support for Hardhat local network
   'eip155:31337': 'http://127.0.0.1:8545'
   ```

### Task 25: Deploy Safe contracts to local blockchain  
**Duration:** 6-8 hours
**Priority:** High

#### Objectives:
- Deploy official Safe contract infrastructure
- Set up Safe factory and proxy contracts
- Create reproducible deployment scripts
- Verify contract addresses and functionality

#### Implementation Steps:

1. **Install Safe Contract Dependencies**
   ```bash
   npm install --save-dev @safe-global/safe-contracts
   ```

2. **Create Safe Deployment Script**
   ```typescript
   // scripts/deploy-safe-contracts.ts
   import { ethers } from "hardhat";
   import { SafeL2__factory, SafeProxyFactory__factory } from "@safe-global/safe-contracts";
   
   async function deploySafeContracts() {
     const [deployer] = await ethers.getSigners();
     
     // Deploy Safe Singleton (L2 version for lower gas)
     const safeSingleton = await new SafeL2__factory(deployer).deploy();
     await safeSingleton.waitForDeployment();
     
     // Deploy Safe Proxy Factory
     const proxyFactory = await new SafeProxyFactory__factory(deployer).deploy();
     await proxyFactory.waitForDeployment();
     
     // Save addresses for tests
     const addresses = {
       safeSingleton: await safeSingleton.getAddress(),
       proxyFactory: await proxyFactory.getAddress(),
       deployer: deployer.address
     };
     
     console.log("Safe contracts deployed:", addresses);
     return addresses;
   }
   ```

3. **Create Contract Registry for Local Network**
   ```typescript
   // Update ContractRegistry.ts to include local addresses
   private getLocalNetworkAddresses(): NetworkAddresses {
     return {
       safeSingleton: process.env.LOCAL_SAFE_SINGLETON || "0x...",
       proxyFactory: process.env.LOCAL_PROXY_FACTORY || "0x...",
       // ... other contracts
     };
   }
   ```

### Task 26: Create test account management and private key utilities
**Duration:** 3-4 hours  
**Priority:** High

#### Objectives:
- Secure test private key management
- Multiple test accounts for multi-sig scenarios
- Balance management and funding utilities
- Account derivation from mnemonic

#### Implementation Steps:

1. **Create Test Account Manager**
   ```typescript
   // src/test/TestAccountManager.ts
   export class TestAccountManager {
     private accounts: TestAccount[] = [];
     
     constructor(private provider: JsonRpcProvider) {}
     
     async getTestAccounts(count: number = 10): Promise<TestAccount[]> {
       // Use Hardhat's deterministic accounts
       const accounts = await this.provider.listAccounts();
       return accounts.slice(0, count).map((addr, i) => ({
         address: addr,
         privateKey: this.getHardhatPrivateKey(i),
         balance: "10000.0" // 10k ETH on local network
       }));
     }
     
     private getHardhatPrivateKey(index: number): string {
       // Hardhat's deterministic private keys
       const keys = [
         "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
         "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
         // ... more keys
       ];
       return keys[index] || keys[0];
     }
   }
   ```

2. **Create Test Utilities**
   ```typescript
   // src/test/TestUtils.ts
   export class TestUtils {
     static async fundAccount(
       provider: JsonRpcProvider,
       toAddress: string,
       amount: string = "100.0"
     ): Promise<void> {
       const [funder] = await provider.listAccounts();
       await funder.sendTransaction({
         to: toAddress,
         value: parseEther(amount)
       });
     }
     
     static async deployTestSafe(
       owners: string[],
       threshold: number = 1
     ): Promise<{ address: string; safe: Safe }> {
       // Safe deployment helper for tests
     }
   }
   ```

## Phase 2: Safe SDK Integration Fix

### Task 27: Fix Safe SDK compatibility issues and activate real tools
**Duration:** 8-12 hours
**Priority:** High

#### Objectives:
- Resolve Safe SDK TypeScript compatibility issues
- Fix import/export problems with Safe Global packages
- Create working real tool implementations
- Maintain backward compatibility with mock tools

#### Implementation Steps:

1. **Research Safe SDK API Changes**
   ```bash
   # Check installed versions and documentation
   npm list @safe-global/protocol-kit @safe-global/api-kit
   # Study official examples: https://github.com/safe-global/safe-core-sdk
   ```

2. **Create Compatibility Layer**
   ```typescript
   // src/blockchain/SafeSDKAdapter.ts
   export class SafeSDKAdapter {
     async createSafe(config: SafeAccountConfig): Promise<Safe> {
       // Handle version-specific API differences
       if (this.isV1API()) {
         return Safe.create({ ethAdapter, safeAddress });
       } else {
         return Safe.init({ ethAdapter, safeAddress });
       }
     }
     
     async createFactory(ethAdapter: EthersAdapter): Promise<SafeFactory> {
       // Similar version handling for SafeFactory
     }
   }
   ```

3. **Fix Real Tool Implementations**
   ```bash
   # Restore and fix real implementations
   mv src/mcp/tools/RealWalletCreationTools.ts.bak src/mcp/tools/RealWalletCreationTools.ts
   mv src/mcp/tools/RealWalletQueryTools.ts.bak src/mcp/tools/RealWalletQueryTools.ts
   mv src/mcp/tools/RealTransactionTools.ts.bak src/mcp/tools/RealTransactionTools.ts
   ```

4. **Implement Tool Toggle System**
   ```typescript
   // Allow switching between mock and real tools via environment
   export class SafeMultisigServer {
     private initializeTools(): void {
       const useRealTools = process.env.USE_REAL_TOOLS === 'true';
       
       if (useRealTools) {
         this.initializeRealTools();
       } else {
         this.initializeMockTools();
       }
     }
   }
   ```

## Phase 3: Integration Testing

### Task 28: Create comprehensive integration test suite with real Safe operations
**Duration:** 6-8 hours
**Priority:** High

#### Objectives:
- End-to-end testing with real Safe deployments
- Multi-signature workflow testing
- Transaction execution verification
- Network failover testing

#### Implementation Steps:

1. **Create Integration Test Framework**
   ```typescript
   // test/integration/SafeIntegration.test.ts
   describe('Safe MCP Server Integration', () => {
     let testAccounts: TestAccount[];
     let server: SafeMultisigServer;
     let localProvider: JsonRpcProvider;
     
     beforeAll(async () => {
       // Start local network
       // Deploy Safe contracts
       // Set up test accounts
     });
     
     describe('Real Safe Operations', () => {
       test('should deploy new Safe wallet', async () => {
         // Test real Safe deployment
       });
       
       test('should execute multi-sig transaction', async () => {
         // Test transaction with multiple signatures
       });
     });
   });
   ```

2. **Create Test Scenarios**
   ```typescript
   // test/scenarios/
   // - SingleOwnerSafe.test.ts
   // - MultiSigWallet.test.ts  
   // - TransactionExecution.test.ts
   // - OwnerManagement.test.ts
   // - NetworkFailover.test.ts
   ```

### Task 29: Implement local development workflow and testing scripts
**Duration:** 4-6 hours
**Priority:** Medium

#### Objectives:
- Streamlined developer experience
- Automated test environment setup
- Easy switching between mock and real modes
- Documentation for developers

#### Implementation Steps:

1. **Create Development Scripts**
   ```json
   // package.json scripts
   {
     "dev:local": "concurrently \"npm run hardhat:node\" \"npm run dev:server\"",
     "hardhat:node": "npx hardhat node",
     "dev:server": "USE_REAL_TOOLS=true npm start",
     "test:integration": "USE_REAL_TOOLS=true npm test -- --testPathPattern=integration",
     "deploy:local": "npx hardhat run scripts/deploy-safe-contracts.ts --network localhost"
   }
   ```

2. **Create Docker Development Environment**
   ```dockerfile
   # docker-compose.yml for consistent environment
   version: '3.8'
   services:
     hardhat:
       image: node:18
       command: npx hardhat node --hostname 0.0.0.0
       ports:
         - "8545:8545"
     
     mcp-server:
       build: .
       environment:
         - USE_REAL_TOOLS=true
         - SAFE_RPC_EIP155_31337=http://hardhat:8545
       depends_on:
         - hardhat
   ```

## Phase 4: Production Deployment Strategy

### Task 30: Create production deployment strategy
**Duration:** 4-6 hours
**Priority:** Medium

#### Objectives:
- Staging environment setup
- Production configuration management
- Monitoring and observability
- Rollback procedures

#### Implementation Steps:

1. **Environment Configuration Strategy**
   ```typescript
   // src/config/EnvironmentConfig.ts
   export class EnvironmentConfig {
     static getConfig(): SafeConfig {
       switch (process.env.NODE_ENV) {
         case 'development':
           return this.getDevelopmentConfig();
         case 'staging':
           return this.getStagingConfig();
         case 'production':
           return this.getProductionConfig();
         default:
           return this.getMockConfig();
       }
     }
   }
   ```

2. **Production Monitoring**
   ```typescript
   // Add structured logging and metrics
   import { Logger } from 'winston';
   
   export class SafeOperationLogger {
     static logSafeDeployment(address: string, networkId: string) {
       logger.info('Safe deployed', { address, networkId });
     }
     
     static logTransactionExecution(txHash: string, safeAddress: string) {
       logger.info('Transaction executed', { txHash, safeAddress });
     }
   }
   ```

## Execution Timeline

**Week 1:**
- Days 1-2: Tasks 24-25 (Local environment + Safe contracts)
- Days 3-4: Task 26 (Account management)
- Day 5: Task 27 start (SDK compatibility)

**Week 2:**
- Days 1-2: Task 27 completion (Real tools activation)
- Days 3-4: Task 28 (Integration testing)
- Day 5: Tasks 29-30 (Development workflow + deployment)

## Success Criteria

✅ **Local Development Environment**
- Hardhat network running with deployed Safe contracts
- Test accounts with known private keys
- Automated contract deployment

✅ **Real Tool Integration**  
- All MCP tools working with actual Safe SDK
- Successful Safe wallet deployments
- Real transaction execution

✅ **Testing Coverage**
- End-to-end integration tests passing
- Multi-signature workflows verified
- Network switching functionality

✅ **Production Readiness**
- Environment-specific configurations
- Monitoring and logging in place
- Deployment procedures documented

## Risk Mitigation

**Safe SDK Compatibility Issues:**
- Create compatibility layer for API changes
- Maintain mock tools as fallback
- Version pinning for stable builds

**Local Network Complexity:**
- Use Docker for environment consistency
- Automated setup scripts
- Clear documentation and troubleshooting

**Integration Test Reliability:**
- Deterministic test data
- Proper test isolation
- Retry mechanisms for network operations

This plan provides a structured approach to activating real blockchain operations while maintaining the robust foundation already built.