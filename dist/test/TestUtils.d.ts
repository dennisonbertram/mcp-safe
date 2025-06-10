import { JsonRpcProvider } from 'ethers';
import { TestAccount } from './TestAccountManager.js';
export interface TestSafeDeployment {
    address: string;
    owners: string[];
    threshold: number;
    transactionHash: string;
    deployer: TestAccount;
}
/**
 * Test utilities for Safe MCP Server integration testing
 */
export declare class TestUtils {
    private provider;
    private accountManager;
    private deploymentInfo?;
    constructor(provider: JsonRpcProvider);
    /**
     * Get the local deployment information
     */
    getDeploymentInfo(): any;
    /**
     * Get test accounts
     */
    getTestAccounts(count?: number): Promise<TestAccount[]>;
    /**
     * Deploy a test Safe wallet using local contracts
     */
    deployTestSafe(owners: string[], threshold?: number, deployerIndex?: number): Promise<TestSafeDeployment>;
    /**
     * Verify a Safe deployment
     */
    verifySafeDeployment(safeAddress: string): Promise<{
        isDeployed: boolean;
        owners?: string[];
        threshold?: number;
        hasCode: boolean;
    }>;
    /**
     * Fund an account for testing
     */
    fundAccount(toAddress: string, amount?: string, fromIndex?: number): Promise<string>;
    /**
     * Check account balance
     */
    getBalance(address: string): Promise<string>;
    /**
     * Create a multi-signature test scenario
     */
    createMultiSigTestScenario(): Promise<{
        owners: TestAccount[];
        threshold: number;
        safeDeployment: TestSafeDeployment;
    }>;
    /**
     * Wait for network confirmation
     */
    waitForConfirmation(txHash: string, confirmations?: number): Promise<any>;
    /**
     * Get current block number
     */
    getCurrentBlock(): Promise<number>;
    /**
     * Reset test environment
     */
    reset(): void;
}
