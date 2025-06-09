# SAFE MCP Server - Product Requirements Document

## Executive Summary

The SAFE MCP Server is a Model Context Protocol (MCP) server that provides AI systems with comprehensive tools to interact with SAFE multisig wallets across multiple blockchain networks. This project enables AI agents to perform wallet operations, query wallet states, manage owners, and execute transactions through a standardized MCP interface.

## Project Vision

**Enable AI systems to securely and efficiently manage SAFE multisig wallets through a standardized, production-ready MCP server interface.**

## Core Objectives

### Primary Goals
1. **AI-Native Wallet Management**: Provide AI systems with native tools to create, configure, and manage SAFE multisig wallets
2. **Multi-Chain Support**: Support major blockchain networks (Ethereum, Polygon, Arbitrum, Optimism, Base, etc.)
3. **Production-Ready Security**: Implement enterprise-grade security practices for key management and transaction handling
4. **Developer Experience**: Offer comprehensive documentation, examples, and templates for easy integration

### Success Metrics
- Support for 9+ major blockchain networks
- Sub-2 second response times for wallet queries
- 100+ concurrent operation capacity
- Zero security incidents in production

## Target Users

### Primary Users
- **AI Application Developers**: Building AI agents that need to interact with multisig wallets
- **DeFi Protocol Teams**: Integrating AI-driven treasury management
- **Enterprise Development Teams**: Implementing AI-assisted financial operations

### Secondary Users
- **Individual AI Enthusiasts**: Personal AI assistants for wallet management
- **Research Teams**: Academic and industry researchers exploring AI-blockchain integration

## Feature Requirements

### 1. Wallet Creation & Management
**Priority: Critical**

#### Wallet Creation Tools
- `safe_create_wallet_config`: Validate and configure wallet parameters
- `safe_predict_address`: Calculate wallet address before deployment
- `safe_deploy_wallet`: Deploy wallet to blockchain with gas estimation

#### Key Features
- Support for custom owner configurations (1-of-1 to N-of-M)
- Deterministic address prediction using CREATE2
- Gas optimization for deployment transactions
- Custom fallback handler support

### 2. Wallet Query & Information
**Priority: Critical**

#### Query Tools
- `safe_get_info`: Comprehensive wallet information retrieval
- `safe_get_owners`: Owner list and threshold information
- `safe_get_balance`: Native and token balance queries
- `safe_get_modules`: Enabled modules and guards inspection
- `safe_get_transaction_hash`: Calculate transaction hash for signing
- `safe_is_transaction_executable`: Check if transaction can be executed
- `safe_get_transaction_history`: Query on-chain transaction history
- `safe_encode_transaction_data`: Encode data for custom contract calls

#### Key Features
- Real-time balance updates
- Transaction history integration (both on-chain and service)
- Module and guard status reporting
- Cross-chain wallet state synchronization
- Direct contract state queries
- Transaction readiness validation
- Gas estimation for direct execution

### 3. Owner Management
**Priority: High**

#### Owner Management Tools
- `safe_add_owner`: Add new wallet owners
- `safe_remove_owner`: Remove existing owners
- `safe_swap_owner`: Replace owner addresses
- `safe_change_threshold`: Modify signature requirements

#### Key Features
- Threshold validation and automatic adjustment
- Multi-signature transaction creation for owner changes
- Security warnings for dangerous operations
- Batch owner operations support

### 4. Module & Guard Management
**Priority: Medium**

#### Module Tools
- `safe_enable_module`: Enable wallet modules
- `safe_disable_module`: Disable wallet modules
- `safe_query_modules`: List available modules

#### Key Features
- Known module registry with security ratings
- Module compatibility verification
- Custom module support with warnings
- Module dependency management

### 5. Transaction Management
**Priority: High**

#### Transaction Tools
- `safe_create_transaction`: Build multi-signature transactions
- `safe_propose_transaction`: Submit transaction to Safe Transaction Service
- `safe_get_pending_transactions`: Retrieve transactions awaiting signatures
- `safe_sign_transaction`: Add signature to pending transaction
- `safe_execute_transaction`: Execute fully signed transactions
- `safe_execute_transaction_direct`: Execute transaction directly on-chain (bypass service)
- `safe_simulate_transaction`: Simulate transaction outcomes
- `safe_send_eth_direct`: Send ETH directly from Safe wallet
- `safe_send_token_direct`: Send tokens directly from Safe wallet
- `safe_contract_interaction`: Direct smart contract interaction from Safe

#### Key Features
- Gas estimation and optimization
- Transaction batching capabilities
- Signature collection management via Safe Transaction Service
- **Direct on-chain execution** without Transaction Service dependency
- Transaction queue management
- Support for multi-agent coordination
- Transaction status tracking and notifications
- **Offline signature collection** for direct execution
- **Custom contract interaction** with ABI encoding

#### Safe Transaction Service Integration
- Centralized transaction proposal storage
- Signature aggregation from multiple agents
- Transaction history and audit trail
- WebSocket support for real-time updates
- REST API for transaction management

#### Direct Contract Interaction
- Execute transactions directly on-chain when all signatures are available
- Bypass Transaction Service for networks without service support
- Local signature collection and management
- Direct contract calls with custom data encoding
- Support for complex DeFi interactions
- Fallback mechanism when Transaction Service is unavailable

### 6. Network & Provider Management
**Priority: Critical**

#### Multi-Network Support
- Support for 9+ major blockchain networks
- Custom RPC provider configuration
- Network-specific contract registries
- Cross-chain operation coordination

#### Supported Networks
- **Mainnets**: 
  - Ethereum (`eip155:1`)
  - Polygon (`eip155:137`)
  - Arbitrum (`eip155:42161`)
  - Optimism (`eip155:10`)
  - Base (`eip155:8453`)
  - Gnosis Chain (`eip155:100`)
- **Testnets**: 
  - Sepolia (`eip155:11155111`)
  - Polygon Mumbai (`eip155:80001`)
  - Arbitrum Sepolia (`eip155:421614`)

#### Key Features
- Automatic network detection and switching using CAIP-2 identifiers
- Provider health monitoring and failover
- API key management for premium RPC providers
- Local network support for development

#### Safe Transaction Service Endpoints
- **Ethereum Mainnet** (`eip155:1`): `https://safe-transaction-mainnet.safe.global`
- **Sepolia** (`eip155:11155111`): `https://safe-transaction-sepolia.safe.global`
- **Polygon** (`eip155:137`): `https://safe-transaction-polygon.safe.global`
- **Arbitrum** (`eip155:42161`): `https://safe-transaction-arbitrum.safe.global`
- **Optimism** (`eip155:10`): `https://safe-transaction-optimism.safe.global`
- **Base** (`eip155:8453`): `https://safe-transaction-base.safe.global`

#### Recommended RPC Providers
- **Public**: Ankr (`https://rpc.ankr.com/`), Infura, Alchemy
- **Premium**: QuickNode, Moralis, GetBlock
- **Fallback Strategy**: Primary → Secondary → Public fallback

## Technical Architecture

### Core Components

#### 1. MCP Server Core (`src/server/`)
- **SafeMultisigServer**: Main MCP server orchestration
- **TransportManager**: HTTP, WebSocket, and stdio transport handling
- **ConfigManager**: Environment-based configuration loading with multiple sources

#### 2. Configuration Management (`src/config/`)
- **ConfigLoader**: Multi-source configuration loading (env, file, runtime)
- **ConfigValidator**: Schema validation for all configuration options
- **ConfigMerger**: Priority-based configuration merging
- **SecretManager**: Secure handling of sensitive values

#### 3. Network Abstraction Layer (`src/network/`)
- **NetworkProviderManager**: Multi-chain provider management with failover
- **ChainManager**: Blockchain network configuration and validation
- **ContractRegistry**: SAFE contract addresses across networks

#### 4. SAFE Integration Layer (`src/safe/`)
- **SafeProtocolKit**: SAFE SDK wrapper with enhanced functionality
- **SafeApiService**: SAFE transaction service API integration
- **SafeRelayKit**: Gasless transaction support via relayers

#### 5. MCP Tools Layer (`src/mcp/tools/`)
- **WalletCreationTools**: Wallet deployment and configuration tools
- **QueryTools**: Wallet state and information retrieval tools
- **OwnerManagementTools**: Owner and threshold management tools
- **ModuleGuardTools**: Module and guard management tools

#### 6. Security & Validation (`src/security/`)
- **AccessControl**: Permission management and validation
- **AuditLogger**: Comprehensive operation logging
- **EncryptionManager**: Secure key and data handling

### Technology Stack

#### Core Dependencies (Pinned Versions)
- **MCP SDK**: `@modelcontextprotocol/sdk@^1.12.1` - MCP protocol implementation ([TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk))
- **SAFE Protocol Kit**: `@safe-global/protocol-kit@^4.0.0` - Core Safe wallet interactions
- **SAFE API Kit**: `@safe-global/api-kit@^2.4.0` - Transaction Service API client
- **SAFE Relay Kit**: `@safe-global/relay-kit@^3.0.0` - Gasless transaction support
- **Ethers.js**: `ethers@^6.11.0` - Blockchain interaction and provider management
- **Zod**: `zod@^3.22.0` - Schema validation and type safety
- **TypeScript**: `typescript@^5.3.0` - Type-safe development with strict mode

#### Development Tools
- **Jest**: `jest@^29.7.0` - Testing framework with ESM support
- **ts-jest**: `ts-jest@^29.1.0` - TypeScript support for Jest
- **ESLint**: `eslint@^8.56.0` - Code quality enforcement
- **Prettier**: `prettier@^3.2.0` - Code formatting
- **Husky**: `husky@^9.0.0` - Git hooks for quality gates
- **tsx**: `tsx@^4.7.0` - TypeScript execution for development

## Security Requirements

### 1. Key Management
**Priority: Critical**

#### Requirements
- No hardcoded private keys or API keys in source code
- Secure environment variable handling for sensitive data
- Support for multiple key sources (env, file, runtime)
- Key derivation and encryption for local storage
- Hardware wallet integration support
- Per-call key override capability

#### Implementation
- Multi-source configuration with priority merging
- Environment-based configuration with validation
- Runtime key injection for one-time operations
- Encrypted storage for cached wallet states
- Secure key derivation using industry standards
- Optional hardware wallet integration
- Key reference resolution (env:KEY_NAME, file:/path/to/key)

### 2. Access Control
**Priority: High**

#### Requirements
- Role-based access control for different operation types
- Rate limiting to prevent abuse
- Audit logging for all sensitive operations
- Input validation and sanitization

#### Implementation
- Middleware-based access control system
- Configurable rate limiting per operation type
- Comprehensive audit trail with structured logging
- Zod schema validation for all inputs

### 3. Network Security
**Priority: High**

#### Requirements
- Secure RPC provider communication
- API key protection and rotation
- Network request validation
- DDoS protection mechanisms

#### Implementation
- HTTPS-only communication with RPC providers
- Secure API key storage and automatic rotation
- Request signature validation
- Built-in rate limiting and circuit breakers

## Integration Requirements

### 1. MCP Protocol Compliance
**Priority: Critical**

#### Requirements
- Full MCP 2024-11-05 specification compliance
- Support for tools, resources, and prompts
- Proper error handling and status reporting
- Transport flexibility (stdio, HTTP, WebSocket)

#### Implementation
- Complete MCP server implementation using official SDK
- Comprehensive tool registration with proper schemas
- Resource providers for wallet state and configuration
- Prompt templates for common operations
- Structured error responses with actionable messages
- Multi-transport support with automatic detection

#### MCP Resources
- **Wallet State**: Real-time wallet configuration and status
- **Transaction History**: Recent transactions and pending operations
- **Network Status**: Provider health and gas prices
- **Configuration**: Current server configuration

#### MCP Prompts
- **Create Wallet**: Interactive wallet creation wizard
- **Send Transaction**: Guided transaction builder
- **Add Owner**: Step-by-step owner management
- **Emergency Actions**: Critical operation templates

### 2. SAFE SDK Integration
**Priority: Critical**

#### Requirements
- Support for latest SAFE SDK versions
- Multi-version compatibility for different networks
- Proper adapter implementation for ethers.js
- Transaction service API integration
- Multi-agent transaction coordination support

#### Implementation
- Wrapper layer around SAFE SDKs for enhanced functionality
- Version-specific contract address management
- Custom EthersAdapter implementation for provider compatibility
- Full SAFE transaction service API integration
- Support for multi-signature collection workflows

#### Transaction Flow
Based on SAFE's multi-agent architecture:

**Option 1: Via Transaction Service (Recommended for multi-agent)**
1. **Transaction Proposal**: Agent creates and proposes transaction to Safe Transaction Service
2. **Signature Collection**: Other agents/signers retrieve pending transactions and add signatures
3. **Execution**: Once threshold is met, any agent can execute the transaction
4. **Monitoring**: Track transaction status through the service

**Option 2: Direct On-Chain Execution**
1. **Transaction Creation**: Agent creates transaction locally
2. **Local Signature Collection**: Collect signatures off-chain or from available signers
3. **Direct Execution**: Submit signed transaction directly to blockchain
4. **Confirmation**: Monitor blockchain for transaction confirmation

### 3. Documentation & Examples
**Priority: High**

#### Requirements
- Comprehensive API documentation
- Usage examples for common scenarios
- Integration guides for popular AI frameworks
- Troubleshooting and debugging guides

#### Implementation
- Auto-generated API documentation from code
- Example implementations for various use cases
- Step-by-step integration tutorials
- Comprehensive troubleshooting documentation

## MCP Implementation Details

### Transport Architecture
Based on the [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk), the server supports multiple transport mechanisms:

#### 1. **Stdio Transport** (Primary for Phase 1)
- Best for CLI-based AI integrations
- Simple process communication
- No network overhead
- Example: Claude Desktop integration

#### 2. **Streamable HTTP Transport** (Production)
- Modern bidirectional streaming
- Session management support
- Better for web-based integrations
- Replaces deprecated SSE transport

#### 3. **WebSocket Transport** (Future)
- Real-time bidirectional communication
- Persistent connections
- Ideal for interactive applications

### Server Implementation Patterns

#### High-Level API (McpServer)
Recommended for most use cases:
```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "safe-mcp-server",
  version: "1.0.0"
});

// Dynamic tool registration
server.tool({
  name: "safe_deploy_wallet",
  description: "Deploy a new Safe wallet",
  parameters: z.object({
    owners: z.array(z.string()),
    threshold: z.number(),
    config: z.object({...}).optional()
  }),
  handler: async (params) => {
    // Implementation
  }
});
```

#### Dynamic Tool Management
The SDK supports runtime tool modification:
- **Enable/Disable**: Toggle tools based on permissions
- **Update**: Modify tool parameters or validation
- **Remove**: Completely remove tools at runtime
- **Conditional Registration**: Register tools based on network/config

#### Schema Validation
All inputs/outputs validated using Zod schemas:
```typescript
const WalletConfigSchema = z.object({
  network: z.string().regex(/^eip155:\d+$/), // CAIP-2 validation
  owners: z.array(EthereumAddressSchema),
  threshold: z.number().min(1),
  nonce: z.number().optional(),
  fallbackHandler: EthereumAddressSchema.optional()
});
```

### Connection Lifecycle

#### 1. **Initialization**
- Load configuration from multiple sources
- Validate environment and dependencies
- Initialize network providers
- Set up CAIP-2 registry

#### 2. **Transport Connection**
- Establish transport connection
- Exchange protocol capabilities
- Register available tools based on config
- Set up error handlers

#### 3. **Request Handling**
- Validate incoming requests with schemas
- Route to appropriate tool handlers
- Manage transaction lifecycle
- Return structured responses

#### 4. **Error Management**
- Structured error responses
- Network failover handling
- Graceful degradation
- Detailed error context for debugging

### Tool Categories and Capabilities

#### Core Tool Categories
1. **Wallet Management**: Creation, configuration, deployment
2. **Query Tools**: Information retrieval, balance checks
3. **Transaction Tools**: Creation, signing, execution
4. **Owner Tools**: Add, remove, change threshold
5. **Module Tools**: Enable, disable, query modules

#### Capability Declaration
```typescript
{
  capabilities: {
    tools: {
      safe_deploy_wallet: { network: ["eip155:1", "eip155:137"] },
      safe_execute_transaction: { modes: ["service", "direct"] }
    },
    resources: {
      wallet_state: { refreshInterval: 30000 }
    }
  }
}
```

### Security Considerations for MCP

#### Request Validation
- All tool inputs validated against strict schemas
- CAIP-2 format enforced for network identifiers
- Address validation using checksums
- Parameter bounds checking

#### Permission Models
- Tool availability based on configuration
- Runtime permission upgrades supported
- Audit logging for all operations
- Rate limiting per tool/operation

### MCP Error Handling Patterns

#### Standard Error Types
```typescript
// Network errors
class NetworkError extends Error {
  code = "NETWORK_ERROR";
  details: { network: string; provider: string; }
}

// Validation errors
class ValidationError extends Error {
  code = "VALIDATION_ERROR";
  details: { field: string; value: any; expected: string; }
}

// Safe-specific errors
class SafeOperationError extends Error {
  code = "SAFE_OPERATION_ERROR";
  details: { operation: string; safeAddress: string; reason: string; }
}
```

#### Error Response Format
```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  }
}
```

#### Recovery Strategies
- **Network Failures**: Automatic provider failover
- **Gas Estimation**: Fallback to manual gas limits
- **Transaction Service**: Fallback to direct execution
- **Invalid State**: Clear error messages with resolution steps

## Testing & Development Tools

### MCP Inspector
Based on [MCP documentation](https://modelcontextprotocol.io/docs/tools/inspector), the primary testing tool for development:

#### Features
- **Interactive Testing**: Test individual tools without a full client
- **Real-time Debugging**: Monitor message exchanges
- **Standalone Operation**: No client setup required
- **Quick Iteration**: Rapid development cycles

#### Usage
```bash
# Test server directly
npx @modelcontextprotocol/inspector node ./dist/index.js

# Test with custom config
npx @modelcontextprotocol/inspector node ./dist/index.js --config ./config.json
```

### Claude Desktop Integration
Primary MCP client for initial deployment ([MCP Clients](https://modelcontextprotocol.io/clients)):

#### Configuration Path
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

#### Example Configuration
```json
{
  "mcpServers": {
    "safe-wallet": {
      "command": "node",
      "args": ["/absolute/path/to/safe-mcp-server/dist/index.js"],
      "env": {
        "SAFE_RPC_EIP155_1": "https://eth-mainnet.example.com",
        "SAFE_PRIVATE_KEY_AGENT1": "${SAFE_PRIVATE_KEY_AGENT1}"
      }
    }
  }
}
```

### Development Workflow

#### 1. Local Development
1. Use MCP Inspector for rapid testing
2. Implement tools incrementally
3. Test with various network configurations
4. Validate CAIP-2 handling

#### 2. Integration Testing
1. Configure Claude Desktop
2. Test tool discovery and execution
3. Verify error handling
4. Monitor logs: `tail -f ~/Library/Logs/Claude/mcp*.log`

#### 3. Debugging Best Practices
- **Server Logs**: Use stderr for server logging
- **Structured Logging**: JSON format with levels
- **Request Tracking**: Include request IDs
- **Performance Metrics**: Log timing data

### Client Compatibility Considerations

Based on the [MCP Client Feature Matrix](https://modelcontextprotocol.io/clients):

#### Supported Features by Client
- **Claude Desktop**: ✅ Tools, ✅ Prompts, ✅ Resources
- **Cursor**: ✅ Tools only
- **Continue**: ✅ Tools, ✅ Prompts, ✅ Resources
- **Cline**: ✅ Tools, ✅ Resources

#### Phase 1 Target Clients
1. **Claude Desktop** - Primary target, full feature support
2. **MCP Inspector** - Development and testing
3. **Continue** - VSCode integration testing

### Critical Implementation Notes

Based on [MCP documentation](https://modelcontextprotocol.io/docs/tools/debugging):

#### Logging Requirements
- **Use stderr only**: stdout is reserved for MCP protocol communication
- **Never log to stdout**: This will break protocol operation
- **Structured logging**: Use JSON format for machine parsing
- **Log levels**: info, warning, error, debug

#### Working Directory Considerations
- **Undefined working directory**: Claude Desktop may start from anywhere
- **Always use absolute paths**: Never rely on relative paths
- **Environment variable paths**: Resolve to absolute paths at startup
- **Config file paths**: Store as absolute paths

#### Environment Variable Inheritance
Only these variables are inherited by default:
- `USER`
- `HOME`
- `PATH`

All other environment variables must be explicitly passed in configuration.

## Reference Implementation Examples

### MCP TypeScript SDK Examples
Based on the [MCP TypeScript SDK server examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server), the following patterns are recommended:

#### 1. Basic Server Structure
Reference: `src/examples/server/basic.ts`
- Simple tool registration pattern
- Error handling best practices
- Schema validation examples
- Response formatting

#### 2. Stateful Server Pattern
Reference: `src/examples/server/stateful.ts`
- Managing wallet state across requests
- Session management for multi-agent scenarios
- State persistence patterns
- Resource lifecycle management

#### 3. Dynamic Tool Registration
Reference: `src/examples/server/dynamic.ts`
- Runtime tool enable/disable based on permissions
- Conditional tool registration based on network
- Tool parameter updates at runtime
- Permission-based tool filtering

#### 4. Resource Management
Reference: `src/examples/server/resources.ts`
- Wallet state as MCP resources
- Real-time balance updates
- Transaction history resources
- Resource subscription patterns

#### 5. Prompt Templates
Reference: `src/examples/server/prompts.ts`
- Interactive wallet creation prompts
- Transaction builder templates
- Multi-step operation guides
- Context-aware prompt generation

#### 6. Error Handling Patterns
Reference: `src/examples/server/errors.ts`
```typescript
// Structured error example from SDK
class SafeError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
  }
}

// Error handler wrapper
async function handleToolCall(params: any) {
  try {
    // Tool implementation
  } catch (error) {
    if (error instanceof SafeError) {
      return {
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      };
    }
    // Generic error handling
  }
}
```

### Implementation Patterns to Adopt

#### 1. Server Initialization Pattern
```typescript
// Based on SDK examples
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new McpServer({
  name: "safe-mcp-server",
  version: "1.0.0",
  capabilities: {
    tools: true,
    resources: true,
    prompts: true
  }
});

// Dynamic tool registration based on config
if (config.networks.includes("eip155:1")) {
  server.tool({
    name: "safe_deploy_wallet",
    description: "Deploy Safe wallet on Ethereum",
    // ... implementation
  });
}
```

#### 2. State Management Pattern
```typescript
// From stateful server example
class WalletStateManager {
  private wallets: Map<string, WalletState> = new Map();
  
  async getWalletState(address: string): Promise<WalletState> {
    if (!this.wallets.has(address)) {
      const state = await this.loadWalletState(address);
      this.wallets.set(address, state);
    }
    return this.wallets.get(address)!;
  }
  
  // Resource provider for MCP
  asResource(address: string) {
    return {
      uri: `safe://wallet/${address}`,
      name: `Safe Wallet ${address}`,
      mimeType: "application/json",
      text: JSON.stringify(this.wallets.get(address))
    };
  }
}
```

#### 3. Multi-Transport Support Pattern
```typescript
// Support multiple transports based on environment
const transport = process.env.MCP_TRANSPORT === 'http' 
  ? new StreamableHTTPServerTransport()
  : new StdioServerTransport();

await server.connect(transport);
```

### Example-Driven Development Approach

1. **Start with Basic Server Example**
   - Implement core MCP server structure
   - Add basic tool registration
   - Test with MCP Inspector

2. **Add Stateful Patterns**
   - Implement wallet state management
   - Add session handling for multi-agent
   - Create resource providers

3. **Implement Dynamic Features**
   - Network-based tool registration
   - Permission-based tool filtering
   - Runtime configuration updates

4. **Advanced Patterns**
   - Prompt templates for complex operations
   - Resource subscriptions for real-time updates
   - Advanced error recovery patterns

## Performance Requirements

### 1. Response Times
**Priority: High**

#### Requirements
- Wallet queries: < 2 seconds
- Transaction simulation: < 5 seconds
- Wallet deployment: < 30 seconds
- Batch operations: < 10 seconds per batch

#### Implementation
- Efficient caching strategies for frequently accessed data
- Connection pooling for RPC providers
- Parallel processing for batch operations
- Performance monitoring and optimization

### 2. Scalability
**Priority: Medium**

#### Requirements
- Support 100+ concurrent operations
- Handle 1000+ wallet queries per hour
- Manage 50+ simultaneous network connections
- Scale horizontally with multiple instances

#### Implementation
- Stateless server design for horizontal scaling
- Connection pooling and multiplexing
- Efficient memory management
- Basic load distribution support

### 3. Reliability
**Priority: High**

#### Requirements
- 99.9% uptime for production deployments
- Automatic failover for RPC provider outages
- Graceful degradation under high load
- Comprehensive error recovery mechanisms

#### Implementation
- Health checks for all external dependencies
- Circuit breaker patterns for external services
- Graceful shutdown procedures with cleanup
- Error recovery and retry mechanisms

## Deployment & Operations

### 1. Environment Support
**Priority: High**

#### Requirements
- Development, staging, and production environment support
- Simple deployment with npm/yarn
- Environment-specific configuration management
- Basic Docker support for containerization

#### Implementation
- Environment-based configuration with validation
- npm scripts for easy deployment
- Simple Docker container for basic isolation
- Environment variable management

### 2. Monitoring & Observability
**Priority: Medium**

#### Requirements
- Comprehensive logging with structured format
- Basic performance metrics
- Health check endpoints
- Error tracking

#### Implementation
- Structured JSON logging with configurable levels
- Basic metrics collection
- Simple health check endpoint
- Error logging with context

### 3. Maintenance & Updates
**Priority: Medium**

#### Requirements
- Automated dependency updates
- Backwards compatibility guarantees
- Simple update procedures

#### Implementation
- Dependabot for security updates
- Semantic versioning
- Clear upgrade guides
- Migration scripts when needed

## Quick Start Guide

### Prerequisites
- Node.js 18+ (for native fetch support)
- npm or yarn
- Git

### Initial Setup
```bash
# Clone the repository
git clone https://github.com/your-org/safe-mcp-server.git
cd safe-mcp-server

# Install dependencies
npm install

# Copy example configuration
cp .env.example .env

# Run tests with MCP Inspector
npx @modelcontextprotocol/inspector npm start
```

### Development Flow
1. **Study SDK Examples**
   ```bash
   # Clone MCP SDK for reference
   git clone https://github.com/modelcontextprotocol/typescript-sdk.git
   cd typescript-sdk/src/examples/server
   ```

2. **Start with Basic Server**
   - Copy pattern from `basic.ts`
   - Implement first tool: `safe_get_info`
   - Test with Inspector

3. **Add State Management**
   - Use patterns from `stateful.ts`
   - Implement wallet state cache
   - Add resource providers

4. **Enable Dynamic Features**
   - Reference `dynamic.ts` for runtime changes
   - Add network-based tool filtering
   - Implement permission system

### Example Tool Implementation
```typescript
// Based on SDK examples
server.tool({
  name: "safe_get_info",
  description: "Get Safe wallet information",
  parameters: z.object({
    address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
    network: z.string().regex(/^eip155:\d+$/),
    config: z.object({
      rpcUrl: z.string().url().optional(),
      apiKey: z.string().optional()
    }).optional()
  }),
  handler: async (params) => {
    try {
      const provider = await networkManager.getProvider(params.network, params.config);
      const safe = await safeManager.getSafe(params.address, provider);
      
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            address: params.address,
            owners: await safe.getOwners(),
            threshold: await safe.getThreshold(),
            version: await safe.getVersion()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new SafeError(
        `Failed to get Safe info: ${error.message}`,
        "SAFE_INFO_ERROR",
        { address: params.address, network: params.network }
      );
    }
  }
});
```

## Task Breakdown

### Phase 1: Core Infrastructure (Weeks 1-3)

#### Week 1: Project Setup & Configuration
1. **Project Initialization**
   - Initialize TypeScript project with strict mode
   - Configure ESLint, Prettier, Husky
   - Set up Jest with ESM support
   - Create basic folder structure
   - Clone [MCP SDK examples](https://github.com/modelcontextprotocol/typescript-sdk/tree/main/src/examples/server) for reference

2. **Configuration System**
   - Implement ConfigLoader with multi-source support (ref: `server/stateful.ts`)
   - Add CAIP-2 registry and validation
   - Create environment variable schemas
   - Build configuration merger with priority handling
   - Test with MCP Inspector

3. **Network Abstraction**
   - Implement NetworkProviderManager
   - Add provider health monitoring
   - Create fallback mechanisms
   - Set up CAIP-2 to RPC mapping
   - Use error patterns from `server/errors.ts`

#### Week 2: MCP Server Foundation
1. **Basic MCP Server**
   - Set up McpServer with stdio transport
   - Implement tool registration system
   - Add schema validation with Zod
   - Create error handling framework

2. **SAFE SDK Integration**
   - Integrate protocol-kit, api-kit
   - Create SafeProtocolKit wrapper
   - Implement EthersAdapter
   - Add network-specific configurations

3. **Testing Infrastructure**
   - Set up MCP Inspector integration
   - Create test utilities
   - Implement mock providers
   - Add integration test framework

#### Week 3: Core Tools Implementation
1. **Query Tools**
   - `safe_get_info` - Wallet information
   - `safe_get_balance` - Balance queries
   - `safe_get_owners` - Owner list
   - `safe_get_transaction_hash` - Hash calculation

2. **Wallet Creation Tools**
   - `safe_create_wallet_config` - Config validation
   - `safe_predict_address` - Address prediction
   - `safe_deploy_wallet` - Wallet deployment

3. **Direct Execution Tools**
   - `safe_send_eth_direct` - Direct ETH transfers
   - `safe_send_token_direct` - Token transfers
   - `safe_contract_interaction` - Custom calls

### Phase 2: Advanced Features (Weeks 4-6)

#### Week 4: Transaction Management
1. **Transaction Service Integration**
   - Implement Safe Transaction Service client
   - Add transaction proposal system
   - Build signature collection logic
   - Create execution coordination

2. **Transaction Tools**
   - `safe_propose_transaction`
   - `safe_get_pending_transactions`
   - `safe_sign_transaction`
   - `safe_execute_transaction`

3. **Batch Operations**
   - Transaction batching support
   - Multi-call optimization
   - Gas estimation improvements

#### Week 5: Owner & Module Management
1. **Owner Management Tools**
   - `safe_add_owner`
   - `safe_remove_owner`
   - `safe_swap_owner`
   - `safe_change_threshold`

2. **Module Management**
   - `safe_enable_module`
   - `safe_disable_module`
   - `safe_query_modules`
   - Module compatibility checks

3. **Security Enhancements**
   - Permission validation
   - Operation audit logging
   - Rate limiting implementation

#### Week 6: Multi-Network & Production Features
1. **Multi-Network Support**
   - Add all 9+ target networks
   - Network-specific optimizations
   - Cross-chain coordination
   - Service endpoint mapping

2. **Production Hardening**
   - Performance optimization
   - Enhanced error recovery
   - Monitoring integration
   - Documentation completion

3. **Claude Desktop Integration**
   - Create installation guide
   - Add example configurations
   - Build demo workflows
   - Test all features end-to-end

### Testing Strategy

#### Unit Testing (Continuous)
- Tool handler logic
- Configuration parsing
- Network management
- CAIP-2 resolution

#### Integration Testing (Weekly)
- MCP Inspector validation
- Network provider testing
- Safe SDK integration
- Transaction flow testing

#### End-to-End Testing (Phase completion)
- Claude Desktop integration
- Multi-agent scenarios
- Network failover
- Performance benchmarks

### Documentation Deliverables

#### Phase 1 Documentation
- Installation guide
- Basic usage examples
- Configuration reference
- Troubleshooting guide

#### Phase 2 Documentation
- Advanced features guide
- Multi-agent tutorials
- API reference
- Performance tuning guide

## Success Criteria

### Phase 1: Core Functionality (Weeks 1-3)
- ❌ Basic wallet creation and management tools
- ❌ Support for Ethereum mainnet and Sepolia testnet
- ❌ MCP server with stdio transport
- ❌ Direct smart contract interaction (bypass Transaction Service)
- ❌ Local signature collection and execution
- ❌ Flexible configuration system (env, file, runtime)
- ❌ Comprehensive unit test coverage (>80%)

### Phase 2: Production Readiness (Weeks 4-6)
- ❌ Multi-network support (9+ networks)
- ❌ HTTP and WebSocket transport support
- ❌ Safe Transaction Service integration
- ❌ Hybrid execution mode (service + direct fallback)
- ❌ Security audit completion
- ❌ Performance optimization (sub-2s queries)

### Phase 3: Advanced Features (Future)
- ❌ Module and guard management
- ❌ Transaction batching and queuing
- ❌ Hardware wallet integration
- ❌ Advanced monitoring and alerting

### Phase 4: Ecosystem Integration (Future)
- ❌ Popular AI framework integrations
- ❌ Community examples and templates
- ❌ Developer tools and utilities
- ❌ Ecosystem partnership programs

## Risk Assessment

### Technical Risks
1. **SAFE SDK Breaking Changes**: Medium probability, high impact
   - Mitigation: Version pinning and compatibility testing
2. **Network RPC Instability**: High probability, medium impact
   - Mitigation: Multiple provider support with failover
3. **Security Vulnerabilities**: Low probability, high impact
   - Mitigation: Regular security audits and updates

### Business Risks
1. **Market Adoption**: Medium probability, high impact
   - Mitigation: Strong developer experience and documentation
2. **Competitor Solutions**: Medium probability, medium impact
   - Mitigation: Unique AI-native approach and superior UX
3. **Regulatory Changes**: Low probability, high impact
   - Mitigation: Compliance monitoring and adaptive architecture

## Conclusion

The SAFE MCP Server represents a critical infrastructure component for AI-driven blockchain applications. By providing a standardized, secure, and efficient interface for SAFE multisig wallet management, this project enables a new generation of AI-powered financial applications while maintaining the highest security standards required for production use.

The project's success will be measured by its adoption within the AI and blockchain development communities, its performance under production workloads, and its contribution to the broader ecosystem of AI-blockchain integration tools.

## Implementation Notes

### Multi-Agent Coordination
Based on SAFE's architecture, the MCP server should support scenarios where multiple AI agents collaborate on wallet management:

1. **Agent Roles**:
   - **Proposer Agents**: Can create and propose transactions
   - **Signer Agents**: Can review and sign pending transactions
   - **Executor Agents**: Can execute fully signed transactions
   - **Monitor Agents**: Can track transaction status and report

2. **Coordination Flow**:
   - Agent A creates a transaction and proposes it to the Safe Transaction Service
   - Agents B, C receive notifications of pending transactions
   - Each agent independently validates and signs if approved
   - Any agent can execute once threshold is reached
   - All agents can monitor status through the service

3. **Key Considerations**:
   - Each agent needs its own private key and address
   - Agents must be added as Safe owners during wallet creation
   - Transaction Service acts as the coordination layer
   - No direct agent-to-agent communication required

### Network-Specific Considerations
- **Gas Optimization**: Different strategies per network (e.g., EIP-1559 for Ethereum, fixed gas for some L2s)
- **Block Times**: Affects transaction confirmation expectations
- **Contract Addresses**: Safe contracts deployed at consistent addresses across networks
- **API Availability**: Not all networks have full Transaction Service support
- **Direct Execution**: Required for networks without Transaction Service or for immediate execution needs

### Smart Contract Interaction Modes

1. **Service-Based Mode** (Default):
   - Uses Safe Transaction Service for coordination
   - Best for multi-signature scenarios with remote signers
   - Provides transaction history and UI visibility
   - Supports asynchronous signature collection

2. **Direct Mode**:
   - Bypasses Transaction Service entirely
   - Executes transactions directly on-chain
   - Requires all signatures to be available locally
   - Lower latency, no external dependencies
   - Ideal for single-signer or automated scenarios

3. **Hybrid Mode**:
   - Attempts service-based first, falls back to direct
   - Configurable per transaction or globally
   - Ensures maximum compatibility and flexibility

## Configuration Management

### Configuration Sources (Priority Order)
1. **Runtime Parameters**: Passed directly in tool calls (highest priority)
2. **Environment Variables**: System environment configuration
3. **Configuration Files**: JSON/YAML configuration files
4. **Default Values**: Built-in safe defaults (lowest priority)

### Configuration Options

#### Network Configuration
```typescript
{
  "networks": {
    "eip155:1": {                                 // Ethereum mainnet (CAIP-2)
      "rpcUrl": "https://eth.example.com",
      "chainId": 1,
      "apiKey": "your-api-key",
      "timeout": 30000,
      "retries": 3
    },
    "eip155:137": {                               // Polygon (CAIP-2)
      "rpcUrl": "https://polygon-rpc.com",
      "chainId": 137,
      "apiKey": "your-api-key"
    }
  }
}
```

#### Security Configuration
```typescript
{
  "security": {
    "privateKeys": {
      "agent1": "0x...",                          // Never hardcode in production
      "agent2": "env:AGENT2_PRIVATE_KEY"         // Reference env variable
    },
    "apiKeys": {
      "infura": "env:INFURA_API_KEY",
      "alchemy": "file:/secrets/alchemy.key"      // Reference file
    }
  }
}
```

### Configuration Methods

#### 1. Environment Variables
```bash
# Network configuration using CAIP-2
SAFE_RPC_EIP155_1=https://eth.example.com         # Ethereum mainnet
SAFE_RPC_EIP155_137=https://polygon.example.com   # Polygon
SAFE_API_KEY_INFURA=your-infura-key

# Security configuration  
SAFE_PRIVATE_KEY_AGENT1=0x...
SAFE_PRIVATE_KEY_AGENT2=0x...

# Service configuration
SAFE_TX_SERVICE_URL=https://safe-transaction-mainnet.safe.global
SAFE_DEFAULT_NETWORK=eip155:1                     # CAIP-2 format
```

#### 2. Configuration File
```json
// safe-mcp-config.json
{
  "version": "1.0",
  "defaultNetwork": "eip155:1",                    // CAIP-2 format
  "networks": {
    "eip155:1": {                                  // Ethereum mainnet
      "rpcUrl": "${SAFE_RPC_EIP155_1}",
      "transactionService": "https://safe-transaction-mainnet.safe.global"
    },
    "eip155:137": {                                // Polygon
      "rpcUrl": "${SAFE_RPC_EIP155_137}",
      "transactionService": "https://safe-transaction-polygon.safe.global"
    }
  },
  "agents": {
    "proposer": {
      "address": "0x...",
      "privateKey": "${SAFE_PRIVATE_KEY_PROPOSER}"
    }
  }
}
```

#### 3. Runtime Override
```typescript
// Override configuration per tool call
await mcp.callTool('safe_deploy_wallet', {
  owners: ['0x...'],
  threshold: 2,
  // Runtime config override
  config: {
    network: 'eip155:137',                         // CAIP-2 format
    rpcUrl: 'https://custom-polygon-rpc.com',
    privateKey: '0x...',  // One-time use key
    gasPrice: '100'       // Custom gas settings
  }
});
```

### Configuration Validation

#### Required Fields
- Network identifier (CAIP-2 format: `eip155:chainId`)
- At least one RPC URL per network
- Valid private key for transaction signing

#### Optional Fields
- API keys for premium RPC providers
- Transaction Service URLs
- Custom gas strategies
- Timeout and retry settings

### Security Best Practices

#### Key Management
1. **Never hardcode private keys** in source code
2. **Use environment variables** for development
3. **Use secure key management** (AWS KMS, HashiCorp Vault) for production
4. **Support hardware wallets** for maximum security
5. **Implement key rotation** capabilities

#### Configuration Security
1. **Validate all inputs** before use
2. **Mask sensitive values** in logs
3. **Encrypt configuration files** containing secrets
4. **Use least privilege** for API keys
5. **Implement rate limiting** per key/identity

### Network Identification Standards

The MCP server uses **CAIP-2** (Chain Agnostic Improvement Proposal) for network identification to ensure unambiguous network references across different contexts.

#### CAIP-2 Format
- Format: `namespace:reference`
- For EVM chains: `eip155:{chainId}`
- Examples:
  - `eip155:1` - Ethereum Mainnet
  - `eip155:137` - Polygon
  - `eip155:42161` - Arbitrum One
  - `eip155:11155111` - Sepolia Testnet

#### Benefits of CAIP-2
- **Unambiguous**: No confusion between "polygon" vs "matic" vs "polygon-mainnet"
- **Standardized**: Industry-wide standard for cross-chain identification
- **Machine-readable**: Easy parsing and validation
- **Future-proof**: Supports non-EVM chains with different namespaces

### CAIP-2 Common Networks Registry

The MCP server includes a built-in registry of common CAIP-2 identifiers for LLM understanding:

#### Mainnet Registry
```typescript
const CAIP2_REGISTRY = {
  // Ethereum Ecosystem
  "eip155:1": { name: "Ethereum Mainnet", symbol: "ETH", aliases: ["ethereum", "eth", "mainnet"] },
  "eip155:137": { name: "Polygon", symbol: "MATIC", aliases: ["polygon", "matic", "polygon-pos"] },
  "eip155:10": { name: "Optimism", symbol: "ETH", aliases: ["optimism", "op-mainnet"] },
  "eip155:42161": { name: "Arbitrum One", symbol: "ETH", aliases: ["arbitrum", "arb1", "arbitrum-one"] },
  "eip155:8453": { name: "Base", symbol: "ETH", aliases: ["base", "base-mainnet"] },
  "eip155:100": { name: "Gnosis Chain", symbol: "xDAI", aliases: ["gnosis", "xdai", "gnosis-chain"] },
  "eip155:43114": { name: "Avalanche C-Chain", symbol: "AVAX", aliases: ["avalanche", "avax", "c-chain"] },
  "eip155:56": { name: "BNB Smart Chain", symbol: "BNB", aliases: ["bsc", "binance", "bnb-chain"] },
  "eip155:250": { name: "Fantom", symbol: "FTM", aliases: ["fantom", "ftm"] },
  "eip155:42220": { name: "Celo", symbol: "CELO", aliases: ["celo"] },
}

// Testnet Registry
const TESTNET_REGISTRY = {
  "eip155:11155111": { name: "Sepolia", symbol: "ETH", aliases: ["sepolia", "eth-sepolia"] },
  "eip155:80001": { name: "Polygon Mumbai", symbol: "MATIC", aliases: ["mumbai", "polygon-mumbai"] },
  "eip155:421614": { name: "Arbitrum Sepolia", symbol: "ETH", aliases: ["arbitrum-sepolia", "arb-sepolia"] },
  "eip155:84532": { name: "Base Sepolia", symbol: "ETH", aliases: ["base-sepolia"] },
  "eip155:11155420": { name: "Optimism Sepolia", symbol: "ETH", aliases: ["optimism-sepolia", "op-sepolia"] },
}
```

#### Registry Features
- **Alias Resolution**: Convert common names to CAIP-2 format
- **Name Lookup**: Get human-readable names from CAIP-2 IDs
- **Symbol Mapping**: Native token symbols for each network
- **LLM Context**: Provides context for natural language understanding

---

**Document Version**: 1.6  
**Last Updated**: December 9, 2024  
**Document Owner**: SAFE MCP Server Development Team  
**Review Cycle**: Monthly during active development

### Version History
- **1.6**: Added MCP SDK example references, Quick Start Guide, implementation patterns from TypeScript SDK
- **1.5**: Added detailed task breakdown, MCP Inspector testing workflow, Claude Desktop integration guide, critical implementation notes
- **1.4**: Enhanced MCP implementation details, added resources/prompts support, error handling patterns
- **1.3**: Updated to CAIP-2 network identification standard
- **1.2**: Added flexible configuration management (env, file, runtime)
- **1.1**: Added direct contract interaction, removed premature optimization
- **1.0**: Initial release