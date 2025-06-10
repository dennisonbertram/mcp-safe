export interface NetworkInfo {
    name: string;
    chainId: number;
    safeAddress: string;
    proxyFactoryAddress: string;
    fallbackHandlerAddress?: string;
}
export interface ContractAddresses {
    safe: Record<string, string>;
    proxyFactory: string;
    fallbackHandler?: string;
}
export declare class ContractRegistry {
    private networks;
    private versionedAddresses;
    private contractABIs;
    getSafeContractAddress(networkId: string, version?: string): string;
    getProxyFactoryAddress(networkId: string): string;
    getFallbackHandlerAddress(networkId: string): string | undefined;
    isNetworkSupported(networkId: string): boolean;
    getSupportedNetworks(): string[];
    getSafeVersion(bytecode: string): Promise<string | undefined>;
    predictSafeAddress(networkId: string, owners: string[], threshold: number, salt: string, fallbackHandler?: string, version?: string): string;
    private encodeSafeSetup;
    validateSafeAddress(address: string): boolean;
    getContractABI(contractName: string): any[];
    getNetworkInfo(networkId: string): NetworkInfo;
    validateNetwork(networkId: string): boolean;
}
