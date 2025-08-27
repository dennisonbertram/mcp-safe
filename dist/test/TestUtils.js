import { Contract, parseEther, ethers } from 'ethers';
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
            const deploymentFiles = [
                'localhost-anvil.json', // Try Anvil deployment first
                'localhost-real.json', // Then real deployment
                'localhost.json', // Finally mock deployment
            ];
            let found = false;
            for (const file of deploymentFiles) {
                try {
                    const deploymentPath = require('path').join(process.cwd(), 'deployments', file);
                    this.deploymentInfo = require(deploymentPath);
                    found = true;
                    break;
                }
                catch (error) {
                    // Try next file
                }
            }
            if (!found) {
                throw new Error('Local deployment not found. Please run: npm run deploy:anvil or npm run deploy:real');
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
            'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external',
        ];
        const factoryABI = [
            'function createProxy(address _singleton, bytes memory initializer) public returns (address proxy)',
            'event ProxyCreation(address indexed proxy, address singleton)',
        ];
        const safeSingleton = new Contract(deployment.contracts.safeSingleton, safeSingletonABI, wallet);
        const factory = new Contract(deployment.contracts.safeProxyFactory, factoryABI, wallet);
        // Create setup data
        const setupData = safeSingleton.interface.encodeFunctionData('setup', [
            owners,
            threshold,
            '0x0000000000000000000000000000000000000000', // to
            '0x', // data
            '0x0000000000000000000000000000000000000000', // fallbackHandler
            '0x0000000000000000000000000000000000000000', // paymentToken
            0, // payment
            '0x0000000000000000000000000000000000000000', // paymentReceiver
        ]);
        // Deploy Safe proxy
        const createProxyFn = factory.createProxy;
        if (!createProxyFn) {
            throw new Error('createProxy function not found on factory contract');
        }
        const tx = await createProxyFn(deployment.contracts.safeSingleton, setupData);
        const receipt = await tx.wait();
        // Extract proxy address from event using proper parsing
        let proxyAddress;
        // Parse logs to find ProxyCreation event
        for (const log of receipt?.logs || []) {
            try {
                // Check if this log matches ProxyCreation event signature
                // Get the ProxyCreation event topic hash
                // ProxyCreation(address indexed proxy, address singleton)
                const eventTopic = ethers.id('ProxyCreation(address,address)');
                // Check if first topic matches event signature
                if (log.topics[0] === eventTopic) {
                    // Parse the log
                    const decoded = factory.interface.parseLog({
                        topics: log.topics,
                        data: log.data,
                    });
                    if (decoded && decoded.name === 'ProxyCreation') {
                        // ProxyCreation(address indexed proxy, address singleton)
                        // proxy is indexed so it's in topics[1]
                        proxyAddress = decoded.args[0] || decoded.args.proxy;
                        break;
                    }
                }
            }
            catch (error) {
                // Continue to next log
                console.error('Error parsing log:', error);
            }
        }
        if (!proxyAddress) {
            // Fallback: try to get proxy address from receipt if tx succeeded
            if (receipt?.status === 1 && receipt?.contractAddress) {
                proxyAddress = receipt.contractAddress;
            }
            else {
                throw new Error('ProxyCreation event not found or could not be parsed');
            }
        }
        return {
            address: proxyAddress || '0x0000000000000000000000000000000000000000',
            owners,
            threshold,
            transactionHash: tx.hash,
            deployer,
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
                'function getOwners() external view returns (address[] memory)',
                'function getThreshold() external view returns (uint256)',
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
                hasCode: true,
            };
        }
        catch (error) {
            return { isDeployed: false, hasCode: true };
        }
    }
    /**
     * Fund an account for testing
     */
    async fundAccount(toAddress, amount = '100.0', fromIndex = 0) {
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
        const safeDeployment = await this.deployTestSafe(scenario.ownerAddresses, scenario.threshold
        // Use default deployer (index 0)
        );
        return {
            owners: scenario.owners,
            threshold: scenario.threshold,
            safeDeployment,
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
     * Get a contract instance for testing
     */
    async getContractAt(contractName, address) {
        let abi;
        if (contractName === 'MockSafeSingleton') {
            abi = [
                'function NAME() external view returns (string)',
                'function VERSION() external view returns (string)',
                'function getOwners() external view returns (address[] memory)',
                'function getThreshold() external view returns (uint256)',
                'function nonce() external view returns (uint256)',
                'function isOwner(address owner) external view returns (bool)',
                'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver) external',
            ];
        }
        else if (contractName === 'MockSafeProxyFactory') {
            abi = [
                'function singleton() external view returns (address)',
                'function createProxy(address _singleton, bytes memory initializer) public returns (address proxy)',
                'event ProxyCreation(address indexed proxy, address singleton)',
            ];
        }
        else {
            throw new Error(`Unknown contract name: ${contractName}`);
        }
        return new Contract(address, abi, this.provider);
    }
    /**
     * Deploy a test Safe with gas tracking
     */
    async deployTestSafeWithGasTracking(owners, threshold = 1, deployerIndex = 0) {
        const deployment = await this.deployTestSafe(owners, threshold, deployerIndex);
        // Get the transaction receipt to extract gas usage
        const receipt = await this.provider.getTransactionReceipt(deployment.transactionHash);
        const gasUsed = receipt ? Number(receipt.gasUsed) : 0;
        return {
            ...deployment,
            gasUsed,
        };
    }
    /**
     * Execute a Safe transaction with gas tracking
     */
    async executeSafeTransactionWithGasTracking(safeAddress, to, value, data, signerPrivateKeys) {
        const deployer = await this.accountManager.getTestAccount(0);
        const wallet = await this.accountManager.createWallet(0);
        const safeABI = [
            'function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, bytes memory signatures) public payable returns (bool success)',
            'function nonce() external view returns (uint256)',
            'function getTransactionHash(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, uint256 _nonce) public view returns (bytes32)',
        ];
        const safe = new Contract(safeAddress, safeABI, wallet);
        // Get current nonce
        const nonceFn = safe.nonce;
        if (!nonceFn) {
            throw new Error('nonce function not found on Safe contract');
        }
        const nonce = await nonceFn();
        // Create transaction hash for signing
        const getTransactionHashFn = safe.getTransactionHash;
        if (!getTransactionHashFn) {
            throw new Error('getTransactionHash function not found on Safe contract');
        }
        const txHash = await getTransactionHashFn(to, parseEther(value), data, 0, // operation (call)
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        '0x0000000000000000000000000000000000000000', // gasToken
        '0x0000000000000000000000000000000000000000', // refundReceiver
        nonce);
        // Simple signature creation (for mock contracts)
        const signatures = '0x' + '00'.repeat(65 * signerPrivateKeys.length);
        // Execute transaction
        const execTransactionFn = safe.execTransaction;
        if (!execTransactionFn) {
            throw new Error('execTransaction function not found on Safe contract');
        }
        const tx = await execTransactionFn(to, parseEther(value), data, 0, // operation
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        '0x0000000000000000000000000000000000000000', // gasToken
        '0x0000000000000000000000000000000000000000', // refundReceiver
        signatures);
        const receipt = await tx.wait();
        return receipt ? Number(receipt.gasUsed) : 0;
    }
    /**
     * Reset test environment
     */
    reset() {
        this.accountManager.clearCache();
        this.deploymentInfo = undefined;
    }
}
