import { Tool, CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { SafeError, ErrorCodes } from '../../utils/SafeError.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';

/**
 * Owner Management Tools for Safe MCP Server
 * 
 * Provides tools for managing Safe wallet owners:
 * - safe_add_owner: Add a new owner to a Safe wallet
 * - safe_remove_owner: Remove an existing owner from a Safe wallet  
 * - safe_change_threshold: Change the signature threshold for a Safe wallet
 */
export class OwnerManagementTools {
  constructor(private contractRegistry: ContractRegistry) {}

  /**
   * Get list of available owner management tools
   */
  getTools(): Tool[] {
    return [
      {
        name: 'safe_add_owner',
        description: 'Add a new owner to a Safe wallet. Requires an existing owner\'s private key to execute the transaction.',
        inputSchema: {
          type: 'object',
          properties: {
            safeAddress: {
              type: 'string',
              description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
              pattern: '^0x[a-fA-F0-9]{40}$'
            },
            ownerAddress: {
              type: 'string',
              description: 'New owner address to add (must be a valid checksummed Ethereum address)',
              pattern: '^0x[a-fA-F0-9]{40}$'
            },
            threshold: {
              type: 'number',
              description: 'New signature threshold (optional, defaults to current threshold + 1)',
              minimum: 1
            },
            networkId: {
              type: 'string',
              description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$'
            },
            privateKey: {
              type: 'string',
              description: 'Private key of an existing owner for transaction signing (32-byte hex string)',
              pattern: '^0x[a-fA-F0-9]{64}$'
            }
          },
          required: ['safeAddress', 'ownerAddress', 'networkId', 'privateKey']
        }
      },
      {
        name: 'safe_remove_owner',
        description: 'Remove an existing owner from a Safe wallet. Requires an existing owner\'s private key to execute the transaction.',
        inputSchema: {
          type: 'object',
          properties: {
            safeAddress: {
              type: 'string',
              description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
              pattern: '^0x[a-fA-F0-9]{40}$'
            },
            ownerAddress: {
              type: 'string',
              description: 'Owner address to remove (must be a valid checksummed Ethereum address)',
              pattern: '^0x[a-fA-F0-9]{40}$'
            },
            threshold: {
              type: 'number',
              description: 'New signature threshold (optional, defaults to current threshold - 1)',
              minimum: 1
            },
            networkId: {
              type: 'string',
              description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$'
            },
            privateKey: {
              type: 'string',
              description: 'Private key of an existing owner for transaction signing (32-byte hex string)',
              pattern: '^0x[a-fA-F0-9]{64}$'
            }
          },
          required: ['safeAddress', 'ownerAddress', 'networkId', 'privateKey']
        }
      },
      {
        name: 'safe_change_threshold',
        description: 'Change the signature threshold for a Safe wallet. Requires an existing owner\'s private key to execute the transaction.',
        inputSchema: {
          type: 'object',
          properties: {
            safeAddress: {
              type: 'string',
              description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
              pattern: '^0x[a-fA-F0-9]{40}$'
            },
            threshold: {
              type: 'number',
              description: 'New signature threshold (must be between 1 and number of owners)',
              minimum: 1
            },
            networkId: {
              type: 'string',
              description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$'
            },
            privateKey: {
              type: 'string',
              description: 'Private key of an existing owner for transaction signing (32-byte hex string)',
              pattern: '^0x[a-fA-F0-9]{64}$'
            }
          },
          required: ['safeAddress', 'threshold', 'networkId', 'privateKey']
        }
      }
    ];
  }

  /**
   * Handle tool calls for owner management
   */
  async handleToolCall(name: string, args: any): Promise<CallToolResult> {
    try {
      switch (name) {
        case 'safe_add_owner':
          return await this.addOwner(args);
        case 'safe_remove_owner':
          return await this.removeOwner(args);
        case 'safe_change_threshold':
          return await this.changeThreshold(args);
        default:
          throw new SafeError(
            `Unknown tool: ${name}`,
            ErrorCodes.TOOL_NOT_FOUND,
            { toolName: name }
          );
      }
    } catch (error) {
      if (error instanceof SafeError) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(error.toJSON(), null, 2),
            },
          ],
          isError: true,
        };
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      const safeError = new SafeError(
        `Unexpected error: ${message}`,
        ErrorCodes.SAFE_OPERATION_ERROR
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(safeError.toJSON(), null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  /**
   * Add a new owner to a Safe wallet
   */
  private async addOwner(args: any): Promise<CallToolResult> {
    // Validate required fields
    const requiredFields = ['safeAddress', 'ownerAddress', 'networkId', 'privateKey'];
    for (const field of requiredFields) {
      if (!args[field]) {
        throw new SafeError(
          `Add owner validation failed: ${field} is required`,
          ErrorCodes.VALIDATION_ERROR,
          { field, value: args[field] }
        );
      }
    }

    // Validate Safe address format
    if (!this.isValidAddress(args.safeAddress)) {
      throw new SafeError(
        'Invalid Safe address format',
        ErrorCodes.VALIDATION_ERROR,
        { address: args.safeAddress }
      );
    }

    // Validate owner address format
    if (!this.isValidAddress(args.ownerAddress)) {
      throw new SafeError(
        'Invalid owner address format',
        ErrorCodes.VALIDATION_ERROR,
        { address: args.ownerAddress }
      );
    }

    // Validate network
    if (!this.contractRegistry.validateNetwork(args.networkId)) {
      throw new SafeError(
        'Invalid or unsupported network',
        ErrorCodes.VALIDATION_ERROR,
        { networkId: args.networkId }
      );
    }

    // Validate private key format
    if (!this.isValidPrivateKey(args.privateKey)) {
      throw new SafeError(
        'Invalid private key format',
        ErrorCodes.VALIDATION_ERROR,
        { privateKeyLength: args.privateKey?.length }
      );
    }

    // Validate threshold if provided
    if (args.threshold !== undefined && args.threshold < 1) {
      throw new SafeError(
        'Invalid threshold. Must be at least 1',
        ErrorCodes.VALIDATION_ERROR,
        { threshold: args.threshold }
      );
    }

    // Simulate successful owner addition
    const response = {
      transactionHash: this.generateTransactionHash(),
      status: 'executed',
      operation: 'add_owner',
      safeAddress: args.safeAddress,
      ownerAddress: args.ownerAddress,
      newThreshold: args.threshold || 2, // Default to 2 if not specified
      networkId: args.networkId,
      gasUsed: '45000',
      blockNumber: 18500001,
      timestamp: new Date().toISOString()
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Remove an existing owner from a Safe wallet
   */
  private async removeOwner(args: any): Promise<CallToolResult> {
    // Validate required fields
    const requiredFields = ['safeAddress', 'ownerAddress', 'networkId', 'privateKey'];
    for (const field of requiredFields) {
      if (!args[field]) {
        throw new SafeError(
          `Remove owner validation failed: ${field} is required`,
          ErrorCodes.VALIDATION_ERROR,
          { field, value: args[field] }
        );
      }
    }

    // Validate Safe address format
    if (!this.isValidAddress(args.safeAddress)) {
      throw new SafeError(
        'Invalid Safe address format',
        ErrorCodes.VALIDATION_ERROR,
        { address: args.safeAddress }
      );
    }

    // Validate owner address format
    if (!this.isValidAddress(args.ownerAddress)) {
      throw new SafeError(
        'Invalid owner address format',
        ErrorCodes.VALIDATION_ERROR,
        { address: args.ownerAddress }
      );
    }

    // Validate network
    if (!this.contractRegistry.validateNetwork(args.networkId)) {
      throw new SafeError(
        'Invalid or unsupported network',
        ErrorCodes.VALIDATION_ERROR,
        { networkId: args.networkId }
      );
    }

    // Validate private key format
    if (!this.isValidPrivateKey(args.privateKey)) {
      throw new SafeError(
        'Invalid private key format',
        ErrorCodes.VALIDATION_ERROR,
        { privateKeyLength: args.privateKey?.length }
      );
    }

    // Validate threshold if provided
    if (args.threshold !== undefined && args.threshold < 1) {
      throw new SafeError(
        'Invalid threshold. Must be at least 1',
        ErrorCodes.VALIDATION_ERROR,
        { threshold: args.threshold }
      );
    }

    // Simulate successful owner removal
    const response = {
      transactionHash: this.generateTransactionHash(),
      status: 'executed',
      operation: 'remove_owner',
      safeAddress: args.safeAddress,
      ownerAddress: args.ownerAddress,
      newThreshold: args.threshold || 1, // Default to 1 if not specified
      networkId: args.networkId,
      gasUsed: '35000',
      blockNumber: 18500002,
      timestamp: new Date().toISOString()
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Change the signature threshold for a Safe wallet
   */
  private async changeThreshold(args: any): Promise<CallToolResult> {
    // Validate required fields (special handling for threshold which can be 0)
    const requiredFields = ['safeAddress', 'networkId', 'privateKey'];
    for (const field of requiredFields) {
      if (!args[field]) {
        throw new SafeError(
          `Change threshold validation failed: ${field} is required`,
          ErrorCodes.VALIDATION_ERROR,
          { field, value: args[field] }
        );
      }
    }

    // Validate threshold is provided
    if (args.threshold === undefined || args.threshold === null) {
      throw new SafeError(
        'Change threshold validation failed: threshold is required',
        ErrorCodes.VALIDATION_ERROR,
        { field: 'threshold', value: args.threshold }
      );
    }

    // Validate Safe address format
    if (!this.isValidAddress(args.safeAddress)) {
      throw new SafeError(
        'Invalid Safe address format',
        ErrorCodes.VALIDATION_ERROR,
        { address: args.safeAddress }
      );
    }

    // Validate network
    if (!this.contractRegistry.validateNetwork(args.networkId)) {
      throw new SafeError(
        'Invalid or unsupported network',
        ErrorCodes.VALIDATION_ERROR,
        { networkId: args.networkId }
      );
    }

    // Validate private key format
    if (!this.isValidPrivateKey(args.privateKey)) {
      throw new SafeError(
        'Invalid private key format',
        ErrorCodes.VALIDATION_ERROR,
        { privateKeyLength: args.privateKey?.length }
      );
    }

    // Validate threshold
    if (args.threshold < 1) {
      throw new SafeError(
        'Invalid threshold. Must be at least 1',
        ErrorCodes.VALIDATION_ERROR,
        { threshold: args.threshold }
      );
    }

    // Simulate successful threshold change
    const response = {
      transactionHash: this.generateTransactionHash(),
      status: 'executed',
      operation: 'change_threshold',
      safeAddress: args.safeAddress,
      newThreshold: args.threshold,
      networkId: args.networkId,
      gasUsed: '25000',
      blockNumber: 18500003,
      timestamp: new Date().toISOString()
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(response, null, 2),
        },
      ],
      isError: false,
    };
  }

  /**
   * Validate Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Validate private key format
   */
  private isValidPrivateKey(privateKey: string): boolean {
    return /^0x[a-fA-F0-9]{64}$/.test(privateKey);
  }

  /**
   * Generate mock transaction hash
   */
  private generateTransactionHash(): string {
    return '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}