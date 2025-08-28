# Safe MCP Server

**Enable AI agents to manage Safe multisig wallets across multiple blockchains.**

Safe MCP Server is a production-ready Model Context Protocol implementation that provides secure, programmatic access to Safe wallet functionality. Built with the official Safe SDK, it enables LLMs and AI agents to create, manage, and interact with Safe multisig wallets without compromising security.

### Key Highlights
- 🔐 **Security-First**: No private key storage, runtime-only key usage
- 🌐 **Multi-Chain**: Support for 8+ EVM networks  
- 🤖 **AI-Native**: Built specifically for LLM integration
- ⚡ **Production-Ready**: Battle-tested with comprehensive error handling
- 🔄 **Real Blockchain Ops**: No mocks - genuine Safe SDK integration

## Table of Contents
- [Features](#-features)
- [Architecture](#️-architecture) 
- [Quick Start](#-quick-start)
- [MCP Client Integration](#️-mcp-client-integration)
- [Available Tools](#-available-tools)
- [Usage Examples](#-usage-examples)
- [Security Best Practices](#-security-best-practices)
- [Requirements & Limitations](#-requirements--limitations)
- [Testing](#-testing)
- [Production Deployment](#-production-deployment)
- [Troubleshooting](#-troubleshooting)
- [API Reference](#-api-reference)

## ✨ Features

✅ **Real Blockchain Operations**
- Create and deploy Safe multisig wallets
- Execute transactions with multiple signatures  
- Query wallet balances and transaction history
- Manage owners and signature thresholds

✅ **Multi-Network Support**
- Ethereum Mainnet (`eip155:1`)
- Polygon (`eip155:137`)
- Arbitrum One (`eip155:42161`)
- Optimism (`eip155:10`) 
- Base (`eip155:8453`)
- Gnosis Chain (`eip155:100`)
- Sepolia Testnet (`eip155:11155111`)
- Hardhat Local (`eip155:31337`)

✅ **MCP Protocol Compliance**
- Full JSON-RPC 2.0 support
- 10 production-ready tools
- Structured responses with comprehensive error handling
- Real-time blockchain data

## 🏗️ Architecture

Built with modern Safe SDK stack:
- **@safe-global/protocol-kit** - Core wallet operations
- **@safe-global/api-kit** - Transaction Service integration
- **ethers v6** - Blockchain connectivity
- **TypeScript** - Type safety and reliability

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- NPM or Yarn package manager
- RPC endpoints for target networks (Alchemy, Infura, or similar)
- Private keys for transaction signing (optional for read-only operations)
- Basic understanding of Safe multisig wallets
- Familiarity with MCP protocol (optional but helpful)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/mcp-safe
cd mcp-safe

# Install dependencies
npm install

# Build the server
npm run build

# Test the server
echo '{"jsonrpc":"2.0","method":"tools/list","id":1}' | npm start
```

### Environment Setup

Create `.env` file:
```bash
# Required: RPC URLs for networks you want to use
SAFE_RPC_EIP155_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SAFE_RPC_EIP155_137=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
SAFE_RPC_EIP155_11155111=https://sepolia.infura.io/v3/YOUR_KEY

# Optional: Default private keys (not recommended for production)
# Better to pass keys as runtime parameters
DEFAULT_PRIVATE_KEY=0x...
```

## 🛠️ MCP Client Integration

### Claude Desktop

Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "safe": {
      "command": "node",
      "args": ["/path/to/mcp-safe/dist/index.js"],
      "env": {
        "SAFE_RPC_EIP155_1": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
        "SAFE_RPC_EIP155_11155111": "https://sepolia.infura.io/v3/YOUR_KEY"
      }
    }
  }
}
```

### Cursor IDE

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "safe": {
      "command": "node",
      "args": ["./dist/index.js"],
      "env": {
        "SAFE_RPC_EIP155_1": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
      }
    }
  }
}
```

### Cline VS Code Extension

Configure in settings with MCP server path pointing to the built `dist/index.js`.

## 📋 Available Tools

### Wallet Management
- **`safe_create_wallet_config`** - Generate and validate wallet configuration before deployment
- **`safe_predict_address`** - Calculate deterministic wallet address without deploying  
- **`safe_deploy_wallet`** - Deploy new Safe wallet with specified owners and threshold
- **`safe_get_info`** - Retrieve wallet details (owners, threshold, modules, version)
- **`safe_get_balance`** - Query ETH and token balances

### Transaction Management  
- **`safe_propose_transaction`** - Create and sign transaction proposals for multi-sig execution
- **`safe_execute_transaction`** - Execute transactions directly (single-sig or pre-signed)

### Owner Management
- **`safe_add_owner`** - Add new owner to existing Safe wallet
- **`safe_remove_owner`** - Remove owner from Safe wallet  
- **`safe_change_threshold`** - Update required signature count

### Infrastructure
- **`safe_deploy_infrastructure`** - Deploy Safe master contracts to new networks

## 💡 Usage Examples

### Create a Wallet Configuration

```bash
echo '{
  "jsonrpc": "2.0", 
  "method": "tools/call",
  "params": {
    "name": "safe_create_wallet_config",
    "arguments": {
      "owners": ["0x742d35cc6634c0532925a3b844bc9e7595F0fA9B"],
      "threshold": 1,
      "networkId": "eip155:11155111"
    }
  },
  "id": 1
}' | npm start
```

### Predict Safe Address

```bash
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call", 
  "params": {
    "name": "safe_predict_address",
    "arguments": {
      "owners": ["0x742d35cc6634c0532925a3b844bc9e7595F0fA9B"],
      "threshold": 1,
      "networkId": "eip155:11155111"
    }
  },
  "id": 1  
}' | npm start
```

### Query Existing Safe

```bash  
echo '{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "safe_get_info", 
    "arguments": {
      "address": "0x00000000219ab540356cbb839cbe05303d7705fa",
      "networkId": "eip155:1"
    }
  },
  "id": 1
}' | npm start
```

## 📋 Requirements & Limitations

### Network Requirements
- Active RPC connection to target blockchain
- Sufficient ETH for gas fees (deployment ~0.3 ETH on mainnet)
- Valid checksummed Ethereum addresses

### Current Limitations  
- No hardware wallet support (software keys only)
- Limited to Safe v1.4.1 contracts
- No support for Safe modules or guards (base functionality only)
- Transaction batching not yet implemented

## 🔒 Security Best Practices

### Private Key Management

**❌ Don't do this:**
```bash
# Storing keys in environment variables
export DEFAULT_PRIVATE_KEY=0x1234...
```

**✅ Do this:**
```bash
# Pass keys as runtime parameters
echo '{
  "params": {
    "name": "safe_deploy_wallet",
    "arguments": {
      "privateKey": "0x...",
      "owners": ["0x..."],
      "threshold": 2,
      "networkId": "eip155:11155111"  
    }
  }
}' | npm start
```

### Network Configuration

- Use authenticated RPC endpoints (Alchemy, Infura)
- Configure rate limits and retry logic
- Test with testnets before mainnet operations
- Monitor gas prices and network congestion

### Address Validation

All addresses must be properly checksummed:

```javascript
// Use ethers to get correct checksum
const { getAddress } = require('ethers');
const checksummed = getAddress('0x742d35cc6634c0532925a3b844bc9e7595f0fa9b');
// Result: 0x742d35cc6634c0532925a3b844bc9e7595F0fA9B
```

## 🧪 Testing

### Run Test Suite
```bash
npm test
```

### Manual Testing with MCP Inspector
```bash
npx @modelcontextprotocol/inspector npm start
```

### Local Blockchain Testing
```bash
# Start Hardhat node
npm run node

# Deploy Safe contracts
npm run deploy:real

# Test with local network
echo '{"method": "tools/call", "params": {"name": "safe_get_info", "arguments": {"address": "0x...", "networkId": "eip155:31337"}}}' | npm start
```

## 🚀 Production Deployment

### NPM Package Distribution

```bash
# Build for distribution
npm run build

# Test package
npm pack
npm install -g ./safe-mcp-server-1.0.0.tgz

# Publish to NPM
npm publish
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## 🐛 Troubleshooting

### Error Reference

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid owner address` | Non-checksummed address | Use `ethers.getAddress()` to checksum |
| `Network not supported` | Invalid CAIP-2 format | Format: `eip155:{chainId}` |
| `Provider connection failed` | RPC connectivity issue | Verify API key and endpoint URL |
| `Safe not deployed` | No contract at address | Confirm Safe exists on target network |
| `Insufficient gas` | Low ETH balance | Fund account with ~0.3 ETH for deployment |

### Debug Mode

Enable verbose logging:
```bash
DEBUG=safe:* npm start
```

## 📚 API Reference

### Network Identifiers (CAIP-2 Format)

| Network | Identifier | Chain ID |
|---------|------------|----------|
| Ethereum Mainnet | `eip155:1` | 1 |
| Polygon | `eip155:137` | 137 |
| Arbitrum One | `eip155:42161` | 42161 |
| Optimism | `eip155:10` | 10 |
| Base | `eip155:8453` | 8453 |
| Gnosis Chain | `eip155:100` | 100 |
| Sepolia Testnet | `eip155:11155111` | 11155111 |
| Hardhat Local | `eip155:31337` | 31337 |

### Response Format

All tools return structured JSON responses:

```json
{
  "isError": false,
  "content": [{
    "type": "text", 
    "text": "{\"result\": \"data\"}"
  }]
}
```

Error responses:
```json
{
  "isError": true,
  "content": [{
    "type": "text",
    "text": "Error description with context"  
  }]
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build and test
npm run build
npm start

# Type checking
npm run typecheck

# Linting  
npm run lint
```

## 📄 License

MIT License - see LICENSE file for details.

## 🔗 Links

- [Safe Global Documentation](https://docs.safe.global/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Safe SDK Protocol Kit](https://github.com/safe-global/safe-core-sdk)

---

**Safe MCP Server** • Real Safe SDK Integration • No Mocks • Production Ready