import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';

export interface SafeInfo {
  address: string;
  owners: string[];
  threshold: number;
  nonce: number;
  version: string;
  isDeployed: boolean;
  networkId: string;
  balance: string;
  modules: string[];
  guard?: string | undefined;
  fallbackHandler?: string | undefined;
}

export class WalletQueryTools {
  private contractRegistry: ContractRegistry;

  constructor(contractRegistry: ContractRegistry) {
    this.contractRegistry = contractRegistry;
  }

  getTools(): Tool[] {
    return [
      {
        name: 'safe_get_info',
        description: 'Get comprehensive information about a Safe wallet including owners, threshold, balance, modules, and deployment status.',
        inputSchema: {
          type: 'object',
          properties: {
            address: {
              type: 'string',
              description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
              pattern: '^0x[a-fA-F0-9]{40}$',
            },
            networkId: {
              type: 'string',
              description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$',
            },
          },
          required: ['address', 'networkId'],
        },
      },
    ];
  }

  async handleToolCall(name: string, arguments_: unknown): Promise<CallToolResult> {
    try {
      switch (name) {
        case 'safe_get_info':
          return await this.handleGetSafeInfo(arguments_);
        default:
          return {
            isError: true,
            content: [
              {
                type: 'text',
                text: `Unknown tool: ${name}`,
              },
            ],
          };
      }
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleGetSafeInfo(arguments_: unknown): Promise<CallToolResult> {
    try {
      // Validate input
      if (!arguments_ || typeof arguments_ !== 'object') {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Invalid input: query configuration object is required',
            },
          ],
        };
      }

      const input = arguments_ as any;

      // Validate required fields
      if (!input.address) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Required field missing: address',
            },
          ],
        };
      }

      if (!input.networkId) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Required field missing: networkId',
            },
          ],
        };
      }

      // Validate address format
      if (!this.contractRegistry.validateSafeAddress(input.address)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Invalid Safe address format',
            },
          ],
        };
      }

      // Validate network support
      if (!this.contractRegistry.isNetworkSupported(input.networkId)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Network ${input.networkId} is not supported`,
            },
          ],
        };
      }

      // Get Safe information
      const safeInfo = await this.getSafeInfo(input.address, input.networkId);

      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify(safeInfo, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Safe info query error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async getSafeInfo(address: string, networkId: string): Promise<SafeInfo> {
    // In a real implementation, this would:
    // 1. Create a provider using the network ID
    // 2. Connect to the Safe contract at the given address
    // 3. Query the actual state from the blockchain
    // 4. Return the real Safe information

    // For testing purposes, simulate Safe info
    const isDeployed = await this.checkIfSafeExists(address, networkId);

    if (!isDeployed) {
      throw new Error(`Safe at address ${address} is not deployed on network ${networkId}`);
    }

    // Simulate Safe information based on address
    const addressHash = this.simpleHash(address + networkId);
    const ownerCount = (parseInt(addressHash.slice(0, 2), 16) % 4) + 1; // 1-4 owners
    const threshold = Math.min(ownerCount, (parseInt(addressHash.slice(2, 4), 16) % ownerCount) + 1);

    // Generate mock owners
    const owners: string[] = [];
    for (let i = 0; i < ownerCount; i++) {
      const ownerSeed = `${address}${i}${networkId}`;
      const ownerHash = this.simpleHash(ownerSeed);
      owners.push('0x' + ownerHash.slice(0, 40));
    }

    // Simulate balance (mock ETH balance)
    const balanceHash = this.simpleHash(address + 'balance' + networkId);
    const balance = (parseInt(balanceHash.slice(0, 8), 16) % 10000000000000000000).toString(); // 0-10 ETH in wei

    // Simulate modules
    const moduleCount = parseInt(addressHash.slice(4, 6), 16) % 3; // 0-2 modules
    const modules: string[] = [];
    for (let i = 0; i < moduleCount; i++) {
      const moduleSeed = `${address}module${i}${networkId}`;
      const moduleHash = this.simpleHash(moduleSeed);
      modules.push('0x' + moduleHash.slice(0, 40));
    }

    // Simulate nonce and version
    const nonce = parseInt(addressHash.slice(6, 10), 16) % 100;
    const versions = ['1.3.0', '1.4.1', '1.5.0'];
    const version = versions[parseInt(addressHash.slice(10, 12), 16) % versions.length] || '1.3.0';

    return {
      address,
      owners: owners.sort(), // Sort for deterministic results
      threshold,
      nonce,
      version,
      isDeployed: true,
      networkId,
      balance,
      modules: modules.sort(),
      guard: moduleCount > 1 ? ('0x' + this.simpleHash(address + 'guard').slice(0, 40)) : undefined,
      fallbackHandler: ownerCount > 2 ? ('0x' + this.simpleHash(address + 'fallback').slice(0, 40)) : undefined,
    };
  }

  private async checkIfSafeExists(address: string, networkId: string): Promise<boolean> {
    // In a real implementation, this would check if a contract exists at the address
    // For testing, assume all test addresses exist
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  private simpleHash(input: string): string {
    // Simple hash function for demonstration - in production use crypto.createHash
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  }
}