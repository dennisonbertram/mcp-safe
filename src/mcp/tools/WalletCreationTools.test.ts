import { describe, it, expect, beforeEach } from '@jest/globals';
import { WalletCreationTools } from './WalletCreationTools';
import { ContractRegistry } from '../../network/ContractRegistry';
import { SafeConfig } from '../../config/types';

describe('WalletCreationTools', () => {
  let walletTools: WalletCreationTools;
  let mockContractRegistry: ContractRegistry;

  beforeEach(() => {
    mockContractRegistry = new ContractRegistry();
    
    // Mock the validation methods for testing
    jest.spyOn(mockContractRegistry, 'validateSafeAddress').mockImplementation((address: string) => {
      // Accept any valid Ethereum address format
      return /^0x[a-fA-F0-9]{40}$/.test(address);
    });
    
    jest.spyOn(mockContractRegistry, 'isNetworkSupported').mockImplementation((networkId: string) => {
      // Accept test networks
      return ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:11155111'].includes(networkId);
    });
    
    walletTools = new WalletCreationTools(mockContractRegistry);
  });

  describe('safe_create_wallet_config tool', () => {
    it('should be registered as an MCP tool', () => {
      const tools = walletTools.getTools();
      const configTool = tools.find(tool => tool.name === 'safe_create_wallet_config');
      
      expect(configTool).toBeDefined();
      expect(configTool?.description).toContain('Validate and configure Safe wallet parameters');
    });

    it('should validate valid wallet configuration', async () => {
      const validConfig = {
        owners: [
          '0x1234567890123456789012345678901234567890',
          '0x2345678901234567890123456789012345678901'
        ],
        threshold: 2,
        networkId: 'eip155:1',
        saltNonce: '12345'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', validConfig);

      expect(result.isError).toBe(false);
      expect(result.content[0]?.type).toBe('text');
      
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(true);
      expect(configResult.configuration.owners).toEqual(validConfig.owners);
      expect(configResult.configuration.threshold).toBe(validConfig.threshold);
      expect(configResult.configuration.networkId).toBe(validConfig.networkId);
    });

    it('should reject invalid threshold (greater than owners)', async () => {
      const invalidConfig = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 2,
        networkId: 'eip155:1'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', invalidConfig);

      expect(result.isError).toBe(true);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(false);
      expect(configResult.errors).toContain('Threshold cannot be greater than number of owners');
    });

    it('should reject zero threshold', async () => {
      const invalidConfig = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 0,
        networkId: 'eip155:1'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', invalidConfig);

      expect(result.isError).toBe(true);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(false);
      expect(configResult.errors).toContain('Threshold must be greater than 0');
    });

    it('should reject invalid owner addresses', async () => {
      const invalidConfig = {
        owners: ['0x123', 'invalid-address'],
        threshold: 1,
        networkId: 'eip155:1'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', invalidConfig);

      expect(result.isError).toBe(true);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(false);
      expect(configResult.errors.some((err: string) => err.includes('Invalid owner address'))).toBe(true);
    });

    it('should reject unsupported networks', async () => {
      const invalidConfig = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:999'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', invalidConfig);

      expect(result.isError).toBe(true);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(false);
      expect(configResult.errors).toContain('Network eip155:999 is not supported');
    });

    it('should validate fallback handler addresses', async () => {
      const configWithHandler = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:1',
        fallbackHandler: '0x2345678901234567890123456789012345678901'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', configWithHandler);

      expect(result.isError).toBe(false);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(true);
      expect(configResult.configuration.fallbackHandler).toBe(configWithHandler.fallbackHandler);
    });

    it('should reject invalid fallback handler addresses', async () => {
      const invalidConfig = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:1',
        fallbackHandler: '0x123'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', invalidConfig);

      expect(result.isError).toBe(true);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(false);
      expect(configResult.errors).toContain('Invalid fallback handler address');
    });

    it('should validate module and guard configurations', async () => {
      const configWithModules = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:1',
        modules: ['0x2345678901234567890123456789012345678901'],
        guard: '0x3456789012345678901234567890123456789012'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', configWithModules);

      expect(result.isError).toBe(false);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(true);
      expect(configResult.configuration.modules).toEqual(configWithModules.modules);
      expect(configResult.configuration.guard).toBe(configWithModules.guard);
    });

    it('should provide validation warnings for security considerations', async () => {
      const singleOwnerConfig = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:1'
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', singleOwnerConfig);

      expect(result.isError).toBe(false);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(true);
      expect(configResult.warnings).toBeDefined();
      expect(configResult.warnings.some((warning: string) => 
        warning.includes('Single owner')
      )).toBe(true);
    });

    it('should handle missing required parameters', async () => {
      const incompleteConfig = {
        owners: ['0x1234567890123456789012345678901234567890']
        // Missing threshold and networkId
      };

      const result = await walletTools.handleToolCall('safe_create_wallet_config', incompleteConfig);

      expect(result.isError).toBe(true);
      const configResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(configResult.isValid).toBe(false);
      expect(configResult.errors.some((err: string) => err.includes('threshold'))).toBe(true);
      expect(configResult.errors.some((err: string) => err.includes('networkId'))).toBe(true);
    });

    it('should return proper tool schema', () => {
      const tools = walletTools.getTools();
      const configTool = tools.find(tool => tool.name === 'safe_create_wallet_config');
      
      expect(configTool?.inputSchema).toBeDefined();
      expect(configTool?.inputSchema.type).toBe('object');
      expect(configTool?.inputSchema.properties).toHaveProperty('owners');
      expect(configTool?.inputSchema.properties).toHaveProperty('threshold');
      expect(configTool?.inputSchema.properties).toHaveProperty('networkId');
      expect(configTool?.inputSchema.required).toContain('owners');
      expect(configTool?.inputSchema.required).toContain('threshold');
      expect(configTool?.inputSchema.required).toContain('networkId');
    });
  });

  describe('safe_predict_address tool', () => {
    it('should be registered as an MCP tool', () => {
      const tools = walletTools.getTools();
      const predictTool = tools.find(tool => tool.name === 'safe_predict_address');
      
      expect(predictTool).toBeDefined();
      expect(predictTool?.description).toContain('Predict the address of a Safe wallet');
    });

    it('should predict address for valid wallet configuration', async () => {
      const validConfig = {
        owners: [
          '0x1234567890123456789012345678901234567890',
          '0x2345678901234567890123456789012345678901'
        ],
        threshold: 2,
        networkId: 'eip155:1',
        saltNonce: '12345'
      };

      const result = await walletTools.handleToolCall('safe_predict_address', validConfig);

      expect(result.isError).toBe(false);
      expect(result.content[0]?.type).toBe('text');
      
      const addressResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(addressResult.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addressResult.isDeployed).toBe(false);
      expect(addressResult.configuration).toEqual(validConfig);
    });

    it('should reject invalid configuration for prediction', async () => {
      const invalidConfig = {
        owners: ['0x123'],
        threshold: 0,
        networkId: 'eip155:999'
      };

      const result = await walletTools.handleToolCall('safe_predict_address', invalidConfig);

      expect(result.isError).toBe(true);
      const errorResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(errorResult.isValid).toBe(false);
      expect(errorResult.errors.length).toBeGreaterThan(0);
    });

    it('should handle network-specific prediction', async () => {
      const config = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:137' // Polygon
      };

      const result = await walletTools.handleToolCall('safe_predict_address', config);

      expect(result.isError).toBe(false);
      const addressResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(addressResult.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(addressResult.networkId).toBe('eip155:137');
    });

    it('should return proper tool schema for address prediction', () => {
      const tools = walletTools.getTools();
      const predictTool = tools.find(tool => tool.name === 'safe_predict_address');
      
      expect(predictTool?.inputSchema).toBeDefined();
      expect(predictTool?.inputSchema.type).toBe('object');
      expect(predictTool?.inputSchema.properties).toHaveProperty('owners');
      expect(predictTool?.inputSchema.properties).toHaveProperty('threshold');
      expect(predictTool?.inputSchema.properties).toHaveProperty('networkId');
      expect(predictTool?.inputSchema.required).toContain('owners');
      expect(predictTool?.inputSchema.required).toContain('threshold');
      expect(predictTool?.inputSchema.required).toContain('networkId');
    });
  });

  describe('safe_deploy_wallet tool', () => {
    it('should be registered as an MCP tool', () => {
      const tools = walletTools.getTools();
      const deployTool = tools.find(tool => tool.name === 'safe_deploy_wallet');
      
      expect(deployTool).toBeDefined();
      expect(deployTool?.description).toContain('Deploy a new Safe wallet');
    });

    it('should deploy wallet with valid configuration', async () => {
      const validConfig = {
        owners: [
          '0x1234567890123456789012345678901234567890',
          '0x2345678901234567890123456789012345678901'
        ],
        threshold: 2,
        networkId: 'eip155:1',
        saltNonce: '12345',
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      };

      const result = await walletTools.handleToolCall('safe_deploy_wallet', validConfig);

      expect(result.isError).toBe(false);
      expect(result.content[0]?.type).toBe('text');
      
      const deployResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(deployResult.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(deployResult.transactionHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(deployResult.isDeployed).toBe(true);
      expect(deployResult.configuration.owners).toEqual(validConfig.owners);
      expect(deployResult.configuration.threshold).toBe(validConfig.threshold);
      expect(deployResult.configuration.networkId).toBe(validConfig.networkId);
      expect(deployResult.configuration.saltNonce).toBe(validConfig.saltNonce);
    });

    it('should reject invalid configuration for deployment', async () => {
      const invalidConfig = {
        owners: ['0x123'],
        threshold: 0,
        networkId: 'eip155:999',
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      };

      const result = await walletTools.handleToolCall('safe_deploy_wallet', invalidConfig);

      expect(result.isError).toBe(true);
      const errorResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(errorResult.isValid).toBe(false);
      expect(errorResult.errors.length).toBeGreaterThan(0);
    });

    it('should require private key for deployment', async () => {
      const configWithoutKey = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:1'
      };

      const result = await walletTools.handleToolCall('safe_deploy_wallet', configWithoutKey);

      expect(result.isError).toBe(true);
      expect((result.content[0] as any)?.text).toContain('Private key is required');
    });

    it('should handle deployment with optional parameters', async () => {
      const configWithOptions = {
        owners: ['0x1234567890123456789012345678901234567890'],
        threshold: 1,
        networkId: 'eip155:137',
        fallbackHandler: '0x2345678901234567890123456789012345678901',
        modules: ['0x3456789012345678901234567890123456789012'],
        privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
      };

      const result = await walletTools.handleToolCall('safe_deploy_wallet', configWithOptions);

      expect(result.isError).toBe(false);
      const deployResult = JSON.parse((result.content[0] as any)?.text as string);
      expect(deployResult.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(deployResult.configuration.fallbackHandler).toBe(configWithOptions.fallbackHandler);
      expect(deployResult.configuration.modules).toEqual(configWithOptions.modules);
    });

    it('should return proper tool schema for deployment', () => {
      const tools = walletTools.getTools();
      const deployTool = tools.find(tool => tool.name === 'safe_deploy_wallet');
      
      expect(deployTool?.inputSchema).toBeDefined();
      expect(deployTool?.inputSchema.type).toBe('object');
      expect(deployTool?.inputSchema.properties).toHaveProperty('owners');
      expect(deployTool?.inputSchema.properties).toHaveProperty('threshold');
      expect(deployTool?.inputSchema.properties).toHaveProperty('networkId');
      expect(deployTool?.inputSchema.properties).toHaveProperty('privateKey');
      expect(deployTool?.inputSchema.required).toContain('owners');
      expect(deployTool?.inputSchema.required).toContain('threshold');
      expect(deployTool?.inputSchema.required).toContain('networkId');
      expect(deployTool?.inputSchema.required).toContain('privateKey');
    });
  });

  describe('MCP Tool Interface', () => {
    it('should implement proper MCP tool registration', () => {
      const tools = walletTools.getTools();
      
      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
      
      tools.forEach(tool => {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.inputSchema).toBeDefined();
      });
    });

    it('should handle unknown tool names', async () => {
      const result = await walletTools.handleToolCall('unknown_tool', {});
      
      expect(result.isError).toBe(true);
      expect(result.content[0]?.type).toBe('text');
      expect((result.content[0] as any)?.text).toContain('Unknown tool');
    });

    it('should handle tool execution errors gracefully', async () => {
      // Pass malformed data to trigger error handling
      const result = await walletTools.handleToolCall('safe_create_wallet_config', null);
      
      expect(result.isError).toBe(true);
      expect(result.content[0]?.type).toBe('text');
      expect((result.content[0] as any)?.text).toContain('error');
    });
  });
});