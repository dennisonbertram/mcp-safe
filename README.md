# SAFE Multisig MCP Server

A comprehensive Model Context Protocol (MCP) server that provides AI applications with complete access to SAFE multisig wallet operations.

## Overview

This MCP server enables AI applications to:
- Create and deploy SAFE multisig wallets
- Manage wallet operations (transactions, owners, modules)
- Query wallet state and transaction history
- Facilitate multisig transaction workflows
- Operate across all SAFE-supported networks

## Features

### Core Capabilities
- **Wallet Creation & Deployment**: Generate and deploy multisig wallets with configurable M-of-N setups
- **Owner Management**: Add, remove, and swap wallet owners with threshold management
- **Transaction Operations**: Create, sign, and execute single and batch transactions
- **Module Management**: Enable/disable SAFE modules for extended functionality
- **Guard Management**: Configure transaction guards for enhanced security
- **Message Signing**: Sign and verify messages using multisig wallets
- **Multi-Network Support**: Operate across all SAFE-compatible networks

### MCP Integration
- **Tools**: 25+ MCP tools covering all SAFE operations
- **Resources**: Dynamic resources for wallet data, transaction history, and network information
- **Prompts**: Guided workflows for common multisig patterns

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- npm or yarn package manager

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-safe-multisig

# Install dependencies
npm install

# Build the project
npm run build

# Start the server
npm start
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

## Configuration

### Basic Setup

The server requires configuration for:
- Network RPC endpoints
- SAFE contract addresses  
- API keys for transaction services
- Security settings

### Custom RPC Providers and API Keys

All SAFE tools support custom RPC providers and API key authentication:

#### Method 1: Tool Parameters (Recommended)
Pass provider configuration directly in tool calls:

```json
{
  "name": "safe_create_wallet_config",
  "arguments": {
    "owners": ["0x..."],
    "threshold": 1,
    "chainId": 1,
    "providerUrl": "https://mainnet.infura.io/v3",
    "providerApiKey": "your_infura_api_key"
  }
}
```

#### Method 2: Environment Variables (Automatic Detection)
Set API keys in environment variables for automatic detection:

```bash
# Provider-specific API keys (automatically detected)
INFURA_API_KEY="your_infura_api_key"
ALCHEMY_API_KEY="your_alchemy_api_key"  
QUICKNODE_API_KEY="your_quicknode_api_key"

# Generic RPC configuration
CUSTOM_RPC_URL="https://your-custom-rpc.com"
CUSTOM_RPC_API_KEY="your_rpc_api_key"
```

#### Supported RPC Providers
- **Infura**: Automatically appends API key to path (`/v3/{apiKey}`)
- **Alchemy**: Automatically appends API key to path (`/v2/{apiKey}`)
- **QuickNode**: Automatically appends API key to path (`/{apiKey}`)
- **Generic**: Adds API key as query parameter (`?apikey={apiKey}`)
- **Local Networks**: No API key needed (`http://localhost:8545`)

#### Examples

```json
// Local Hardhat development
{
  "chainId": 31337,
  "providerUrl": "http://127.0.0.1:8545"
}

// Mainnet with Infura
{
  "chainId": 1,
  "providerUrl": "https://mainnet.infura.io/v3",
  "providerApiKey": "your_infura_key"
}

// Polygon with Alchemy (using env var)
{
  "chainId": 137,
  "providerUrl": "https://polygon-mainnet.g.alchemy.com/v2"
  // ALCHEMY_API_KEY env var automatically detected
}
```

See `docs/configuration.md` for detailed setup instructions.

## MCP Tools

### Wallet Operations

The SAFE MCP server provides three distinct wallet operations, each serving different purposes in the wallet lifecycle:

#### 1. `safe_create_wallet_config` - Configuration Planning (No Private Key Required)
Creates a wallet configuration without deploying anything to the blockchain.

**Purpose**: Plan and validate wallet setup before committing to deployment
**Requirements**: Owner addresses, threshold, chain ID
**Private Key**: ❌ Not required
**Blockchain Interaction**: ❌ No on-chain operations

```json
{
  "name": "safe_create_wallet_config",
  "arguments": {
    "owners": ["0x742d35Cc6634C0532925a3b8D8fC20E12F8C81e6", "0x..."],
    "threshold": 2,
    "chainId": 11155111,
    "providerUrl": "https://sepolia.infura.io/v3/your-key"
  }
}
```

#### 2. `safe_predict_address` - Address Calculation (No Private Key Required)
Calculates the deterministic address where a wallet will be deployed.

**Purpose**: Get the future wallet address for funding and planning
**Requirements**: Same parameters as configuration
**Private Key**: ❌ Not required  
**Blockchain Interaction**: ❌ No on-chain operations (read-only verification)

```json
{
  "name": "safe_predict_address",
  "arguments": {
    "owners": ["0x742d35Cc6634C0532925a3b8D8fC20E12F8C81e6", "0x..."],
    "threshold": 2,
    "chainId": 11155111,
    "saltNonce": "123"
  }
}
```

#### 3. `safe_deploy_wallet` - Actual Deployment (Private Key Required)
Deploys the wallet to the blockchain with a real transaction.

**Purpose**: Actually create the wallet on-chain
**Requirements**: Configuration parameters + private key of one owner
**Private Key**: ✅ Required (must be one of the wallet owners)
**Blockchain Interaction**: ✅ Creates on-chain transaction

```json
{
  "name": "safe_deploy_wallet", 
  "arguments": {
    "owners": ["0x742d35Cc6634C0532925a3b8D8fC20E12F8C81e6", "0x..."],
    "threshold": 2,
    "chainId": 11155111,
    "signerPrivateKey": "0x1234...",
    "gasLimit": "1000000"
  }
}
```

#### Typical Wallet Creation Workflow

```bash
# Step 1: Plan wallet configuration (no keys needed)
safe_create_wallet_config → Validates setup and returns configuration

# Step 2: Get future wallet address (no keys needed)  
safe_predict_address → Returns deterministic address

# Step 3: Fund the predicted address with ETH for gas fees
# (Manual step - send ETH to the predicted address)

# Step 4: Deploy wallet (requires private key)
safe_deploy_wallet → Creates wallet on blockchain
```

### Owner Management
- `safe_add_owner`: Add new wallet owners with threshold management
- `safe_remove_owner`: Remove existing owners with threshold adjustment
- `safe_swap_owner`: Replace one owner with another
- `safe_change_threshold`: Modify signature threshold requirements

### Query Operations
- `safe_get_info`: Retrieve comprehensive wallet information (balance, modules, guards, nonce)
- `safe_get_owners`: List current wallet owners and threshold settings

### Module & Guard Management
- `safe_enable_module`: Enable SAFE modules for extended functionality
- `safe_disable_module`: Disable previously enabled modules

### System Tools
- `server_health`: Check server status and capabilities

## All Tools Support
- ✅ **Custom RPC Providers**: Use any RPC endpoint with `providerUrl`
- ✅ **API Key Authentication**: Secure access with `providerApiKey` or environment variables
- ✅ **Multi-Network**: Support for all SAFE-compatible networks
- ✅ **Error Handling**: Comprehensive error messages and validation
- ✅ **Flexible Configuration**: Tool parameters override environment settings

## Security

This server implements comprehensive security measures:
- Secure key management with isolated signing operations
- Transaction validation and simulation before execution
- Rate limiting and access control
- Input sanitization and error handling

## Testing

The project includes comprehensive test suites:
- Unit tests for all components
- Integration tests for end-to-end workflows
- Security tests for vulnerability assessment
- Performance tests for load and latency

```bash
npm test                    # Run all tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Generate coverage report
```

## Documentation

- [Configuration Guide](docs/configuration.md)
- [API Reference](docs/api-reference.md)
- [Integration Examples](docs/examples/)
- [Security Guidelines](docs/security.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For questions, issues, or contributions:
- Open an issue on GitHub
- Check the documentation
- Review existing discussions

## Roadmap

- [ ] Core MCP server implementation
- [ ] SAFE SDK integration
- [ ] Multi-network support
- [ ] Advanced transaction patterns
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment

## Acknowledgments

- [SAFE Protocol](https://safe.global/) for the multisig infrastructure
- [Model Context Protocol](https://modelcontextprotocol.io/) for the integration standard
- The Ethereum community for foundational blockchain technology 