# Task 4: Transaction Management Tools Implementation

## Overview
Implement the core transaction management tools that enable creating, signing, and executing Safe transactions. This cluster is critical for multi-signature coordination and actual blockchain operations.

## API Analysis from Safe SDK

Based on Safe SDK documentation:
- **Transaction Creation**: Uses `SafeTransaction` objects with metadata
- **Signature Collection**: Supports off-chain and on-chain signing
- **Transaction Service**: Enables multi-agent coordination via API
- **Execution**: Handles gas estimation and on-chain submission

## Tools to Implement

### 1. safe_create_transaction
**Purpose**: Create a Safe transaction proposal with proper formatting and validation

**Current Mock Implementation**:
```typescript
// FAKE - returns simulated transaction
return {
  safeTxHash: '0xfake...',
  to: args.to,
  value: args.value,
  data: args.data || '0x'
};
```

**Real Implementation Required**:
```typescript
import Safe, { SafeTransactionDataPartial } from '@safe-global/protocol-kit';
import { OperationType } from '@safe-global/safe-core-sdk-types';
import { BaseToolHandler } from './BaseToolHandler';

export class CreateTransactionTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    to: string;
    value: string; // in wei
    data?: string;
    operation?: 'call' | 'delegatecall';
    safeTxGas?: string;
    baseGas?: string;
    gasPrice?: string;
    gasToken?: string;
    refundReceiver?: string;
    nonce?: number;
    networkId: string;
    privateKey?: string; // Optional for initial signature
  }) {
    try {
      // Connect to Safe
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Prepare transaction data
      const safeTransactionData: SafeTransactionDataPartial = {
        to: args.to,
        value: args.value,
        data: args.data || '0x',
        operation: args.operation === 'delegatecall' 
          ? OperationType.DelegateCall 
          : OperationType.Call,
        safeTxGas: args.safeTxGas,
        baseGas: args.baseGas,
        gasPrice: args.gasPrice,
        gasToken: args.gasToken || '0x0000000000000000000000000000000000000000',
        refundReceiver: args.refundReceiver || '0x0000000000000000000000000000000000000000',
        nonce: args.nonce
      };
      
      // Create Safe transaction
      const safeTransaction = await safeSdk.createTransaction({
        transactions: [safeTransactionData]
      });
      
      // Get transaction hash
      const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
      
      // Optionally sign with provided key
      let signature;
      if (args.privateKey) {
        const signedTx = await safeSdk.signTransaction(safeTransaction);
        signature = signedTx.signatures.get(
          await safeSdk.getAddress()
        )?.data;
      }
      
      // If Transaction Service is available, propose it
      let proposalResult;
      if (await this.isTransactionServiceAvailable(args.networkId)) {
        proposalResult = await this.proposeToService(
          safeSdk,
          safeTransaction,
          safeTxHash,
          args.networkId
        );
      }
      
      return {
        safeTxHash,
        transaction: {
          to: args.to,
          value: args.value,
          data: args.data || '0x',
          operation: args.operation || 'call',
          safeTxGas: safeTransaction.data.safeTxGas,
          baseGas: safeTransaction.data.baseGas,
          gasPrice: safeTransaction.data.gasPrice,
          gasToken: safeTransaction.data.gasToken,
          refundReceiver: safeTransaction.data.refundReceiver,
          nonce: safeTransaction.data.nonce
        },
        signature: signature,
        serviceProposal: proposalResult,
        networkId: args.networkId
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
  
  private async proposeToService(
    safeSdk: Safe,
    transaction: any,
    safeTxHash: string,
    networkId: string
  ) {
    try {
      const apiKit = await this.getSafeApiKit(networkId);
      const senderAddress = await safeSdk.getAddress();
      
      await apiKit.proposeTransaction({
        safeAddress: await safeSdk.getAddress(),
        safeTransactionData: transaction.data,
        safeTxHash,
        senderAddress,
        senderSignature: transaction.signatures.get(senderAddress)?.data || ''
      });
      
      return {
        proposed: true,
        safeTxHash,
        serviceUrl: this.getServiceUrl(networkId)
      };
    } catch (error) {
      console.error('Service proposal failed:', error);
      return null;
    }
  }
}
```

### 2. safe_sign_transaction
**Purpose**: Add signature to existing Safe transaction

**Current Mock Implementation**:
```typescript
// FAKE - accepts private key but never uses it
return {
  safeTxHash: args.safeTxHash,
  signature: '0xfakesignature...',
  signer: '0xfakesigner...'
};
```

**Real Implementation Required**:
```typescript
import Safe from '@safe-global/protocol-kit';
import { ethers } from 'ethers';
import { BaseToolHandler } from './BaseToolHandler';

export class SignTransactionTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    safeTxHash: string;
    networkId: string;
    privateKey: string;
    signatureType?: 'eth_sign' | 'eth_signTypedData';
  }) {
    try {
      // Validate inputs
      if (!ethers.isHexString(args.safeTxHash, 32)) {
        throw new Error('Invalid safeTxHash format');
      }
      
      // Connect to Safe with signer
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Get signer address
      const provider = await ProviderFactory.getProvider(args.networkId);
      const wallet = new ethers.Wallet(args.privateKey, provider);
      const signerAddress = wallet.address;
      
      // Check if signer is owner
      const owners = await safeSdk.getOwners();
      if (!owners.includes(signerAddress)) {
        throw new Error(`${signerAddress} is not an owner of this Safe`);
      }
      
      // Try to get transaction from service first
      let safeTransaction;
      try {
        const apiKit = await this.getSafeApiKit(args.networkId);
        safeTransaction = await apiKit.getTransaction(args.safeTxHash);
      } catch {
        // If not in service, recreate from hash
        // This requires transaction details to be stored or passed
        throw new Error('Transaction not found in service. Please provide transaction details.');
      }
      
      // Sign the transaction
      const signature = await safeSdk.signHash(args.safeTxHash);
      
      // Submit signature to service
      let serviceConfirmation;
      try {
        const apiKit = await this.getSafeApiKit(args.networkId);
        await apiKit.confirmTransaction(args.safeTxHash, signature.data);
        serviceConfirmation = true;
      } catch (error) {
        console.error('Failed to submit to service:', error);
        serviceConfirmation = false;
      }
      
      // Get current signature count
      const confirmations = await this.getConfirmations(
        args.safeTxHash,
        args.networkId
      );
      
      return {
        safeTxHash: args.safeTxHash,
        signature: signature.data,
        signer: signerAddress,
        serviceConfirmation,
        totalSignatures: confirmations.length,
        threshold: await safeSdk.getThreshold(),
        readyToExecute: confirmations.length >= await safeSdk.getThreshold(),
        networkId: args.networkId
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
  
  private async getConfirmations(safeTxHash: string, networkId: string) {
    try {
      const apiKit = await this.getSafeApiKit(networkId);
      const confirmations = await apiKit.getTransactionConfirmations(safeTxHash);
      return confirmations.results;
    } catch {
      return [];
    }
  }
}
```

### 3. safe_execute_transaction
**Purpose**: Execute fully signed Safe transaction on-chain

**Current Mock Implementation**:
```typescript
// FAKE - returns fake transaction hash
return {
  transactionHash: '0xfake...',
  blockNumber: 12345,
  gasUsed: '100000'
};
```

**Real Implementation Required**:
```typescript
import Safe from '@safe-global/protocol-kit';
import { BaseToolHandler } from './BaseToolHandler';

export class ExecuteTransactionTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    safeTxHash: string;
    networkId: string;
    privateKey: string; // Executor's private key
    gasLimit?: string;
    gasPrice?: string;
  }) {
    try {
      // Connect to Safe with executor
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Get transaction from service
      const apiKit = await this.getSafeApiKit(args.networkId);
      let safeTransaction;
      
      try {
        // Fetch transaction with all signatures
        safeTransaction = await apiKit.getTransaction(args.safeTxHash);
        
        // Verify threshold is met
        const threshold = await safeSdk.getThreshold();
        const confirmations = safeTransaction.confirmations || [];
        
        if (confirmations.length < threshold) {
          return {
            error: 'Insufficient signatures',
            required: threshold,
            current: confirmations.length,
            safeTxHash: args.safeTxHash
          };
        }
      } catch (error) {
        throw new Error(`Failed to retrieve transaction: ${error.message}`);
      }
      
      // Execute the transaction
      const executeTxResponse = await safeSdk.executeTransaction(
        safeTransaction,
        {
          gasLimit: args.gasLimit,
          gasPrice: args.gasPrice
        }
      );
      
      // Wait for transaction receipt
      const receipt = await executeTxResponse.transactionResponse?.wait();
      
      return {
        transactionHash: receipt?.hash,
        blockNumber: receipt?.blockNumber,
        blockHash: receipt?.blockHash,
        gasUsed: receipt?.gasUsed?.toString(),
        status: receipt?.status === 1 ? 'success' : 'failed',
        safeTxHash: args.safeTxHash,
        networkId: args.networkId,
        logs: receipt?.logs?.map(log => ({
          address: log.address,
          topics: log.topics,
          data: log.data
        }))
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
}
```

### 4. safe_get_transaction
**Purpose**: Query transaction details and status

**Real Implementation**:
```typescript
export class GetTransactionTool extends BaseToolHandler {
  async execute(args: {
    safeTxHash: string;
    networkId: string;
  }) {
    try {
      const apiKit = await this.getSafeApiKit(args.networkId);
      
      // Get transaction from service
      const transaction = await apiKit.getTransaction(args.safeTxHash);
      
      // Format confirmations
      const confirmations = (transaction.confirmations || []).map(conf => ({
        owner: conf.owner,
        signature: conf.signature,
        signatureType: conf.signatureType,
        submissionDate: conf.submissionDate
      }));
      
      return {
        safeTxHash: args.safeTxHash,
        safe: transaction.safe,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        operation: transaction.operation,
        safeTxGas: transaction.safeTxGas,
        baseGas: transaction.baseGas,
        gasPrice: transaction.gasPrice,
        gasToken: transaction.gasToken,
        refundReceiver: transaction.refundReceiver,
        nonce: transaction.nonce,
        executionDate: transaction.executionDate,
        submissionDate: transaction.submissionDate,
        modified: transaction.modified,
        blockNumber: transaction.blockNumber,
        transactionHash: transaction.transactionHash,
        executor: transaction.executor,
        isExecuted: transaction.isExecuted,
        isSuccessful: transaction.isSuccessful,
        confirmations,
        confirmationsRequired: transaction.confirmationsRequired,
        trusted: transaction.trusted,
        networkId: args.networkId
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
}
```

## Testing Strategy

### Phase 1: SDK Transaction Testing
```typescript
// test-scripts/test-transactions.ts
async function testTransactionFlow() {
  // Create transaction
  const safeSdk = await Safe.init({
    provider: RPC_URL,
    signer: OWNER_1_KEY,
    safeAddress: SAFE_ADDRESS
  });
  
  const safeTransaction = await safeSdk.createTransaction({
    transactions: [{
      to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9b',
      value: '1000000000000000', // 0.001 ETH
      data: '0x'
    }]
  });
  
  // Sign
  const signedTx = await safeSdk.signTransaction(safeTransaction);
  console.log('Signatures:', signedTx.signatures.size);
  
  // Get hash
  const txHash = await safeSdk.getTransactionHash(safeTransaction);
  console.log('Transaction hash:', txHash);
}
```

### Phase 2: MCP Tool Testing
```bash
# Create transaction
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "safe_create_transaction",
    "arguments": {
      "safeAddress": "0x...",
      "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0fA9b",
      "value": "1000000000000000",
      "networkId": "eip155:11155111",
      "privateKey": "0x..."
    }
  },
  "id": 1
}' | npm start

# Sign transaction
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "safe_sign_transaction",
    "arguments": {
      "safeAddress": "0x...",
      "safeTxHash": "0x...",
      "networkId": "eip155:11155111",
      "privateKey": "0x..."
    }
  },
  "id": 2
}' | npm start
```

### Phase 3: Multi-signature Integration Test
```typescript
describe('Transaction Management', () => {
  it('should complete full transaction flow', async () => {
    // Owner 1 creates
    const creation = await createTransaction({
      safeAddress,
      to: recipient,
      value: '1000000000000000',
      networkId: 'eip155:11155111',
      privateKey: owner1Key
    });
    
    expect(creation.safeTxHash).toBeDefined();
    
    // Owner 2 signs
    const signature = await signTransaction({
      safeAddress,
      safeTxHash: creation.safeTxHash,
      networkId: 'eip155:11155111',
      privateKey: owner2Key
    });
    
    expect(signature.totalSignatures).toBe(2);
    expect(signature.readyToExecute).toBe(true);
    
    // Execute
    const execution = await executeTransaction({
      safeAddress,
      safeTxHash: creation.safeTxHash,
      networkId: 'eip155:11155111',
      privateKey: owner1Key
    });
    
    expect(execution.status).toBe('success');
    expect(execution.transactionHash).toBeDefined();
  });
});
```

## Safe Transaction Service Integration

### Service Configuration
```typescript
// src/safe/SafeApiKitFactory.ts
import SafeApiKit from '@safe-global/api-kit';

export class SafeApiKitFactory {
  private static instances: Map<string, SafeApiKit> = new Map();
  
  static async create(networkId: string): Promise<SafeApiKit> {
    if (this.instances.has(networkId)) {
      return this.instances.get(networkId)!;
    }
    
    const chainId = NetworkManager.getChainId(networkId);
    
    const apiKit = new SafeApiKit({
      chainId: BigInt(chainId),
      apiKey: process.env.SAFE_API_KEY // Optional
    });
    
    this.instances.set(networkId, apiKit);
    return apiKit;
  }
}
```

## Common Issues & Solutions

### Issue: "Transaction already exists"
**Solution**: Transaction with same nonce already proposed. Increment nonce or use different parameters.

### Issue: "Insufficient gas"
**Solution**: Increase gas limits or use relay service for gas sponsorship.

### Issue: "Signature verification failed"
**Solution**: Ensure signer is an owner and using correct signing method.

## Success Criteria

- [ ] safe_create_transaction builds valid Safe transactions
- [ ] safe_sign_transaction collects owner signatures
- [ ] safe_execute_transaction successfully executes on-chain
- [ ] safe_get_transaction retrieves accurate status
- [ ] Transaction Service integration works
- [ ] Multi-signature flows complete successfully
- [ ] Gas estimation is accurate
- [ ] Error handling provides clear feedback

## Next Steps
1. Implement owner management tools
2. Add batch transaction support
3. Integrate relay services for gasless transactions
4. Add transaction cancellation capability