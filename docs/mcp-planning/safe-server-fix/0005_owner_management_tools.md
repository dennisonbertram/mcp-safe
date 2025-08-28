# Task 5: Owner Management Tools Implementation

## Overview
Implement tools for managing Safe owners and signature thresholds. These are critical administrative functions that allow Safe wallets to evolve their security model over time.

## API Analysis from Safe SDK

Based on Safe documentation:
- **Owner Operations**: Add, remove, and swap owners require multi-signature approval
- **Threshold Changes**: Modifying signature requirements is a sensitive operation
- **Transaction Pattern**: All changes go through the standard Safe transaction flow
- **Validation**: SDK provides built-in validation for owner operations

## Tools to Implement

### 1. safe_add_owner
**Purpose**: Add a new owner to the Safe with optional threshold update

**Current Mock Implementation**:
```typescript
// FAKE - returns simulated success
return {
  success: true,
  newOwner: args.ownerAddress,
  message: 'Mock: Owner added'
};
```

**Real Implementation Required**:
```typescript
import Safe from '@safe-global/protocol-kit';
import { BaseToolHandler } from './BaseToolHandler';

export class AddOwnerTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    ownerAddress: string;
    threshold?: number; // New threshold (optional)
    networkId: string;
    privateKey: string; // Current owner's key
    executeDirectly?: boolean; // If true and threshold met, execute
  }) {
    try {
      // Validate new owner address
      if (!ethers.isAddress(args.ownerAddress)) {
        throw new Error('Invalid owner address');
      }
      
      // Connect to Safe
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Get current owners and threshold
      const currentOwners = await safeSdk.getOwners();
      const currentThreshold = await safeSdk.getThreshold();
      
      // Check if already an owner
      if (currentOwners.includes(args.ownerAddress)) {
        return {
          error: 'Address is already an owner',
          currentOwners,
          address: args.ownerAddress
        };
      }
      
      // Determine new threshold
      let newThreshold = args.threshold;
      if (!newThreshold) {
        // Default: maintain current threshold or increment if adding first owner
        newThreshold = Math.min(
          currentThreshold,
          currentOwners.length + 1
        );
      }
      
      // Validate new threshold
      const newOwnerCount = currentOwners.length + 1;
      if (newThreshold > newOwnerCount) {
        throw new Error(
          `Threshold (${newThreshold}) cannot exceed number of owners (${newOwnerCount})`
        );
      }
      if (newThreshold < 1) {
        throw new Error('Threshold must be at least 1');
      }
      
      // Create add owner transaction
      const safeTransaction = await safeSdk.createAddOwnerTx({
        ownerAddress: args.ownerAddress,
        threshold: newThreshold
      });
      
      // Get transaction hash
      const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
      
      // Sign the transaction
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      
      // Propose to service
      let serviceProposal;
      if (await this.isTransactionServiceAvailable(args.networkId)) {
        const apiKit = await this.getSafeApiKit(args.networkId);
        const senderAddress = await this.getSignerAddress(args.privateKey);
        
        await apiKit.proposeTransaction({
          safeAddress: args.safeAddress,
          safeTransactionData: safeTransaction.data,
          safeTxHash,
          senderAddress,
          senderSignature: signedTx.signatures.get(senderAddress)?.data || ''
        });
        
        serviceProposal = {
          proposed: true,
          safeTxHash
        };
      }
      
      // Execute if requested and threshold is 1
      let execution;
      if (args.executeDirectly && currentThreshold === 1) {
        const executeTx = await safeSdk.executeTransaction(signedTx);
        const receipt = await executeTx.transactionResponse?.wait();
        
        execution = {
          executed: true,
          transactionHash: receipt?.hash,
          blockNumber: receipt?.blockNumber
        };
      }
      
      return {
        safeTxHash,
        operation: 'addOwner',
        ownerAddress: args.ownerAddress,
        newThreshold,
        previousThreshold: currentThreshold,
        previousOwners: currentOwners,
        newOwnerCount: newOwnerCount,
        serviceProposal,
        execution,
        networkId: args.networkId
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
}
```

### 2. safe_remove_owner
**Purpose**: Remove an existing owner from the Safe

**Current Mock Implementation**:
```typescript
// FAKE - returns simulated removal
return {
  success: true,
  removedOwner: args.ownerAddress,
  message: 'Mock: Owner removed'
};
```

**Real Implementation Required**:
```typescript
export class RemoveOwnerTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    ownerAddress: string;
    threshold?: number; // New threshold (must be <= remaining owners)
    networkId: string;
    privateKey: string;
    executeDirectly?: boolean;
  }) {
    try {
      // Connect to Safe
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Get current state
      const currentOwners = await safeSdk.getOwners();
      const currentThreshold = await safeSdk.getThreshold();
      
      // Validate owner exists
      if (!currentOwners.includes(args.ownerAddress)) {
        return {
          error: 'Address is not an owner',
          currentOwners,
          address: args.ownerAddress
        };
      }
      
      // Check minimum owners
      if (currentOwners.length <= 1) {
        throw new Error('Cannot remove last owner');
      }
      
      // Determine new threshold
      const remainingOwners = currentOwners.length - 1;
      let newThreshold = args.threshold;
      
      if (!newThreshold) {
        // Auto-adjust: maintain threshold or reduce if necessary
        newThreshold = Math.min(currentThreshold, remainingOwners);
      }
      
      // Validate new threshold
      if (newThreshold > remainingOwners) {
        throw new Error(
          `Threshold (${newThreshold}) cannot exceed remaining owners (${remainingOwners})`
        );
      }
      if (newThreshold < 1) {
        throw new Error('Threshold must be at least 1');
      }
      
      // Find previous owner in the linked list
      const ownerIndex = currentOwners.indexOf(args.ownerAddress);
      const prevOwner = ownerIndex > 0 
        ? currentOwners[ownerIndex - 1]
        : '0x0000000000000000000000000000000000000001'; // Sentinel
      
      // Create remove owner transaction
      const safeTransaction = await safeSdk.createRemoveOwnerTx({
        ownerAddress: args.ownerAddress,
        threshold: newThreshold
      });
      
      // Sign and process
      const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      
      // Check if removing self
      const signerAddress = await this.getSignerAddress(args.privateKey);
      const isRemovingSelf = signerAddress === args.ownerAddress;
      
      if (isRemovingSelf && currentThreshold > 1) {
        console.warn('Warning: Removing self as owner. Transaction will need other owners to execute.');
      }
      
      // Propose to service
      let serviceProposal;
      if (await this.isTransactionServiceAvailable(args.networkId)) {
        serviceProposal = await this.proposeToService(
          safeSdk,
          safeTransaction,
          safeTxHash,
          args.networkId
        );
      }
      
      // Execute if conditions met
      let execution;
      if (args.executeDirectly && currentThreshold === 1 && !isRemovingSelf) {
        const executeTx = await safeSdk.executeTransaction(signedTx);
        const receipt = await executeTx.transactionResponse?.wait();
        
        execution = {
          executed: true,
          transactionHash: receipt?.hash
        };
      }
      
      return {
        safeTxHash,
        operation: 'removeOwner',
        removedOwner: args.ownerAddress,
        newThreshold,
        previousThreshold: currentThreshold,
        remainingOwners: remainingOwners,
        isRemovingSelf,
        serviceProposal,
        execution,
        networkId: args.networkId
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
}
```

### 3. safe_swap_owner
**Purpose**: Replace one owner with another in a single transaction

**Real Implementation**:
```typescript
export class SwapOwnerTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    oldOwnerAddress: string;
    newOwnerAddress: string;
    networkId: string;
    privateKey: string;
    executeDirectly?: boolean;
  }) {
    try {
      // Validate addresses
      if (!ethers.isAddress(args.newOwnerAddress)) {
        throw new Error('Invalid new owner address');
      }
      
      // Connect to Safe
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Get current owners
      const currentOwners = await safeSdk.getOwners();
      
      // Validate old owner exists
      if (!currentOwners.includes(args.oldOwnerAddress)) {
        return {
          error: 'Old address is not an owner',
          currentOwners,
          address: args.oldOwnerAddress
        };
      }
      
      // Check new owner not already present
      if (currentOwners.includes(args.newOwnerAddress)) {
        return {
          error: 'New address is already an owner',
          currentOwners,
          address: args.newOwnerAddress
        };
      }
      
      // Find previous owner in linked list
      const ownerIndex = currentOwners.indexOf(args.oldOwnerAddress);
      const prevOwner = ownerIndex > 0
        ? currentOwners[ownerIndex - 1]
        : '0x0000000000000000000000000000000000000001';
      
      // Create swap owner transaction
      const safeTransaction = await safeSdk.createSwapOwnerTx({
        oldOwnerAddress: args.oldOwnerAddress,
        newOwnerAddress: args.newOwnerAddress
      });
      
      // Process transaction
      const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      
      // Check if swapping self
      const signerAddress = await this.getSignerAddress(args.privateKey);
      const isSwappingSelf = signerAddress === args.oldOwnerAddress;
      
      // Propose and potentially execute
      const result = await this.processOwnerTransaction(
        safeSdk,
        safeTransaction,
        safeTxHash,
        args.networkId,
        args.executeDirectly && !isSwappingSelf
      );
      
      return {
        safeTxHash,
        operation: 'swapOwner',
        oldOwner: args.oldOwnerAddress,
        newOwner: args.newOwnerAddress,
        isSwappingSelf,
        currentOwners,
        ...result
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
}
```

### 4. safe_change_threshold
**Purpose**: Modify the number of required signatures

**Real Implementation**:
```typescript
export class ChangeThresholdTool extends BaseToolHandler {
  async execute(args: {
    safeAddress: string;
    threshold: number;
    networkId: string;
    privateKey: string;
    executeDirectly?: boolean;
  }) {
    try {
      // Connect to Safe
      const safeSdk = await this.getSafeSDK(
        args.networkId,
        args.safeAddress,
        args.privateKey
      );
      
      // Get current state
      const currentThreshold = await safeSdk.getThreshold();
      const owners = await safeSdk.getOwners();
      
      // Validate new threshold
      if (args.threshold < 1) {
        throw new Error('Threshold must be at least 1');
      }
      if (args.threshold > owners.length) {
        throw new Error(
          `Threshold (${args.threshold}) cannot exceed number of owners (${owners.length})`
        );
      }
      
      // Check if change needed
      if (args.threshold === currentThreshold) {
        return {
          message: 'Threshold already set to requested value',
          threshold: currentThreshold,
          owners: owners.length
        };
      }
      
      // Create change threshold transaction
      const safeTransaction = await safeSdk.createChangeThresholdTx(
        args.threshold
      );
      
      // Process transaction
      const safeTxHash = await safeSdk.getTransactionHash(safeTransaction);
      const signedTx = await safeSdk.signTransaction(safeTransaction);
      
      // Determine risk level
      const isIncreasing = args.threshold > currentThreshold;
      const riskLevel = isIncreasing ? 'low' : 'high';
      
      // Propose to service
      let serviceProposal;
      if (await this.isTransactionServiceAvailable(args.networkId)) {
        serviceProposal = await this.proposeToService(
          safeSdk,
          safeTransaction,
          safeTxHash,
          args.networkId
        );
      }
      
      // Execute if appropriate
      let execution;
      if (args.executeDirectly && currentThreshold === 1) {
        const executeTx = await safeSdk.executeTransaction(signedTx);
        const receipt = await executeTx.transactionResponse?.wait();
        
        execution = {
          executed: true,
          transactionHash: receipt?.hash
        };
      }
      
      return {
        safeTxHash,
        operation: 'changeThreshold',
        newThreshold: args.threshold,
        previousThreshold: currentThreshold,
        owners: owners.length,
        isIncreasing,
        riskLevel,
        serviceProposal,
        execution,
        networkId: args.networkId
      };
      
    } catch (error) {
      return this.formatError(error);
    }
  }
}
```

## Testing Strategy

### Phase 1: SDK Owner Operations
```typescript
// test-scripts/test-owner-management.ts
async function testOwnerOperations() {
  const safeSdk = await Safe.init({
    provider: RPC_URL,
    signer: OWNER_KEY,
    safeAddress: SAFE_ADDRESS
  });
  
  // Test add owner
  const addOwnerTx = await safeSdk.createAddOwnerTx({
    ownerAddress: NEW_OWNER,
    threshold: 2
  });
  console.log('Add owner tx created');
  
  // Test remove owner
  const removeOwnerTx = await safeSdk.createRemoveOwnerTx({
    ownerAddress: OLD_OWNER,
    threshold: 1
  });
  console.log('Remove owner tx created');
  
  // Test threshold change
  const changeThresholdTx = await safeSdk.createChangeThresholdTx(3);
  console.log('Change threshold tx created');
}
```

### Phase 2: MCP Tool Testing
```bash
# Add owner
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "safe_add_owner",
    "arguments": {
      "safeAddress": "0x...",
      "ownerAddress": "0xNewOwner...",
      "threshold": 2,
      "networkId": "eip155:11155111",
      "privateKey": "0x..."
    }
  },
  "id": 1
}' | npm start

# Change threshold
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "safe_change_threshold",
    "arguments": {
      "safeAddress": "0x...",
      "threshold": 3,
      "networkId": "eip155:11155111",
      "privateKey": "0x..."
    }
  },
  "id": 2
}' | npm start
```

### Phase 3: Integration Testing
```typescript
describe('Owner Management', () => {
  it('should add owner and update threshold', async () => {
    const result = await addOwner({
      safeAddress,
      ownerAddress: newOwner,
      threshold: 2,
      networkId: 'eip155:11155111',
      privateKey: ownerKey
    });
    
    expect(result.safeTxHash).toBeDefined();
    expect(result.newThreshold).toBe(2);
    expect(result.newOwnerCount).toBe(3);
  });
  
  it('should prevent invalid threshold', async () => {
    await expect(changeThreshold({
      safeAddress,
      threshold: 5, // More than owners
      networkId: 'eip155:11155111',
      privateKey: ownerKey
    })).rejects.toThrow('cannot exceed number of owners');
  });
  
  it('should handle self-removal warning', async () => {
    const result = await removeOwner({
      safeAddress,
      ownerAddress: signerAddress, // Removing self
      networkId: 'eip155:11155111',
      privateKey: ownerKey
    });
    
    expect(result.isRemovingSelf).toBe(true);
    expect(result.execution).toBeUndefined(); // Should not auto-execute
  });
});
```

## Security Considerations

### Validation Rules
1. **Threshold Constraints**: Always 1 <= threshold <= owners.length
2. **Owner Uniqueness**: No duplicate owners allowed
3. **Minimum Owners**: At least one owner must remain
4. **Self-Operations**: Special handling for owners modifying themselves

### Risk Assessment
```typescript
function assessOwnerOperationRisk(operation: any): string {
  if (operation.type === 'removeOwner' && operation.isRemovingSelf) {
    return 'CRITICAL: Removing self as owner';
  }
  if (operation.type === 'changeThreshold' && operation.newThreshold === 1) {
    return 'HIGH: Single signature control';
  }
  if (operation.type === 'addOwner' && operation.newOwnerCount > 5) {
    return 'MEDIUM: Large number of owners may complicate operations';
  }
  return 'LOW: Standard operation';
}
```

## Common Issues & Solutions

### Issue: "Cannot remove last owner"
**Solution**: Safe must always have at least one owner. Add new owner before removing last one.

### Issue: "Threshold exceeds owner count"
**Solution**: Reduce threshold before removing owners, or remove owners after reducing threshold.

### Issue: "Owner not found in list"
**Solution**: Verify address is correctly checksummed and actually an owner.

## Success Criteria

- [ ] safe_add_owner successfully adds new owners
- [ ] safe_remove_owner safely removes owners with validation
- [ ] safe_swap_owner atomically replaces owners
- [ ] safe_change_threshold updates signature requirements
- [ ] All operations create valid Safe transactions
- [ ] Service integration works for multi-sig coordination
- [ ] Self-operation edge cases handled properly
- [ ] Threshold validation prevents invalid states

## Next Steps
1. Implement module management tools
2. Add batch owner operations
3. Implement recovery mechanisms
4. Add owner rotation strategies