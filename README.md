# Safe MCP Server

**Enable AI agents to manage Safe multisig wallets across multiple blockchains.**

A production-ready Model Context Protocol server providing secure, programmatic access to Safe wallet functionality. Built with the official Safe SDK, it enables Claude and other AI systems to create, manage, and interact with Safe multisig wallets without compromising security.

## Key Features

🔐 **Security-First** - Runtime-only key usage, no storage • 🌐 **Multi-Chain** - 8+ EVM networks supported • 🤖 **AI-Native** - Built for LLM integration • ⚡ **Production-Ready** - Real Safe SDK, no mocks • 🛠️ **10 Tools** - Complete wallet lifecycle management

## Quick Start

### Prerequisites
- Node.js 18+
- RPC endpoints (Alchemy/Infura recommended)
- Private keys for transaction signing (optional for read-only)

### Installation & Setup

#### Option 1: NPM Package (Recommended)
```bash
npm install -g safe-mcp-server
```

#### Option 2: Local Development
```bash
git clone https://github.com/your-org/mcp-safe
cd mcp-safe && npm install && npm run build
```

## Integration with Claude

### Claude Code CLI
Add the server using the modern CLI command:

```bash
# NPM package installation
claude mcp add safe --env SAFE_RPC_EIP155_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY -- safe-mcp-server

# Local development
claude mcp add safe --env SAFE_RPC_EIP155_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY -- node /absolute/path/to/mcp-safe/dist/index.js
```

### Claude Desktop
Add to `~/.config/claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "safe": {
      "command": "safe-mcp-server",
      "env": {
        "SAFE_RPC_EIP155_1": "https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY",
        "SAFE_RPC_EIP155_11155111": "https://sepolia.infura.io/v3/YOUR_KEY"
      }
    }
  }
}
```

For local development, use absolute path: `"command": "node"` with `"args": ["/absolute/path/to/mcp-safe/dist/index.js"]`

### Other MCP Clients
Point your MCP client to `dist/index.js` with appropriate environment variables for RPC endpoints.

## Available Tools

| Tool | Purpose |
|------|---------|
| `safe_create_wallet_config` | Generate and validate wallet configuration |
| `safe_predict_address` | Calculate wallet address before deployment |
| `safe_deploy_wallet` | Deploy new Safe wallet |
| `safe_get_info` | Query wallet details and status |
| `safe_get_balance` | Check ETH and token balances |
| `safe_propose_transaction` | Create transaction proposals |
| `safe_execute_transaction` | Execute transactions directly |
| `safe_add_owner` | Add new wallet owners |
| `safe_remove_owner` | Remove existing owners |
| `safe_change_threshold` | Update signature requirements |

## Supported Networks

Ethereum • Polygon • Arbitrum • Optimism • Base • Gnosis • Sepolia • Local

Uses CAIP-2 format: `eip155:1` (Ethereum), `eip155:137` (Polygon), etc.

## Example Usage

Create a wallet configuration:
```bash
# Test via CLI
echo '{"method":"tools/call","params":{"name":"safe_predict_address","arguments":{"owners":["0x742d35cc6634c0532925a3b844bc9e7595F0fA9B"],"threshold":1,"networkId":"eip155:11155111"}},"id":1}' | safe-mcp-server
```

Or simply ask Claude: *"Create a 2-of-3 Safe wallet on Sepolia with these owners: [addresses]"*

## Security Best Practices

• **Private Keys**: Pass as runtime parameters, never store in config files
• **RPC Endpoints**: Use authenticated providers (Alchemy, Infura) with API keys
• **Address Validation**: Ensure all addresses are properly checksummed
• **Network Testing**: Always test on testnets before mainnet operations

## Environment Variables

Set RPC URLs for networks you want to support:
```bash
SAFE_RPC_EIP155_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
SAFE_RPC_EIP155_137=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY
SAFE_RPC_EIP155_11155111=https://sepolia.infura.io/v3/YOUR_KEY
```

## Development & Testing

```bash
# Run tests
npm test

# Manual testing with MCP Inspector  
npx @modelcontextprotocol/inspector npm start

# Type checking and linting
npm run build && npm run lint
```

## Links

[Safe Global Docs](https://docs.safe.global/) • [Model Context Protocol](https://modelcontextprotocol.io/) • [Safe SDK](https://github.com/safe-global/safe-core-sdk)

---

**Safe MCP Server** • Real Safe SDK Integration • Production Ready