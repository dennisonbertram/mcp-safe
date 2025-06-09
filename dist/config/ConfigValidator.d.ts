import { z } from 'zod';
import { SafeConfig, ValidationResult } from './types';
/**
 * Configuration validator using Zod schemas
 */
export declare class ConfigValidator {
    /**
     * Validate a complete configuration object
     */
    validateConfig(config: unknown): ValidationResult<SafeConfig>;
    /**
     * Validate CAIP-2 network identifier
     */
    validateCAIP2(identifier: string): boolean;
    /**
     * Validate Ethereum address format
     */
    validateEthereumAddress(address: string): boolean;
    /**
     * Get the CAIP-2 schema for external use
     */
    getCAIP2Schema(): z.ZodSchema;
    /**
     * Get the Ethereum address schema for external use
     */
    getEthereumAddressSchema(): z.ZodSchema;
}
