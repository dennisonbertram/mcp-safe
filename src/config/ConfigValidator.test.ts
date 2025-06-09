import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigValidator } from './ConfigValidator';

describe('ConfigValidator', () => {
  let validator: ConfigValidator;

  beforeEach(() => {
    validator = new ConfigValidator();
  });

  describe('validateConfig', () => {
    it('should validate correct configuration', () => {
      const config = {
        defaultNetwork: 'eip155:1',
        networks: {
          'eip155:1': {
            rpcUrl: 'https://eth.example.com',
          },
        },
        apiKeys: {
          anthropic: 'sk-ant-test',
        },
      };

      const result = validator.validateConfig(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(config);
    });

    it('should reject invalid CAIP-2 network identifier', () => {
      const config = {
        networks: {
          'invalid-network': {
            rpcUrl: 'https://example.com',
          },
        },
      };

      const result = validator.validateConfig(config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject invalid RPC URL', () => {
      const config = {
        networks: {
          'eip155:1': {
            rpcUrl: 'not-a-url',
          },
        },
      };

      const result = validator.validateConfig(config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should accept optional fields', () => {
      const config = {};

      const result = validator.validateConfig(config);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({});
    });
  });

  describe('validateCAIP2', () => {
    it('should validate correct CAIP-2 identifiers', () => {
      expect(validator.validateCAIP2('eip155:1')).toBe(true);
      expect(validator.validateCAIP2('eip155:137')).toBe(true);
      expect(validator.validateCAIP2('eip155:42161')).toBe(true);
      expect(validator.validateCAIP2('eip155:11155111')).toBe(true);
    });

    it('should reject invalid CAIP-2 identifiers', () => {
      expect(validator.validateCAIP2('ethereum')).toBe(false);
      expect(validator.validateCAIP2('eip155')).toBe(false);
      expect(validator.validateCAIP2('eip155:')).toBe(false);
      expect(validator.validateCAIP2('eip155:abc')).toBe(false);
      expect(validator.validateCAIP2('invalid:1')).toBe(false);
    });
  });

  describe('validateEthereumAddress', () => {
    it('should validate correct Ethereum addresses', () => {
      expect(
        validator.validateEthereumAddress(
          '0x742d35Cc6634C0532925a3b8D46dE3C4df6Eb2fa'
        )
      ).toBe(true);
      expect(
        validator.validateEthereumAddress(
          '0x0000000000000000000000000000000000000000'
        )
      ).toBe(true);
    });

    it('should reject invalid Ethereum addresses', () => {
      expect(validator.validateEthereumAddress('0x123')).toBe(false);
      expect(validator.validateEthereumAddress('123')).toBe(false);
      expect(
        validator.validateEthereumAddress(
          '0x742d35Cc6634C0532925a3b8D46dE3C4df6Eb2fag'
        )
      ).toBe(false);
      expect(validator.validateEthereumAddress('')).toBe(false);
    });
  });
});
