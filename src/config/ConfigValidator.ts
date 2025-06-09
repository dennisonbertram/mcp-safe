import { z } from 'zod';
import { SafeConfig, ValidationResult } from './types';

/**
 * Zod schema for CAIP-2 network identifier validation
 */
const CAIP2Schema = z.string().regex(/^eip155:\d+$/, {
  message: 'Must be a valid CAIP-2 identifier (e.g., eip155:1)',
});

/**
 * Zod schema for Ethereum address validation
 */
const EthereumAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
  message: 'Must be a valid Ethereum address',
});

/**
 * Zod schema for network configuration
 */
const NetworkConfigSchema = z.object({
  rpcUrl: z.string().url('Must be a valid URL'),
  apiKey: z.string().optional(),
  timeout: z.number().positive().optional(),
  retries: z.number().min(0).optional(),
  transactionService: z.string().url().optional(),
});

/**
 * Zod schema for API keys configuration
 */
const ApiKeysConfigSchema = z
  .object({
    anthropic: z.string().optional(),
    openai: z.string().optional(),
    perplexity: z.string().optional(),
    google: z.string().optional(),
    mistral: z.string().optional(),
    azure: z.string().optional(),
    openrouter: z.string().optional(),
    xai: z.string().optional(),
    ollama: z.string().optional(),
  })
  .optional();

/**
 * Main configuration schema
 */
const SafeConfigSchema = z.object({
  defaultNetwork: CAIP2Schema.optional(),
  networks: z.record(CAIP2Schema, NetworkConfigSchema).optional(),
  apiKeys: ApiKeysConfigSchema,
});

/**
 * Configuration validator using Zod schemas
 */
export class ConfigValidator {
  /**
   * Validate a complete configuration object
   */
  validateConfig(config: unknown): ValidationResult<SafeConfig> {
    try {
      const result = SafeConfigSchema.safeParse(config);

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      }

      return {
        success: false,
        error: {
          message: 'Configuration validation failed',
          issues: result.error.issues.map((issue) => ({
            path: issue.path.map(String),
            message: issue.message,
          })),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: {
          message:
            error instanceof Error ? error.message : 'Unknown validation error',
        },
      };
    }
  }

  /**
   * Validate CAIP-2 network identifier
   */
  validateCAIP2(identifier: string): boolean {
    return CAIP2Schema.safeParse(identifier).success;
  }

  /**
   * Validate Ethereum address format
   */
  validateEthereumAddress(address: string): boolean {
    return EthereumAddressSchema.safeParse(address).success;
  }

  /**
   * Get the CAIP-2 schema for external use
   */
  getCAIP2Schema(): z.ZodSchema {
    return CAIP2Schema;
  }

  /**
   * Get the Ethereum address schema for external use
   */
  getEthereumAddressSchema(): z.ZodSchema {
    return EthereumAddressSchema;
  }
}
