import { describe, it, expect, beforeEach } from '@jest/globals';
import { ContractRegistry } from './ContractRegistry';
describe('ContractRegistry', () => {
    let registry;
    beforeEach(() => {
        registry = new ContractRegistry();
    });
    describe('getSafeContractAddress', () => {
        it('should return Safe singleton address for supported networks', () => {
            const ethMainnetAddress = registry.getSafeContractAddress('eip155:1');
            const polygonAddress = registry.getSafeContractAddress('eip155:137');
            const arbitrumAddress = registry.getSafeContractAddress('eip155:42161');
            expect(ethMainnetAddress).toBeDefined();
            expect(polygonAddress).toBeDefined();
            expect(arbitrumAddress).toBeDefined();
            expect(ethMainnetAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
            expect(polygonAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
            expect(arbitrumAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
        it('should throw error for unsupported network', () => {
            expect(() => registry.getSafeContractAddress('eip155:999')).toThrow('Network eip155:999 is not supported');
        });
        it('should return version-specific addresses when requested', () => {
            const v130Address = registry.getSafeContractAddress('eip155:1', '1.3.0');
            const v141Address = registry.getSafeContractAddress('eip155:1', '1.4.1');
            expect(v130Address).toBeDefined();
            expect(v141Address).toBeDefined();
            expect(v130Address).not.toBe(v141Address);
        });
    });
    describe('getProxyFactoryAddress', () => {
        it('should return proxy factory address for supported networks', () => {
            const factoryAddress = registry.getProxyFactoryAddress('eip155:1');
            expect(factoryAddress).toBeDefined();
            expect(factoryAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
        it('should throw error for unsupported network', () => {
            expect(() => registry.getProxyFactoryAddress('eip155:999')).toThrow('Network eip155:999 is not supported');
        });
    });
    describe('getFallbackHandlerAddress', () => {
        it('should return fallback handler address for supported networks', () => {
            const handlerAddress = registry.getFallbackHandlerAddress('eip155:1');
            expect(handlerAddress).toBeDefined();
            expect(handlerAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
        it('should return undefined for networks without fallback handler', () => {
            const handlerAddress = registry.getFallbackHandlerAddress('eip155:999');
            expect(handlerAddress).toBeUndefined();
        });
    });
    describe('isNetworkSupported', () => {
        it('should return true for supported networks', () => {
            expect(registry.isNetworkSupported('eip155:1')).toBe(true);
            expect(registry.isNetworkSupported('eip155:137')).toBe(true);
            expect(registry.isNetworkSupported('eip155:42161')).toBe(true);
            expect(registry.isNetworkSupported('eip155:11155111')).toBe(true);
        });
        it('should return false for unsupported networks', () => {
            expect(registry.isNetworkSupported('eip155:999')).toBe(false);
            expect(registry.isNetworkSupported('invalid')).toBe(false);
        });
    });
    describe('getSupportedNetworks', () => {
        it('should return list of all supported networks', () => {
            const networks = registry.getSupportedNetworks();
            expect(networks).toContain('eip155:1');
            expect(networks).toContain('eip155:137');
            expect(networks).toContain('eip155:42161');
            expect(networks).toContain('eip155:11155111');
            expect(networks.length).toBeGreaterThanOrEqual(4);
        });
    });
    describe('getSafeVersion', () => {
        it('should detect Safe version from bytecode', async () => {
            const mockBytecode = '0x608060405234801561001057600080fd5b50...'; // Mock Safe 1.4.1 bytecode
            const version = await registry.getSafeVersion(mockBytecode);
            expect(version).toBeDefined();
            expect(version).toMatch(/^\d+\.\d+\.\d+$/);
        });
        it('should return undefined for non-Safe contracts', async () => {
            const mockBytecode = '0x1234567890abcdef';
            const version = await registry.getSafeVersion(mockBytecode);
            expect(version).toBeUndefined();
        });
    });
    describe('predictSafeAddress', () => {
        it('should predict CREATE2 address for Safe deployment', () => {
            const owners = [
                '0x1234567890123456789012345678901234567890',
                '0x2345678901234567890123456789012345678901',
            ];
            const threshold = 1;
            const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';
            const predictedAddress = registry.predictSafeAddress('eip155:1', owners, threshold, salt);
            expect(predictedAddress).toBeDefined();
            expect(predictedAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
        });
        it('should return different addresses for different parameters', () => {
            const owners1 = ['0x1234567890123456789012345678901234567890'];
            const owners2 = ['0x2345678901234567890123456789012345678901'];
            const threshold = 1;
            const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';
            const address1 = registry.predictSafeAddress('eip155:1', owners1, threshold, salt);
            const address2 = registry.predictSafeAddress('eip155:1', owners2, threshold, salt);
            expect(address1).not.toBe(address2);
        });
        it('should throw error for unsupported network', () => {
            const owners = ['0x1234567890123456789012345678901234567890'];
            const threshold = 1;
            const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';
            expect(() => registry.predictSafeAddress('eip155:999', owners, threshold, salt)).toThrow('Network eip155:999 is not supported');
        });
    });
    describe('validateSafeAddress', () => {
        it('should validate checksummed Safe addresses', () => {
            const validAddress = '0x1234567890123456789012345678901234567890';
            const isValid = registry.validateSafeAddress(validAddress);
            expect(isValid).toBe(true);
        });
        it('should reject invalid addresses', () => {
            expect(registry.validateSafeAddress('0x123')).toBe(false);
            expect(registry.validateSafeAddress('invalid')).toBe(false);
            expect(registry.validateSafeAddress('')).toBe(false);
        });
        it('should handle case-insensitive validation', () => {
            const mixedCase = '0x1234567890123456789012345678901234567890';
            const lowerCase = mixedCase.toLowerCase();
            expect(registry.validateSafeAddress(lowerCase)).toBe(true);
            expect(registry.validateSafeAddress(mixedCase)).toBe(true);
        });
    });
    describe('getContractABI', () => {
        it('should return Safe contract ABI', () => {
            const abi = registry.getContractABI('Safe');
            expect(abi).toBeDefined();
            expect(Array.isArray(abi)).toBe(true);
            expect(abi.length).toBeGreaterThan(0);
        });
        it('should return proxy factory ABI', () => {
            const abi = registry.getContractABI('ProxyFactory');
            expect(abi).toBeDefined();
            expect(Array.isArray(abi)).toBe(true);
            expect(abi.length).toBeGreaterThan(0);
        });
        it('should throw error for unknown contract', () => {
            expect(() => registry.getContractABI('UnknownContract')).toThrow('Unknown contract: UnknownContract');
        });
    });
    describe('getNetworkInfo', () => {
        it('should return complete network information', () => {
            const networkInfo = registry.getNetworkInfo('eip155:1');
            expect(networkInfo).toBeDefined();
            expect(networkInfo.name).toBe('Ethereum Mainnet');
            expect(networkInfo.chainId).toBe(1);
            expect(networkInfo.safeAddress).toBeDefined();
            expect(networkInfo.proxyFactoryAddress).toBeDefined();
        });
        it('should throw error for unsupported network', () => {
            expect(() => registry.getNetworkInfo('eip155:999')).toThrow('Network eip155:999 is not supported');
        });
    });
});
