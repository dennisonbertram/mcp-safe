# Safe MCP Server

A production-ready Model Context Protocol (MCP) server that enables AI systems to interact with Safe multisig wallets across multiple blockchain networks using real Safe SDK functionality.

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
- RPC endpoints for target networks
- Private keys for transaction signing (optional for read-only)

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
- **`safe_create_wallet_config`** - Validate wallet configuration
- **`safe_predict_address`** - Predict wallet address before deployment  
- **`safe_deploy_wallet`** - Deploy new Safe wallet
- **`safe_get_info`** - Query wallet information

### Transaction Management  
- **`safe_propose_transaction`** - Create transaction proposal
- **`safe_execute_transaction`** - Execute transaction directly

### Owner Management
- **`safe_add_owner`** - Add new wallet owner
- **`safe_remove_owner`** - Remove wallet owner
- **`safe_change_threshold`** - Modify signature threshold

### Infrastructure
- **`safe_deploy_infrastructure`** - Deploy Safe contracts to new networks

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

### Common Issues

**"Invalid owner address" Error**
- Ensure addresses are properly checksummed using `ethers.getAddress()`

**"Network not supported" Error**  
- Check CAIP-2 format: `eip155:chainId`
- Verify RPC URL is configured for the network

**"Provider connection failed" Error**
- Check RPC URL validity and API key
- Verify network connectivity
- Try fallback RPC endpoints

**"Safe not deployed" Error**
- Address has no bytecode deployed
- Check if Safe exists on the specified network

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

Built with ❤️ using Real Safe SDK Integration • No Mocks • Production Ready