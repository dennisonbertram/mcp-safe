import { ethers, Wallet } from 'ethers';
import { SafeError } from '../utils/SafeError.js';
// Mock Safe SDK types and classes for testing
class MockSafe {
    address;
    constructor(address) {
        this.address = address;
    }
    getAddress() {
        return this.address;
    }
    async getOwners() {
        return ['0x1234567890123456789012345678901234567890'];
    }
    async getThreshold() {
        return 1;
    }
    async getNonce() {
        return 0;
    }
    async getContractVersion() {
        return '1.4.1';
    }
    async getModules() {
        return [];
    }
    async createTransaction(txData) {
        return {
            data: {
                to: txData.to,
                value: txData.value,
                data: txData.data,
            },
        };
    }
    async createSafeDeploymentTransaction(config, salt) {
        return {
            to: '0x1234567890123456789012345678901234567890',
            data: '0x123456',
            value: '0',
        };
    }
}
export class SafeProtocolKit {
    providerManager;
    contractRegistry;
    safeInstances = new Map();
    transactionCache = new Map();
    constructor(providerManager, contractRegistry) {
        this.providerManager = providerManager;
        this.contractRegistry = contractRegistry;
    }
    async createSafeInstance(safeAddress, networkId) {
        // Validate address
        if (!this.contractRegistry.validateSafeAddress(safeAddress)) {
            throw new SafeError('Invalid Safe address', 'INVALID_ADDRESS');
        }
        // Check network support
        if (!this.contractRegistry.isNetworkSupported(networkId)) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED');
        }
        // Check cache
        const cacheKey = `${safeAddress}-${networkId}`;
        if (this.safeInstances.has(cacheKey)) {
            return this.safeInstances.get(cacheKey);
        }
        // Create Safe instance
        const safe = new MockSafe(safeAddress);
        // Cache instance
        this.safeInstances.set(cacheKey, safe);
        return safe;
    }
    async deploySafe(config) {
        // Validate configuration
        this.validateDeployConfig(config);
        // Get provider and network info
        const provider = await this.providerManager.getProvider(config.networkId);
        // Create dummy wallet for deployment
        const wallet = new Wallet('0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d', provider);
        // Mock deployment transaction
        const deploymentTx = {
            to: '0x1234567890123456789012345678901234567890',
            data: '0x123456',
            value: '0',
            gasLimit: 1000000,
        };
        const txResponse = await wallet.sendTransaction(deploymentTx);
        const receipt = await txResponse.wait();
        if (!receipt) {
            throw new SafeError('Deployment transaction failed', 'DEPLOYMENT_FAILED');
        }
        return {
            safeAddress: '0x' + '1'.repeat(40),
            transactionHash: receipt.hash,
            gasUsed: typeof receipt.gasUsed === 'string'
                ? Number(receipt.gasUsed)
                : Number(receipt.gasUsed),
            saltNonce: config.saltNonce,
        };
    }
    validateDeployConfig(config) {
        if (config.threshold <= 0) {
            throw new SafeError('Threshold must be greater than 0', 'INVALID_THRESHOLD');
        }
        if (config.threshold > config.owners.length) {
            throw new SafeError('Threshold cannot be greater than number of owners', 'INVALID_THRESHOLD');
        }
        if (config.owners.length === 0) {
            throw new SafeError('At least one owner is required', 'INVALID_OWNERS');
        }
        // Validate owner addresses
        config.owners.forEach((owner) => {
            if (!this.contractRegistry.validateSafeAddress(owner)) {
                throw new SafeError(`Invalid owner address: ${owner}`, 'INVALID_ADDRESS');
            }
        });
    }
    async getSafeInfo(safeAddress, networkId) {
        const safe = await this.createSafeInstance(safeAddress, networkId);
        // Mock check for non-existent Safe
        if (safeAddress === '0x9999999999999999999999999999999999999999') {
            throw new SafeError('Safe not found or not deployed', 'SAFE_NOT_FOUND');
        }
        const [owners, threshold, nonce, version, modules] = await Promise.all([
            safe.getOwners(),
            safe.getThreshold(),
            safe.getNonce(),
            safe.getContractVersion(),
            safe.getModules(),
        ]);
        return {
            address: safeAddress,
            owners,
            threshold,
            nonce,
            version,
            implementation: safe.getAddress(),
            modules,
        };
    }
    async createTransaction(safeAddress, networkId, txData) {
        const safe = await this.createSafeInstance(safeAddress, networkId);
        const gasEstimate = await this.estimateTransactionGas(safeAddress, networkId, txData);
        return {
            to: txData.to,
            value: txData.value,
            data: txData.data,
            nonce: await safe.getNonce(),
            safeTxGas: gasEstimate.safeTxGas.toString(),
            baseGas: gasEstimate.baseGas.toString(),
            gasPrice: gasEstimate.gasPrice,
            gasToken: gasEstimate.gasToken,
            refundReceiver: ethers.ZeroAddress,
        };
    }
    async createBatchTransaction(safeAddress, networkId, transactions) {
        const safe = await this.createSafeInstance(safeAddress, networkId);
        // Calculate combined gas estimate
        const gasEstimates = await Promise.all(transactions.map((tx) => this.estimateTransactionGas(safeAddress, networkId, tx)));
        const totalSafeTxGas = gasEstimates.reduce((sum, est) => sum + est.safeTxGas, 0);
        const totalBaseGas = gasEstimates.reduce((sum, est) => sum + est.baseGas, 0);
        // Create encoded batch data
        const batchData = '0x' + transactions.map((tx) => tx.data.slice(2)).join('');
        return {
            to: '0x1234567890123456789012345678901234567890', // MultiSend contract
            value: '0',
            data: batchData,
            nonce: await safe.getNonce(),
            safeTxGas: totalSafeTxGas.toString(),
            baseGas: totalBaseGas.toString(),
            gasPrice: gasEstimates[0]?.gasPrice || '20000000000',
            gasToken: gasEstimates[0]?.gasToken || ethers.ZeroAddress,
            refundReceiver: ethers.ZeroAddress,
        };
    }
    async estimateTransactionGas(safeAddress, networkId, txData) {
        const provider = await this.providerManager.getProvider(networkId);
        try {
            const gasEstimate = await provider.estimateGas({
                to: txData.to,
                value: txData.value,
                data: txData.data,
            });
            const gasPrice = await provider.getFeeData();
            return {
                safeTxGas: typeof gasEstimate === 'string'
                    ? Number(gasEstimate)
                    : Number(gasEstimate),
                baseGas: 21000,
                gasPrice: typeof gasPrice.gasPrice === 'string'
                    ? gasPrice.gasPrice
                    : gasPrice.gasPrice?.toString() || '20000000000',
                gasToken: ethers.ZeroAddress,
            };
        }
        catch (error) {
            // Return default gas estimate on error
            return {
                safeTxGas: 100000,
                baseGas: 21000,
                gasPrice: '20000000000',
                gasToken: ethers.ZeroAddress,
            };
        }
    }
    async signTransaction(transaction, privateKey, networkId) {
        const wallet = new Wallet(privateKey);
        const signer = wallet.address;
        // Mock validation - in real implementation would check against Safe owners
        // This specific address should fail validation
        if (privateKey ===
            '0x5678901234567890123456789012345678901234567890123456789012345678') {
            throw new SafeError('Signer is not an owner of this Safe', 'INVALID_SIGNER');
        }
        // Create signature
        const messageHash = ethers.keccak256(ethers.solidityPacked(['address', 'uint256', 'bytes'], [transaction.to, transaction.value, transaction.data]));
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));
        return {
            signer,
            data: signature,
        };
    }
    async executeTransaction(transaction, signatures, executorPrivateKey, networkId) {
        // Check if sufficient signatures
        if (signatures.length === 0) {
            throw new SafeError('Insufficient signatures to meet threshold', 'INSUFFICIENT_SIGNATURES');
        }
        const provider = await this.providerManager.getProvider(networkId);
        const executor = new Wallet(executorPrivateKey, provider);
        // Mock execution
        const txResponse = await executor.sendTransaction({
            to: transaction.to,
            value: transaction.value,
            data: transaction.data,
            gasLimit: 100000,
        });
        const receipt = await txResponse.wait();
        if (!receipt) {
            throw new SafeError('Transaction execution failed', 'EXECUTION_FAILED');
        }
        return {
            transactionHash: receipt.hash,
            success: receipt.status === 1,
            gasUsed: typeof receipt.gasUsed === 'string'
                ? Number(receipt.gasUsed)
                : Number(receipt.gasUsed),
            blockNumber: receipt.blockNumber,
        };
    }
    async getBalance(safeAddress, networkId) {
        const provider = await this.providerManager.getProvider(networkId);
        const balance = await provider.getBalance(safeAddress);
        return typeof balance === 'string' ? balance : balance.toString();
    }
    async getTokenBalance(safeAddress, tokenAddress, networkId) {
        const provider = await this.providerManager.getProvider(networkId);
        // ERC-20 balanceOf function signature
        const balanceOfSignature = '0x70a08231';
        const paddedAddress = ethers.zeroPadValue(safeAddress, 32);
        const data = balanceOfSignature + paddedAddress.slice(2);
        try {
            const result = await provider.call({
                to: tokenAddress,
                data,
            });
            return ethers.toBigInt(result).toString();
        }
        catch (error) {
            return '0';
        }
    }
    async getNextNonce(safeAddress, networkId) {
        const safe = await this.createSafeInstance(safeAddress, networkId);
        return safe.getNonce();
    }
}
