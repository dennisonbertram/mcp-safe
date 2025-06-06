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

The server requires configuration for:
- Network RPC endpoints
- SAFE contract addresses
- API keys for transaction services
- Security settings

See `docs/configuration.md` for detailed setup instructions.

## MCP Tools

### Wallet Operations
- `safe_create_wallet_config`: Generate wallet configurations
- `safe_deploy_wallet`: Deploy new multisig wallets
- `safe_predict_address`: Calculate deterministic addresses

### Owner Management
- `safe_add_owner`: Add new wallet owners
- `safe_remove_owner`: Remove existing owners
- `safe_swap_owner`: Replace owners
- `safe_change_threshold`: Modify signature thresholds

### Transaction Management
- `safe_create_transaction`: Build transactions
- `safe_sign_transaction`: Sign pending transactions
- `safe_execute_transaction`: Execute signed transactions
- `safe_estimate_gas`: Calculate gas requirements

### Query Operations
- `safe_get_info`: Retrieve wallet information
- `safe_get_owners`: List wallet owners
- `safe_get_transactions`: Get transaction history
- `safe_get_pending_transactions`: List pending transactions

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