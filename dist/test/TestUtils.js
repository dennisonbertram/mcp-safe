import { Contract } from 'ethers';
import { TestAccountManager } from './TestAccountManager.js';
/**
 * Test utilities for Safe MCP Server integration testing
 */
export class TestUtils {
    provider;
    accountManager;
    deploymentInfo;
    constructor(provider) {
        this.provider = provider;
        this.accountManager = new TestAccountManager(provider);
    }
    /**
     * Get the local deployment information
     */
    getDeploymentInfo() {
        if (!this.deploymentInfo) {
            try {
                const deploymentPath = require('path').join(process.cwd(), 'deployments', 'localhost.json');
                this.deploymentInfo = require(deploymentPath);
            }
            catch (error) {
                throw new Error('Local deployment not found. Please run: npm run deploy:local');
            }
        }
        return this.deploymentInfo;
    }
    /**
     * Get test accounts
     */
    async getTestAccounts(count = 10) {
        return this.accountManager.getTestAccounts(count);
    }
    /**
     * Deploy a test Safe wallet using local contracts
     */
    async deployTestSafe(owners, threshold = 1, deployerIndex = 0) {
        const deployment = this.getDeploymentInfo();
        const deployer = await this.accountManager.getTestAccount(deployerIndex);
        const wallet = await this.accountManager.createWallet(deployerIndex);
        // Get contract instances
        const safeSingletonABI = [
            "function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external"
        ];
        const factoryABI = [
            "function createProxy(address _singleton, bytes memory initializer) public returns (address proxy)",
            "event ProxyCreation(address indexed proxy, address singleton)"
        ];
        const safeSingleton = new Contract(deployment.contracts.safeSingleton, safeSingletonABI, wallet);
        const factory = new Contract(deployment.contracts.safeProxyFactory, factoryABI, wallet);
        // Create setup data
        const setupData = safeSingleton.interface.encodeFunctionData("setup", [
            owners,
            threshold,
            "0x0000000000000000000000000000000000000000", // to
            "0x", // data
            "0x0000000000000000000000000000000000000000", // fallbackHandler
            "0x0000000000000000000000000000000000000000", // paymentToken
            0, // payment
            "0x0000000000000000000000000000000000000000", // paymentReceiver
        ]);
        // Deploy Safe proxy
        const createProxyFn = factory.createProxy;
        if (!createProxyFn) {
            throw new Error('createProxy function not found on factory contract');
        }
        const tx = await createProxyFn(deployment.contracts.safeSingleton, setupData);
        const receipt = await tx.wait();
        // Extract proxy address from event
        const event = receipt?.logs.find((log) => {
            try {
                const decoded = factory.interface.parseLog(log);
                return decoded?.name === "ProxyCreation";
            }
            catch {
                return false;
            }
        });
        if (!event) {
            throw new Error('ProxyCreation event not found');
        }
        const decoded = factory.interface.parseLog(event);
        const proxyAddress = decoded?.args.proxy;
        return {
            address: proxyAddress,
            owners,
            threshold,
            transactionHash: tx.hash,
            deployer
        };
    }
    /**
     * Verify a Safe deployment
     */
    async verifySafeDeployment(safeAddress) {
        const code = await this.provider.getCode(safeAddress);
        const hasCode = code !== '0x';
        if (!hasCode) {
            return { isDeployed: false, hasCode: false };
        }
        try {
            // Try to read Safe data
            const safeABI = [
                "function getOwners() external view returns (address[] memory)",
                "function getThreshold() external view returns (uint256)"
            ];
            const safe = new Contract(safeAddress, safeABI, this.provider);
            const getOwnersFn = safe.getOwners;
            const getThresholdFn = safe.getThreshold;
            if (!getOwnersFn || !getThresholdFn) {
                throw new Error('Safe contract methods not found');
            }
            const owners = await getOwnersFn();
            const threshold = await getThresholdFn();
            return {
                isDeployed: true,
                owners,
                threshold: Number(threshold),
                hasCode: true
            };
        }
        catch (error) {
            return { isDeployed: false, hasCode: true };
        }
    }
    /**
     * Fund an account for testing
     */
    async fundAccount(toAddress, amount = "100.0", fromIndex = 0) {
        return this.accountManager.fundAccount(toAddress, amount, fromIndex);
    }
    /**
     * Check account balance
     */
    async getBalance(address) {
        return this.accountManager.getBalance(address);
    }
    /**
     * Create a multi-signature test scenario
     */
    async createMultiSigTestScenario() {
        const scenario = await this.accountManager.createMultiSigScenario(3, 2);
        const safeDeployment = await this.deployTestSafe(scenario.ownerAddresses, scenario.threshold);
        return {
            owners: scenario.owners,
            threshold: scenario.threshold,
            safeDeployment
        };
    }
    /**
     * Wait for network confirmation
     */
    async waitForConfirmation(txHash, confirmations = 1) {
        return this.provider.waitForTransaction(txHash, confirmations);
    }
    /**
     * Get current block number
     */
    async getCurrentBlock() {
        return this.provider.getBlockNumber();
    }
    /**
     * Reset test environment
     */
    reset() {
        this.accountManager.clearCache();
        this.deploymentInfo = undefined;
    }
}
