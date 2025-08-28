# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **Safe MCP Server** - a production-ready Model Context Protocol (MCP) server that enables AI systems to interact with Safe multisig wallets across multiple blockchain networks using **real Safe SDK functionality**. 

### What We're Building
- **Real blockchain operations** - No mocks, all tools use genuine Safe Global SDK
- **Multi-network support** - 8+ blockchain networks with failover RPC providers
- **Multi-agent coordination** - Multiple AI agents can collaborate on wallet management
- **Production-ready MCP server** - Full JSON-RPC 2.0 compliance with structured responses

### Current Implementation Status ✅
**All major functionality is COMPLETE and working with real Safe SDK:**
- ✅ 10 production MCP tools available
- ✅ Real Safe wallet prediction and deployment
- ✅ Real blockchain queries and transaction management  
- ✅ Multi-network provider system with failover
- ✅ Comprehensive input validation and error handling

## Memories

- After each task update the status of the task
- Always do test driven development. First create a test that fails, then create code to make it pass
- Focus on testing the Model Context Protocol implementation. Do not test internal sdk behaviors
- NO FILE CAN BE MORE THAN 200 lines

## Build and Development Commands

### Testing MCP Servers
When testing MCP servers, use command line testing by piping JSON objects into the running server:
```bash
# Test MCP server with JSON input
echo '{"method": "tools/list", "params": {}}' | npm start
echo '{"method": "tools/call", "params": {"name": "safe_get_info", "arguments": {"address": "0x...", "network": "eip155:1"}}}' | npm start
```

### Manual Testing
Use the MCP Inspector for development testing:
```bash
npx @modelcontextprotocol/inspector npm start
```

### Environment Setup
Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

## Architecture

### Core Architecture
- **MCP Server Implementation**: Provides tools for SAFE wallet management through MCP protocol
- **Multi-Network Support**: Supports 9+ blockchain networks using CAIP-2 identifiers (eip155:1, eip155:137, etc.)
- **Transaction Modes**: Dual execution modes - Safe Transaction Service for multi-agent coordination and direct on-chain execution
- **Configuration System**: Multi-source configuration (environment variables, files, runtime parameters)

### Key Components
1. **Wallet Management**: Creation, deployment, and configuration of SAFE multisig wallets
2. **Transaction Management**: Both service-based (multi-agent) and direct on-chain execution
3. **Owner Management**: Add, remove, swap owners and change thresholds
4. **Query Tools**: Balance checks, transaction history, wallet state
5. **Module Management**: Enable/disable SAFE modules and guards

### Network Identification
Uses CAIP-2 format for unambiguous network identification:
- `eip155:1` - Ethereum Mainnet
- `eip155:137` - Polygon
- `eip155:42161` - Arbitrum One
- `eip155:11155111` - Sepolia Testnet

### Multi-Agent Coordination
Supports multiple AI agents collaborating on wallet management:
- **Proposer Agents**: Create and propose transactions
- **Signer Agents**: Review and sign pending transactions
- **Executor Agents**: Execute fully signed transactions
- **Monitor Agents**: Track transaction status

## Configuration Management

### Environment Variables (API Keys Only)
Store in `.env` file or `.cursor/mcp.json`:
```bash
ANTHROPIC_API_KEY="sk-ant-api03-..."
OPENAI_API_KEY="sk-proj-..."
PERPLEXITY_API_KEY="pplx-..."
# Network RPC URLs using CAIP-2 format
SAFE_RPC_EIP155_1="https://eth-mainnet.example.com"
SAFE_RPC_EIP155_137="https://polygon.example.com"
```

### Configuration Priority (High to Low)
1. Runtime parameters in tool calls
2. Environment variables
3. Configuration files
4. Default values

## Security Practices

### Key Management
- **Never hardcode private keys** in source code
- Use environment variables for development
- Support runtime key injection for one-time operations
- Implement proper key derivation and encryption

### Network Security
- HTTPS-only communication with RPC providers
- API key protection and rotation
- Request validation and rate limiting
- Provider failover mechanisms

## Development Workflow

### Testing Strategy
1. **Unit Testing**: Tool handler logic, configuration parsing, network management
2. **Integration Testing**: MCP Inspector validation, network provider testing
3. **End-to-End Testing**: Multi-agent scenarios, network failover

### Manual Testing Approach
- Create test scripts in `/test-scripts` folder for understanding API responses
- Test MCP tools by piping JSON objects to server on stdio
- Delete test scripts after use to keep repository clean
- Use MCP Inspector for interactive testing during development

### Commit Practices
- Commit often with descriptive messages listing all changed files/functions
- Commit frequently with detailed commit messages
- Run build and fix errors before committing
- Use new branches for features, merge after manual command line testing
- Never commit API keys or sensitive information
- **Get a code review before each commit, fix all errors, linter and types**

## Important Implementation Notes

### MCP Server Requirements
- Use stderr for logging (stdout reserved for MCP protocol)
- Never log to stdout as it breaks protocol operation
- Use absolute paths (working directory may be undefined)
- Handle environment variable inheritance properly

### Transaction Execution Modes
1. **Service-Based Mode**: Uses Safe Transaction Service for multi-signature coordination
2. **Direct Mode**: Bypasses service, executes directly on-chain
3. **Hybrid Mode**: Attempts service first, falls back to direct execution

### File Organization
- Keep files under 200 lines of code
- Keep code DRY (Don't Repeat Yourself)
- Follow existing patterns and conventions in codebase
- Use proper TypeScript with strict mode

## Common Tasks

### Creating New MCP Tools
Follow the pattern from existing tools, ensure proper:
- Zod schema validation for inputs
- CAIP-2 network format validation
- Error handling with structured responses
- Documentation with clear descriptions

### Network Configuration
Use CAIP-2 format consistently:
```typescript
const networkId = "eip155:1"; // Ethereum mainnet
const provider = await networkManager.getProvider(networkId);
```

### Error Handling
Implement structured error responses:
```typescript
throw new SafeError(
  "Operation failed: reason",
  "ERROR_CODE",
  { context: "additional details" }
);
```

This project is production-focused with emphasis on security, multi-network support, and AI-native wallet management capabilities.

## Development Principles
- Always use test-driven development.
- Do not create unnecessary tests. All tests must be pertinent and test real functionality.
- Do not create mocks for blockchain operations. Test with a local network with real smart contracts

## Recent Development Log

### ✅ Task 3 Completion (Wallet Management Tools) - August 28, 2025
**MAJOR DISCOVERY**: All wallet management tools were already implemented with **real Safe SDK functionality**, not mocked as originally documented in planning documents.

#### Key Findings:
- ✅ **safe_predict_address**: Uses genuine `SafeFactory.predictSafeAddress()` - verified working
- ✅ **safe_deploy_wallet**: Real Safe deployment functionality - tested and functional  
- ✅ **safe_get_info**: Real blockchain queries via Safe SDK - operational
- ✅ **safe_get_balance**: Real balance queries with token support - working

#### Critical Technical Fixes:
1. **Safe SDK Import Issue**: Fixed ES module/CommonJS interop problem in `ProviderFactory.ts`
   ```typescript
   // Dynamic import solution
   const SafeModule = await import('@safe-global/protocol-kit');
   const Safe = (SafeModule.default as any).default || SafeModule.default;
   ```

2. **Environment Configuration**: Added Alchemy API key integration to avoid free endpoint limitations
   ```bash
   SAFE_RPC_EIP155_1=https://eth-mainnet.g.alchemy.com/v2/[API_KEY]
   ```

3. **Documentation Cleanup**: Removed misleading `.bak` files and updated planning documents to reflect actual implementation status

#### Testing Results:
- All 10 MCP tools operational with real blockchain functionality
- MCP JSON-RPC 2.0 protocol compliance verified
- Multi-network support confirmed (Ethereum, Polygon, Arbitrum, etc.)
- Safe SDK version compatibility resolved with ethers v6

#### Architecture Verified:
- **Real blockchain operations**: No mocks - genuine Safe Global SDK integration
- **Production-ready**: Full error handling, input validation, structured responses
- **Multi-agent capable**: Safe Transaction Service coordination available

### Current Status: ✅ PRODUCTION READY
All core functionality implemented and tested. The MCP server provides complete Safe wallet management capabilities through real blockchain interactions.

## External Resources
- Reference the Model Context Protocol documentation for examples:
  - Server: https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server
  - Client: https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/client
  - SDK: https://github.com/modelcontextprotocol/typescript-sdk/tree/main