import { JsonRpcProvider, Wallet } from 'ethers';
export interface TestAccount {
    address: string;
    privateKey: string;
    balance: string;
    index: number;
}
/**
 * Test Account Manager for local blockchain development
 * Provides deterministic test accounts with known private keys
 */
export declare class TestAccountManager {
    private accounts;
    private provider;
    constructor(provider: JsonRpcProvider);
    /**
     * Get Hardhat's deterministic test accounts
     */
    getTestAccounts(count?: number): Promise<TestAccount[]>;
    /**
     * Get a specific test account by index
     */
    getTestAccount(index: number): Promise<TestAccount>;
    /**
     * Get the deployer account (index 0)
     */
    getDeployerAccount(): Promise<TestAccount>;
    /**
     * Create a wallet instance for a test account
     */
    createWallet(accountIndex: number): Promise<Wallet>;
    /**
     * Fund an account with ETH (useful for testing)
     */
    fundAccount(toAddress: string, amount?: string, fromIndex?: number): Promise<string>;
    /**
     * Check account balance
     */
    getBalance(address: string): Promise<string>;
    /**
     * Load Hardhat's deterministic accounts
     */
    private loadHardhatAccounts;
    /**
     * Create a multi-signature test scenario
     */
    createMultiSigScenario(ownerCount?: number, threshold?: number, startIndex?: number): Promise<{
        owners: TestAccount[];
        threshold: number;
        ownerAddresses: string[];
        ownerPrivateKeys: string[];
    }>;
    /**
     * Reset account cache (useful for testing)
     */
    clearCache(): void;
}
