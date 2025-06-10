import { z } from 'zod';
import { InfrastructureDeploymentResult } from '../types/index.js';
import { NetworkManager } from '../network/NetworkManager.js';
declare const SafeDeployInfrastructureSchema: z.ZodObject<{
    network: z.ZodString;
    deployerPrivateKey: z.ZodString;
    gasPrice: z.ZodOptional<z.ZodString>;
    confirmations: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    network: string;
    deployerPrivateKey: string;
    confirmations: number;
    gasPrice?: string | undefined;
}, {
    network: string;
    deployerPrivateKey: string;
    gasPrice?: string | undefined;
    confirmations?: number | undefined;
}>;
export type SafeDeployInfrastructureInput = z.infer<typeof SafeDeployInfrastructureSchema>;
/**
 * Deploy Safe infrastructure to a new blockchain network using real Safe contracts
 * This tool deploys the complete Safe contract ecosystem including:
 * - Safe Singleton Factory (for deterministic deployments)
 * - Safe Singleton (implementation contract)
 * - Safe Proxy Factory (creates wallet proxies)
 * - Fallback Handler (default functionality)
 * - MultiSend contract (batch transactions)
 */
export declare const safeDeployInfrastructure: {
    name: string;
    description: string;
    inputSchema: z.ZodObject<{
        network: z.ZodString;
        deployerPrivateKey: z.ZodString;
        gasPrice: z.ZodOptional<z.ZodString>;
        confirmations: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        network: string;
        deployerPrivateKey: string;
        confirmations: number;
        gasPrice?: string | undefined;
    }, {
        network: string;
        deployerPrivateKey: string;
        gasPrice?: string | undefined;
        confirmations?: number | undefined;
    }>;
    handle(input: SafeDeployInfrastructureInput, networkManager: NetworkManager): Promise<InfrastructureDeploymentResult>;
};
export {};
