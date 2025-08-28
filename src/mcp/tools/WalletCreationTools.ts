import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ContractRegistry } from '../../network/ContractRegistry.js';
import { SafeError } from '../../utils/SafeError.js';
import { ProviderFactory } from '../../blockchain/ProviderFactory.js';
import { SafeAccountConfig } from '@safe-global/protocol-kit';

export interface WalletConfig {
  owners: string[];
  threshold: number;
  networkId: string;
  saltNonce?: string;
  fallbackHandler?: string;
  modules?: string[];
  guard?: string;
  paymentToken?: string;
  payment?: string;
  paymentReceiver?: string;
}

export interface ConfigValidationResult {
  isValid: boolean;
  configuration?: WalletConfig | undefined;
  errors: string[];
  warnings: string[];
}

export interface AddressPredictionResult {
  address: string;
  isDeployed: boolean;
  networkId: string;
  configuration: WalletConfig;
  saltNonce?: string | undefined;
}

export interface WalletDeploymentConfig extends WalletConfig {
  privateKey: string;
}

export interface WalletDeploymentResult {
  address: string;
  transactionHash: string;
  isDeployed: boolean;
  networkId: string;
  configuration: WalletConfig;
  gasUsed?: string;
}

export class WalletCreationTools {
  private contractRegistry: ContractRegistry;
  private providerFactory: ProviderFactory;

  constructor(contractRegistry: ContractRegistry) {
    this.contractRegistry = contractRegistry;
    this.providerFactory = new ProviderFactory();
  }

  getTools(): Tool[] {
    return [
      {
        name: 'safe_create_wallet_config',
        description:
          'Validate and configure Safe wallet parameters before deployment. Validates owner addresses, threshold settings, network compatibility, and optional configurations like fallback handlers, modules, and guards.',
        inputSchema: {
          type: 'object',
          properties: {
            owners: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of owner addresses (must be valid checksummed Ethereum addresses)',
              minItems: 1,
            },
            threshold: {
              type: 'number',
              description:
                'Number of required confirmations (must be between 1 and number of owners)',
              minimum: 1,
            },
            networkId: {
              type: 'string',
              description:
                'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$',
            },
            saltNonce: {
              type: 'string',
              description:
                'Optional salt nonce for deterministic address generation',
            },
            fallbackHandler: {
              type: 'string',
              description: 'Optional fallback handler contract address',
            },
            modules: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of module addresses to enable',
            },
            guard: {
              type: 'string',
              description: 'Optional guard contract address',
            },
            paymentToken: {
              type: 'string',
              description:
                'Optional payment token address for deployment costs',
            },
            payment: {
              type: 'string',
              description: 'Optional payment amount for deployment costs',
            },
            paymentReceiver: {
              type: 'string',
              description: 'Optional payment receiver address',
            },
          },
          required: ['owners', 'threshold', 'networkId'],
        },
      },
      {
        name: 'safe_predict_address',
        description:
          'Predict the address of a Safe wallet before deployment using the provided configuration. Returns the predicted address and deployment status.',
        inputSchema: {
          type: 'object',
          properties: {
            owners: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of owner addresses (must be valid checksummed Ethereum addresses)',
              minItems: 1,
            },
            threshold: {
              type: 'number',
              description:
                'Number of required confirmations (must be between 1 and number of owners)',
              minimum: 1,
            },
            networkId: {
              type: 'string',
              description:
                'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$',
            },
            saltNonce: {
              type: 'string',
              description:
                'Optional salt nonce for deterministic address generation',
            },
            fallbackHandler: {
              type: 'string',
              description: 'Optional fallback handler contract address',
            },
            modules: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of module addresses to enable',
            },
            guard: {
              type: 'string',
              description: 'Optional guard contract address',
            },
            paymentToken: {
              type: 'string',
              description:
                'Optional payment token address for deployment costs',
            },
            payment: {
              type: 'string',
              description: 'Optional payment amount for deployment costs',
            },
            paymentReceiver: {
              type: 'string',
              description: 'Optional payment receiver address',
            },
          },
          required: ['owners', 'threshold', 'networkId'],
        },
      },
      {
        name: 'safe_deploy_wallet',
        description:
          'Deploy a new Safe wallet with the provided configuration. Requires a private key for deployment transaction signing.',
        inputSchema: {
          type: 'object',
          properties: {
            owners: {
              type: 'array',
              items: { type: 'string' },
              description:
                'Array of owner addresses (must be valid checksummed Ethereum addresses)',
              minItems: 1,
            },
            threshold: {
              type: 'number',
              description:
                'Number of required confirmations (must be between 1 and number of owners)',
              minimum: 1,
            },
            networkId: {
              type: 'string',
              description:
                'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
              pattern: '^eip155:\\d+$',
            },
            privateKey: {
              type: 'string',
              description:
                'Private key for deployment transaction signing (32-byte hex string)',
              pattern: '^0x[a-fA-F0-9]{64}$',
            },
            saltNonce: {
              type: 'string',
              description:
                'Optional salt nonce for deterministic address generation',
            },
            fallbackHandler: {
              type: 'string',
              description: 'Optional fallback handler contract address',
            },
            modules: {
              type: 'array',
              items: { type: 'string' },
              description: 'Optional array of module addresses to enable',
            },
            guard: {
              type: 'string',
              description: 'Optional guard contract address',
            },
            paymentToken: {
              type: 'string',
              description:
                'Optional payment token address for deployment costs',
            },
            payment: {
              type: 'string',
              description: 'Optional payment amount for deployment costs',
            },
            paymentReceiver: {
              type: 'string',
              description: 'Optional payment receiver address',
            },
          },
          required: ['owners', 'threshold', 'networkId', 'privateKey'],
        },
      },
    ];
  }

  async handleToolCall(
    name: string,
    arguments_: unknown
  ): Promise<CallToolResult> {
    try {
      switch (name) {
        case 'safe_create_wallet_config':
          return await this.handleCreateWalletConfig(arguments_);
        case 'safe_predict_address':
          return await this.handlePredictAddress(arguments_);
        case 'safe_deploy_wallet':
          return await this.handleDeployWallet(arguments_);
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

  private async handleCreateWalletConfig(
    arguments_: unknown
  ): Promise<CallToolResult> {
    try {
      const result = this.validateWalletConfig(arguments_);

      // If validation fails, return as error
      if (!result.isValid) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Configuration validation error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handlePredictAddress(
    arguments_: unknown
  ): Promise<CallToolResult> {
    try {
      // First validate the configuration
      const validationResult = this.validateWalletConfig(arguments_);

      // If validation fails, return as error
      if (!validationResult.isValid) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(validationResult, null, 2),
            },
          ],
        };
      }

      // Generate predicted address using Safe SDK
      const config = validationResult.configuration!;
      const predictionResult = await this.predictSafeAddress(config);

      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify(predictionResult, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Address prediction error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleDeployWallet(
    arguments_: unknown
  ): Promise<CallToolResult> {
    try {
      // Validate input has private key
      if (!arguments_ || typeof arguments_ !== 'object') {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Invalid input: deployment configuration object is required',
            },
          ],
        };
      }

      const input = arguments_ as any;
      if (!input.privateKey) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Private key is required for wallet deployment',
            },
          ],
        };
      }

      // Validate private key format (should be 0x + 64 hex characters)
      if (!/^0x[a-fA-F0-9]{64}$/.test(input.privateKey)) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: 'Invalid private key format. Must be a 64-character hex string with 0x prefix',
            },
          ],
        };
      }

      // First validate the wallet configuration (excluding private key)
      const { privateKey, ...walletConfig } = input;
      const validationResult = this.validateWalletConfig(walletConfig);

      // If validation fails, return as error
      if (!validationResult.isValid) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: JSON.stringify(validationResult, null, 2),
            },
          ],
        };
      }

      // Deploy the wallet using Safe SDK
      const deploymentConfig: WalletDeploymentConfig = {
        ...validationResult.configuration!,
        privateKey,
      };
      const deploymentResult = await this.deploySafeWallet(deploymentConfig);

      return {
        isError: false,
        content: [
          {
            type: 'text',
            text: JSON.stringify(deploymentResult, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Wallet deployment error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async deploySafeWallet(
    config: WalletDeploymentConfig
  ): Promise<WalletDeploymentResult> {
    const defaultFallback = this.contractRegistry.getFallbackHandlerAddress(
      config.networkId
    );

    const safeAccountConfig: SafeAccountConfig = {
      owners: config.owners,
      threshold: config.threshold,
      fallbackHandler:
        config.fallbackHandler ||
        defaultFallback ||
        '0x0000000000000000000000000000000000000000',
      paymentToken: config.paymentToken,
      payment: config.payment ? BigInt(config.payment) : undefined,
      paymentReceiver: config.paymentReceiver,
    } as any;

    const factory = await this.providerFactory.getSafeFactory(
      config.networkId,
      config.privateKey
    );

    // Deploy Safe
    const safe = await factory.deploySafe({
      safeAccountConfig,
      saltNonce: config.saltNonce,
    } as any);
    const address = await safe.getAddress();

    // Verify deployment and try to estimate gas from code deployment
    const provider = await this.providerFactory.getProvider(config.networkId);
    const code = await provider.getCode(address);
    const isDeployed = code !== '0x';

    const { privateKey, ...configuration } = config;

    return {
      address,
      transactionHash: '',
      isDeployed,
      networkId: config.networkId,
      configuration,
      gasUsed: '0',
    };
  }

  private async predictSafeAddress(
    config: WalletConfig
  ): Promise<AddressPredictionResult> {
    const defaultFallback = this.contractRegistry.getFallbackHandlerAddress(
      config.networkId
    );

    const safeAccountConfig: SafeAccountConfig = {
      owners: config.owners,
      threshold: config.threshold,
      fallbackHandler:
        config.fallbackHandler ||
        defaultFallback ||
        '0x0000000000000000000000000000000000000000',
      paymentToken: config.paymentToken,
      payment: config.payment ? BigInt(config.payment) : undefined,
      paymentReceiver: config.paymentReceiver,
    } as any;

    // Some Safe SDK versions require a signer for SafeFactory. Use a throwaway key for prediction.
    const dummyPrivateKey = '0x' + '1'.repeat(64);
    const factory = await this.providerFactory.getSafeFactory(
      config.networkId,
      dummyPrivateKey
    );

    const address = await (factory as any).predictSafeAddress(
      safeAccountConfig,
      config.saltNonce
    );

    const provider = await this.providerFactory.getProvider(config.networkId);
    const isDeployed = (await provider.getCode(address)) !== '0x';

    return {
      address,
      isDeployed,
      networkId: config.networkId,
      configuration: config,
      saltNonce: config.saltNonce,
    };
  }

  private async checkIfDeployed(
    address: string,
    networkId: string
  ): Promise<boolean> {
    const provider = await this.providerFactory.getProvider(networkId);
    const code = await provider.getCode(address);
    return code !== '0x';
  }

  private validateWalletConfig(input: unknown): ConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Handle null/undefined input
    if (!input || typeof input !== 'object') {
      return {
        isValid: false,
        errors: ['Invalid input: configuration object is required'],
        warnings: [],
      };
    }

    const config = input as Partial<WalletConfig>;

    // Validate required fields
    if (!config.owners) {
      errors.push('Required field missing: owners');
    }
    if (config.threshold === undefined || config.threshold === null) {
      errors.push('Required field missing: threshold');
    }
    if (!config.networkId) {
      errors.push('Required field missing: networkId');
    }

    // Return early if required fields are missing
    if (errors.length > 0) {
      return {
        isValid: false,
        errors,
        warnings,
      };
    }

    // Validate threshold
    if (config.threshold !== undefined) {
      if (config.threshold <= 0) {
        errors.push('Threshold must be greater than 0');
      }
      if (config.owners && config.threshold > config.owners.length) {
        errors.push('Threshold cannot be greater than number of owners');
      }
    }

    // Validate owner addresses
    if (config.owners) {
      if (!Array.isArray(config.owners)) {
        errors.push('Owners must be an array');
      } else if (config.owners.length === 0) {
        errors.push('At least one owner is required');
      } else {
        config.owners.forEach((owner, index) => {
          if (
            typeof owner !== 'string' ||
            !this.contractRegistry.validateSafeAddress(owner)
          ) {
            errors.push(`Invalid owner address at index ${index}: ${owner}`);
          }
        });

        // Check for duplicate owners
        const uniqueOwners = new Set(config.owners);
        if (uniqueOwners.size !== config.owners.length) {
          errors.push('Duplicate owner addresses are not allowed');
        }

        // Security warning for single owner
        if (config.owners.length === 1) {
          warnings.push(
            'Single owner configuration reduces security - consider using multiple owners'
          );
        }
      }
    }

    // Validate network
    if (config.networkId) {
      if (!this.contractRegistry.isNetworkSupported(config.networkId)) {
        errors.push(`Network ${config.networkId} is not supported`);
      }
    }

    // Validate optional fallback handler
    if (config.fallbackHandler) {
      if (!this.contractRegistry.validateSafeAddress(config.fallbackHandler)) {
        errors.push('Invalid fallback handler address');
      }
    }

    // Validate optional modules
    if (config.modules) {
      if (!Array.isArray(config.modules)) {
        errors.push('Modules must be an array');
      } else {
        config.modules.forEach((module, index) => {
          if (
            typeof module !== 'string' ||
            !this.contractRegistry.validateSafeAddress(module)
          ) {
            errors.push(`Invalid module address at index ${index}: ${module}`);
          }
        });
      }
    }

    // Validate optional guard
    if (config.guard) {
      if (!this.contractRegistry.validateSafeAddress(config.guard)) {
        errors.push('Invalid guard address');
      }
    }

    // Validate optional payment configuration
    if (config.paymentToken) {
      if (!this.contractRegistry.validateSafeAddress(config.paymentToken)) {
        errors.push('Invalid payment token address');
      }
    }

    if (config.paymentReceiver) {
      if (!this.contractRegistry.validateSafeAddress(config.paymentReceiver)) {
        errors.push('Invalid payment receiver address');
      }
    }

    if (config.payment) {
      try {
        const paymentAmount = BigInt(config.payment);
        if (paymentAmount < 0) {
          errors.push('Payment amount must be non-negative');
        }
      } catch {
        errors.push('Invalid payment amount format');
      }
    }

    // Additional security warnings
    if (config.threshold === 1 && config.owners && config.owners.length > 1) {
      warnings.push(
        'Low threshold (1) with multiple owners - consider increasing threshold for better security'
      );
    }

    if (config.modules && config.modules.length > 0) {
      warnings.push(
        'Modules can execute transactions without owner approval - ensure module contracts are trusted'
      );
    }

    if (config.guard) {
      warnings.push(
        'Guards can modify transaction behavior - ensure guard contract is trusted'
      );
    }

    const isValid = errors.length === 0;

    return {
      isValid,
      configuration: isValid ? (config as WalletConfig) : undefined,
      errors,
      warnings,
    };
  }
}
