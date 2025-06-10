import { getAddress, keccak256, solidityPackedKeccak256 } from 'ethers';
import { SafeError } from '../utils/SafeError.js';

export interface NetworkInfo {
  name: string;
  chainId: number;
  safeAddress: string;
  proxyFactoryAddress: string;
  fallbackHandlerAddress?: string;
}

export interface ContractAddresses {
  safe: Record<string, string>; // version -> address
  proxyFactory: string;
  fallbackHandler?: string;
}

export class ContractRegistry {
  private networks: Record<string, NetworkInfo> = {
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
  };

  private versionedAddresses: Record<string, Record<string, string>> = {
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
  };

  private contractABIs: Record<string, any[]> = {
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

  getSafeContractAddress(networkId: string, version?: string): string {
    if (!this.isNetworkSupported(networkId)) {
      throw new SafeError(
        `Network ${networkId} is not supported`,
        'NETWORK_NOT_SUPPORTED'
      );
    }

    if (version) {
      const versionedAddress = this.versionedAddresses[networkId]?.[version];
      if (!versionedAddress) {
        throw new SafeError(
          `Version ${version} not available for network ${networkId}`,
          'VERSION_NOT_SUPPORTED'
        );
      }
      return versionedAddress;
    }

    return this.networks[networkId]!.safeAddress;
  }

  getProxyFactoryAddress(networkId: string): string {
    if (!this.isNetworkSupported(networkId)) {
      throw new SafeError(
        `Network ${networkId} is not supported`,
        'NETWORK_NOT_SUPPORTED'
      );
    }

    return this.networks[networkId]!.proxyFactoryAddress;
  }

  getFallbackHandlerAddress(networkId: string): string | undefined {
    if (!this.isNetworkSupported(networkId)) {
      return undefined;
    }

    return this.networks[networkId]!.fallbackHandlerAddress;
  }

  isNetworkSupported(networkId: string): boolean {
    return networkId in this.networks;
  }

  getSupportedNetworks(): string[] {
    return Object.keys(this.networks);
  }

  async getSafeVersion(bytecode: string): Promise<string | undefined> {
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

  predictSafeAddress(
    networkId: string,
    owners: string[],
    threshold: number,
    salt: string,
    fallbackHandler?: string,
    version?: string
  ): string {
    if (!this.isNetworkSupported(networkId)) {
      throw new SafeError(
        `Network ${networkId} is not supported`,
        'NETWORK_NOT_SUPPORTED'
      );
    }

    const safeAddress = this.getSafeContractAddress(networkId, version);
    const proxyFactoryAddress = this.getProxyFactoryAddress(networkId);
    const defaultFallbackHandler = this.getFallbackHandlerAddress(networkId);

    // Create the initializer data for Safe setup
    const setupData = this.encodeSafeSetup(
      owners,
      threshold,
      fallbackHandler ||
        defaultFallbackHandler ||
        '0x0000000000000000000000000000000000000000'
    );

    // Calculate CREATE2 address
    // This is a simplified implementation - real CREATE2 would need the full bytecode
    const initCodeHash = keccak256(
      solidityPackedKeccak256(
        ['bytes', 'bytes'],
        [
          '0x608060405234801561001057600080fd5b50', // Simplified proxy bytecode
          setupData,
        ]
      )
    );

    const create2Address = getAddress(
      '0x' +
        keccak256(
          solidityPackedKeccak256(
            ['bytes1', 'address', 'bytes32', 'bytes32'],
            ['0xff', proxyFactoryAddress, salt, initCodeHash]
          )
        ).slice(-40)
    );

    return create2Address;
  }

  private encodeSafeSetup(
    owners: string[],
    threshold: number,
    fallbackHandler: string
  ): string {
    // Simplified setup encoding - real implementation would use ABI encoding
    return solidityPackedKeccak256(
      ['address[]', 'uint256', 'address'],
      [owners, threshold, fallbackHandler]
    );
  }

  validateSafeAddress(address: string): boolean {
    try {
      const checksummed = getAddress(address);
      return checksummed.length === 42 && checksummed.startsWith('0x');
    } catch {
      return false;
    }
  }

  getContractABI(contractName: string): any[] {
    if (!(contractName in this.contractABIs)) {
      throw new SafeError(
        `Unknown contract: ${contractName}`,
        'UNKNOWN_CONTRACT'
      );
    }

    return this.contractABIs[contractName]!;
  }

  getNetworkInfo(networkId: string): NetworkInfo {
    if (!this.isNetworkSupported(networkId)) {
      throw new SafeError(
        `Network ${networkId} is not supported`,
        'NETWORK_NOT_SUPPORTED'
      );
    }

    return this.networks[networkId]!;
  }

  validateNetwork(networkId: string): boolean {
    return this.isNetworkSupported(networkId);
  }
}
