import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { SafeFactory } from '@safe-global/protocol-kit';

/**
 * Factory for creating blockchain providers and Safe SDK instances
 */
export class ProviderFactory {
  private providers = new Map<string, JsonRpcProvider>();

  /**
   * Get or create RPC provider for network
   */
  async getProvider(networkId: string, rpcUrl?: string): Promise<JsonRpcProvider> {
    if (!this.providers.has(networkId)) {
      const url = rpcUrl || this.getDefaultRpcUrl(networkId);
      const provider = new JsonRpcProvider(url);

      // Test connection
      await provider.getNetwork();
      this.providers.set(networkId, provider);
    }

    return this.providers.get(networkId)!;
  }

  /**
   * Get ethers provider URL for Safe SDK
   */
  private async getProviderUrl(networkId: string, rpcUrl?: string): Promise<string> {
    const provider = await this.getProvider(networkId, rpcUrl);
    // Extract the URL from the provider connection
    return (provider as any)._getConnection().url || this.getDefaultRpcUrl(networkId);
  }

  /**
   * Create Safe SDK instance
   */
  async getSafe(
    safeAddress: string,
    networkId: string,
    privateKey?: string,
    rpcUrl?: string
  ): Promise<any> {
    const providerUrl = await this.getProviderUrl(networkId, rpcUrl);

    // Dynamic import to handle ESM/CJS interop
    const SafeModule = await import('@safe-global/protocol-kit');
    const Safe = (SafeModule.default as any).default || SafeModule.default;

    return await Safe.init({
      provider: providerUrl,
      signer: privateKey,
      safeAddress,
    });
  }

  /**
   * Create Safe Factory for deployment
   */
  async getSafeFactory(
    networkId: string,
    privateKey: string,
    rpcUrl?: string
  ): Promise<SafeFactory> {
    const providerUrl = await this.getProviderUrl(networkId, rpcUrl);

    return await SafeFactory.init({
      provider: providerUrl,
      signer: privateKey,
    });
  }

  /**
   * Get default RPC URL for network
   */
  private getDefaultRpcUrl(networkId: string): string {
    const rpcUrls: Record<string, string> = {
      'eip155:1': process.env.SAFE_RPC_EIP155_1 || 'https://eth.llamarpc.com',
      'eip155:137': process.env.SAFE_RPC_EIP155_137 || 'https://polygon.llamarpc.com',
      'eip155:42161': process.env.SAFE_RPC_EIP155_42161 || 'https://arbitrum.llamarpc.com',
      'eip155:10': process.env.SAFE_RPC_EIP155_10 || 'https://optimism.llamarpc.com',
      'eip155:8453': process.env.SAFE_RPC_EIP155_8453 || 'https://base.llamarpc.com',
      'eip155:100': process.env.SAFE_RPC_EIP155_100 || 'https://gnosis.llamarpc.com',
      'eip155:42220': process.env.SAFE_RPC_EIP155_42220 || 'https://celo.llamarpc.com',
      'eip155:43114': process.env.SAFE_RPC_EIP155_43114 || 'https://avalanche.llamarpc.com',
      'eip155:11155111': process.env.SAFE_RPC_EIP155_11155111 || 'https://sepolia.llamarpc.com',
      'eip155:31337': process.env.SAFE_RPC_EIP155_31337 || 'http://127.0.0.1:8545',
    };

    if (!rpcUrls[networkId]) {
      throw new Error(`No RPC URL configured for network ${networkId}`);
    }

    return rpcUrls[networkId]!;
  }

  /**
   * Clear cached providers
   */
  clearCache(): void {
    this.providers.clear();
  }
}


