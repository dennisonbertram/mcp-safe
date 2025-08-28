# Safe Documentation - Batch 3

## AI Agent Integration

### Basic Agent Setup
Safe provides dedicated support for AI agents with smart accounts:

```typescript
import Safe from '@safe-global/protocol-kit'

const SIGNER_ADDRESS = // AI agent's address
const SIGNER_PRIVATE_KEY = // AI agent's private key
const RPC_URL = 'https://rpc.ankr.com/eth_sepolia'

const safeClient = await Safe.init({
  provider: RPC_URL,
  signer: SIGNER_PRIVATE_KEY,
  predictedSafe: {
    safeAccountConfig: {
      owners: [SIGNER_ADDRESS],
      threshold: 1
    }
  }
})
```

**Note**: 1-out-of-1 signer setup is discouraged for security but commonly used for AI agent simplicity.

## Safe CLI - Command Line Interface

### Safe Management Commands
- **Create Safe**: `safe-creator <node_url> <private_key> --owners <address1> <address2> --threshold <uint> --salt-nonce <uint256>`
- **Load Safe**: `safe-cli <checksummed_safe_address> <ethereum_node_url>`
- **Update Safe**: `update` - Updates to latest version

### Transaction Commands
- **Send Ether**: `send_ether <address> <value-wei> [--safe-nonce <int>]`
- **Send ERC-20**: `send_erc20 <address> <token-address> <value-wei> [--safe-nonce <int>]`
- **Send ERC-721**: `send_erc721 <address> <token-address> <token-id> [--safe-nonce <int>]`
- **Custom Transaction**: `send_custom <address> <value-wei> <data-hex-str> [--delegate] [--safe-nonce <int>]`
- **Approve Hash**: `approve_hash <keccak-hexstr-hash> <sender-address>`

### Owner Management Commands  
- **Add Owner**: `add_owner <address>`
- **Remove Owner**: `remove_owner <address>`
- **Load Owners from Private Key**: `load_cli_owners <account_private_key>`
- **Load from Environment**: `load_cli_owners MY_PRIVATE_KEY`
- **Show Loaded Owners**: `show_cli_owners`
- **Unload Owner**: `unload_cli_owners <ethereum_checksummed_address>`

### Hardware Wallet Support
- **Ledger Integration**: `load_ledger_cli_owners [--legacy-accounts] [--derivation-path <str>]`
- **Trezor Integration**: `load_trezor_cli_owners [--legacy-accounts] [--derivation-path <str>]`

### Module Commands
- **Enable Module**: `enable_module <address>`
- **Disable Module**: `disable_module <address>`

### Advanced Operations
- **Change Threshold**: `change_threshold <integer>`
- **Update Fallback Handler**: `change_fallback_handler <address>`
- **Update Safe Guard**: `change_guard <address>`
- **Update Master Copy**: `change_master_copy <address>`
- **Migrate to L2**: `update_version_to_l2 <address>` (requires nonce = 0)

## Smart Account Core Concepts

### Owners & Threshold
- **Owners**: Ethereum addresses stored in Safe storage, can add/remove other owners
- **Threshold**: Minimum number of owner confirmations required for transaction execution
- **Flexible Configuration**: Any number of owners, threshold between 1 and total owners

### Transaction Types

#### Safe Transaction (`execTransaction`)
**Parameters**:
- `to`: Recipient address
- `value`: Ether amount in wei
- `data`: Transaction data payload
- `operation`: CALL or DELEGATECALL
- `safeTxGas`: Gas for Safe transaction
- `baseGas`: Gas for signature checks and base transaction fee
- `gasPrice`: Gas price (0 = no refund)
- `gasToken`: Token for gas payment (0x0 = Ether)
- `refundReceiver`: Gas refund recipient
- `signatures`: Sorted owner signatures by address

#### Module Transaction (`execTransactionFromModule`)
**Parameters**:
- `to`: Recipient address  
- `value`: Ether amount in wei
- `data`: Transaction data payload
- `operation`: CALL or DELEGATECALL

### Signature Verification
- Contract-based authentication (no private key)
- Supports multiple signature schemes: EIP-1271, EIP-712
- Signature sorting by owner address required
- Re-entrancy protection needed

### Safe Components
- **Safe Modules**: Smart contracts extending functionality
- **Safe Guards**: Pre/post-transaction checks  
- **Signatures**: Alternative schemes for verification

## API Kit Reference

### getPendingTransactions
Returns multi-signature transactions awaiting owner confirmations:

```typescript
import { apiKit } from './setup.ts'

const safeAddress = '0x...'
const options = {
  currentNonce: 0,
  hasConfirmations: true,
  ordering: 'created',
  limit: 10,
  offset: 10
}

const pendingTxs = await apiKit.getPendingTransactions(safeAddress, options)
```

**Parameters**:
- `safeAddress`: Safe address (required)
- `currentNonce`: Current Safe nonce (optional)
- `hasConfirmations`: Filter txs with confirmations (optional)
- `ordering`: Sort field (optional)
- `limit`: Results per page (optional)
- `offset`: Starting index (optional)

**Returns**: `Promise<SafeMultisigTransactionListResponse>`

## Smart Contract Setup Reference

### setup() Function
Initializes Safe contract storage (can only be called once):

```solidity
function setup(
    address[] _owners,
    uint256 _threshold,
    address to,
    bytes data,
    address fallbackHandler,
    address paymentToken,
    uint256 payment,
    address payable paymentReceiver
) external;
```

**Warning**: If proxy created without setup, anyone can claim it by calling setup.

This batch covers AI agent integration patterns, comprehensive CLI command reference, core Smart Account concepts, API Kit methods, and smart contract setup procedures.