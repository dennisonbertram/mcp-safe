import { getAddress, keccak256, solidityPackedKeccak256 } from 'ethers';
import { SafeError } from '../utils/SafeError.js';
export class ContractRegistry {
    networks = {
        'eip155:1': {
            name: 'Ethereum Mainnet',
            chainId: 1,
            safeAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            proxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
            fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
        },
        'eip155:137': {
            name: 'Polygon',
            chainId: 137,
            safeAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            proxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
            fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
        },
        'eip155:42161': {
            name: 'Arbitrum One',
            chainId: 42161,
            safeAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            proxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
            fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
        },
        'eip155:11155111': {
            name: 'Sepolia Testnet',
            chainId: 11155111,
            safeAddress: '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            proxyFactoryAddress: '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2',
            fallbackHandlerAddress: '0xf48f2B2d2a534e402487b3ee7C18c33Aec0Fe5e4',
        },
        'eip155:31337': {
            name: 'Hardhat Local Network',
            chainId: 31337,
            safeAddress: this.getLocalContractAddress('safeSingleton'),
            proxyFactoryAddress: this.getLocalContractAddress('safeProxyFactory'),
            fallbackHandlerAddress: '0x0000000000000000000000000000000000000000',
        },
    };
    versionedAddresses = {
        'eip155:1': {
            '1.3.0': '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            '1.4.1': '0x41675C099F32341bf84BFc5382aF534df5C7461a',
        },
        'eip155:137': {
            '1.3.0': '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            '1.4.1': '0x41675C099F32341bf84BFc5382aF534df5C7461a',
        },
        'eip155:42161': {
            '1.3.0': '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            '1.4.1': '0x41675C099F32341bf84BFc5382aF534df5C7461a',
        },
        'eip155:11155111': {
            '1.3.0': '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552',
            '1.4.1': '0x41675C099F32341bf84BFc5382aF534df5C7461a',
        },
        'eip155:31337': {
            '1.4.1': this.getLocalContractAddress('safeSingleton'),
        },
    };
    contractABIs = {
        Safe: [
            'function setup(address[] calldata _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address payable paymentReceiver)',
            'function execTransaction(address to, uint256 value, bytes calldata data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address payable refundReceiver, bytes memory signatures) public payable returns (bool success)',
            'function getOwners() public view returns (address[] memory)',
            'function getThreshold() public view returns (uint256)',
            'function isOwner(address owner) public view returns (bool)',
            'function nonce() public view returns (uint256)',
        ],
        ProxyFactory: [
            'function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (address proxy)',
            'function proxyCreationCode() public pure returns (bytes memory)',
        ],
    };
    getSafeContractAddress(networkId, version) {
        if (!this.isNetworkSupported(networkId)) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED');
        }
        if (version) {
            const versionedAddress = this.versionedAddresses[networkId]?.[version];
            if (!versionedAddress) {
                throw new SafeError(`Version ${version} not available for network ${networkId}`, 'VERSION_NOT_SUPPORTED');
            }
            return versionedAddress;
        }
        return this.networks[networkId].safeAddress;
    }
    getProxyFactoryAddress(networkId) {
        if (!this.isNetworkSupported(networkId)) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED');
        }
        return this.networks[networkId].proxyFactoryAddress;
    }
    getFallbackHandlerAddress(networkId) {
        if (!this.isNetworkSupported(networkId)) {
            return undefined;
        }
        return this.networks[networkId].fallbackHandlerAddress;
    }
    isNetworkSupported(networkId) {
        return networkId in this.networks;
    }
    getSupportedNetworks() {
        return Object.keys(this.networks);
    }
    async getSafeVersion(bytecode) {
        // Simple version detection based on bytecode patterns
        // In a real implementation, this would analyze the actual bytecode
        if (bytecode.includes('608060405234801561001057600080fd5b50')) {
            return '1.4.1';
        }
        if (bytecode.length > 100) {
            return '1.3.0';
        }
        return undefined;
    }
    getLocalContractAddress(contractType) {
        try {
            const deploymentPath = require('path').join(process.cwd(), 'deployments', 'localhost.json');
            const deployment = require(deploymentPath);
            if (contractType === 'safeSingleton') {
                return deployment.contracts.safeSingleton;
            }
            else if (contractType === 'safeProxyFactory') {
                return deployment.contracts.safeProxyFactory;
            }
        }
        catch (error) {
            // If deployment file doesn't exist, return placeholder
            console.warn(`Local deployment file not found. Please run: npm run deploy:local`);
        }
        // Return placeholder addresses that will be replaced after deployment
        return contractType === 'safeSingleton'
            ? '0x0000000000000000000000000000000000000001'
            : '0x0000000000000000000000000000000000000002';
    }
    predictSafeAddress(networkId, owners, threshold, salt, fallbackHandler, version) {
        if (!this.isNetworkSupported(networkId)) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED');
        }
        const safeAddress = this.getSafeContractAddress(networkId, version);
        const proxyFactoryAddress = this.getProxyFactoryAddress(networkId);
        const defaultFallbackHandler = this.getFallbackHandlerAddress(networkId);
        // Create the initializer data for Safe setup
        const setupData = this.encodeSafeSetup(owners, threshold, fallbackHandler ||
            defaultFallbackHandler ||
            '0x0000000000000000000000000000000000000000');
        // Calculate CREATE2 address
        // This is a simplified implementation - real CREATE2 would need the full bytecode
        const initCodeHash = keccak256(solidityPackedKeccak256(['bytes', 'bytes'], [
            '0x608060405234801561001057600080fd5b50', // Simplified proxy bytecode
            setupData,
        ]));
        const create2Address = getAddress('0x' +
            keccak256(solidityPackedKeccak256(['bytes1', 'address', 'bytes32', 'bytes32'], ['0xff', proxyFactoryAddress, salt, initCodeHash])).slice(-40));
        return create2Address;
    }
    encodeSafeSetup(owners, threshold, fallbackHandler) {
        // Simplified setup encoding - real implementation would use ABI encoding
        return solidityPackedKeccak256(['address[]', 'uint256', 'address'], [owners, threshold, fallbackHandler]);
    }
    validateSafeAddress(address) {
        try {
            const checksummed = getAddress(address);
            return checksummed.length === 42 && checksummed.startsWith('0x');
        }
        catch {
            return false;
        }
    }
    getContractABI(contractName) {
        if (!(contractName in this.contractABIs)) {
            throw new SafeError(`Unknown contract: ${contractName}`, 'UNKNOWN_CONTRACT');
        }
        return this.contractABIs[contractName];
    }
    getNetworkInfo(networkId) {
        if (!this.isNetworkSupported(networkId)) {
            throw new SafeError(`Network ${networkId} is not supported`, 'NETWORK_NOT_SUPPORTED');
        }
        return this.networks[networkId];
    }
    validateNetwork(networkId) {
        return this.isNetworkSupported(networkId);
    }
}
