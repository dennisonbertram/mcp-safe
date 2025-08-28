# Safe Documentation - Batch 2

## Bug Bounty Program & Security

### Past Paid Bounties (Historical Security Issues)
1. **Potential suicide of MultiSend library** - $1,000 USD bounty (Low Threat)
2. **Transaction failure when receiving funds via transfer/send** - Internal discovery
3. **Duplicate owners during setup** - $2,500 USD bounty (Medium Threat) 
4. **Safe as owner of itself reduces threshold** - $5,000 USD bounty (Medium Threat)
5. **getModulesPaginated incomplete results** - $2,000 USD bounty (Low Threat)
6. **Signature verification size limit** - $1,000 USD bounty (Low Threat)

## Onramp Integration

### Monerium Integration
- **Purpose**: Bridge Safe accounts with traditional banking via SEPA
- **Features**: Direct IBAN transfers from Safe accounts
- **Supported Tokens**: EURe (regulated stablecoin)
- **Networks**: Ethereum, Polygon, Gnosis
- **Authentication Flow**: 
  1. Sign link message with Safe
  2. Authenticate with Monerium
  3. Link IBAN to Safe account
  4. Place and sign orders for transfers

#### Code Example - Sign Link Message
```typescript
import Safe, { getSignMessageLibContract, hashSafeMessage } from '@safe-global/protocol-kit'
import { constants } from '@monerium/sdk'

const protocolKit = await Safe.init({
  provider: RPC_URL,
  signer: OWNER_1_PRIVATE_KEY,
  safeAddress
})

const signMessageContract = await getSignMessageLibContract({
  safeProvider: protocolKit.getSafeProvider(),
  safeVersion: await protocolKit.getContractVersion()
})

const txData = signMessageContract.encode('signMessage', [
  hashSafeMessage(constants.LINK_MESSAGE)
])
```

#### Code Example - Place Order
```typescript
import { MoneriumClient, placeOrderMessage } from '@monerium/sdk'

const monerium = new MoneriumClient({
  clientId: 'client-id',
  environment: 'sandbox'
})

const orderMessage = placeOrderMessage(amount, 'eur', iban)
const order = await moneriumClient.placeOrder({
  amount,
  signature: '0x',
  currency: 'eur',
  address: safeAddress,
  counterpart: {
    identifier: { standard: 'iban', iban },
    details: { firstName: 'User', lastName: 'Userson', county: 'AL' }
  },
  message: orderMessage,
  memo: 'Powered by Monerium SDK',
  chain: 'ethereum',
  network: 'sepolia'
})
```

## Smart Contract API Reference

### Signature Verification
- **checkNSignatures(address executor, bytes32 dataHash, bytes signatures, uint256 requiredSignatures)**
  - Validates signatures for provided data and hash
  - Supports ECDSA, EIP-1271 contract signatures, and approved hashes
  - Security warning: Ensure executor address legitimacy
  - Re-entrancy risk due to EIP-1271 external calls

### Parameters:
- `executor`: Address executing the transaction
- `dataHash`: Hash of data (message or transaction hash)
- `signatures`: Signature data (packed ECDSA, contract signature, or approved hash)
- `requiredSignatures`: Required number of valid signatures

## Safenet Cross-Chain Protocol

### Transaction Flow (3 Phases)

#### 1. Simulation
- Processor previews security checks off-chain
- End user signs transactions (sufficient Safe owners)
- Transaction published to Safenet Transaction pool

#### 2. Fulfillment 
- Resource lock issued on debit chain Safe
- Liquidity provider pre-funds spend chain Safe
- Smart Account executes intended transaction on spend chain
- **Fast and gas-efficient** - no correctness proofs required

#### 3. Settlement
- Settlement request sent to guarantee engine on debit chain
- Challenge period allows validators to dispute
- **Gas-efficient but slower** due to challenge delay
- Attestation required only if challenged (gas-intensive)

### Economic Incentives
- Processors risk stake for invalid transactions
- Validators risk collateral for invalid challenges
- Similar to proof-of-stake slashing mechanisms
- Optimistic approach: assume validity unless proven otherwise

## Advanced Features

### Cross-Chain Capabilities
- Optimistic validity proofs for speed and efficiency
- Challenge-response mechanism for security
- Multi-chain Safe operations
- Resource locking and liquidity provider network

This batch covers security aspects, onramp integrations, advanced smart contract APIs, and the sophisticated Safenet cross-chain protocol.