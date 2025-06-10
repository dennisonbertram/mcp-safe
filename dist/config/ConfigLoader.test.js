import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ConfigLoader } from './ConfigLoader';
describe('ConfigLoader', () => {
    let configLoader;
    let originalEnv;
    beforeEach(() => {
        configLoader = new ConfigLoader();
        originalEnv = { ...process.env };
    });
    afterEach(() => {
        // Clear all environment variables and restore original
        Object.keys(process.env).forEach((key) => {
            if (!(key in originalEnv)) {
                delete process.env[key];
            }
        });
        process.env = { ...originalEnv };
    });
    describe('loadFromEnv', () => {
        it('should load CAIP-2 network configurations from environment', () => {
            process.env.SAFE_RPC_EIP155_1 = 'https://eth-mainnet.example.com';
            process.env.SAFE_RPC_EIP155_137 = 'https://polygon.example.com';
            const config = configLoader.loadFromEnv();
            expect(config.networks).toBeDefined();
            expect(config.networks['eip155:1']).toEqual({
                rpcUrl: 'https://eth-mainnet.example.com',
            });
            expect(config.networks['eip155:137']).toEqual({
                rpcUrl: 'https://polygon.example.com',
            });
        });
        it('should load API keys from environment', () => {
            process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key';
            process.env.OPENAI_API_KEY = 'sk-openai-test-key';
            const config = configLoader.loadFromEnv();
            expect(config.apiKeys).toEqual({
                anthropic: 'sk-ant-test-key',
                openai: 'sk-openai-test-key',
            });
        });
        it('should set default network if SAFE_DEFAULT_NETWORK is provided', () => {
            process.env.SAFE_DEFAULT_NETWORK = 'eip155:137';
            const config = configLoader.loadFromEnv();
            expect(config.defaultNetwork).toBe('eip155:137');
        });
        it('should return empty config when no environment variables are set', () => {
            // Clear all SAFE and API key environment variables
            const keysToDelete = Object.keys(process.env).filter((key) => key.startsWith('SAFE_') || key.includes('API_KEY'));
            keysToDelete.forEach((key) => delete process.env[key]);
            const config = configLoader.loadFromEnv();
            expect(config).toEqual({});
        });
    });
    describe('loadFromFile', () => {
        it('should load configuration from JSON file', async () => {
            const mockConfig = {
                defaultNetwork: 'eip155:1',
                networks: {
                    'eip155:1': {
                        rpcUrl: 'https://file-eth.example.com',
                    },
                },
            };
            const config = await configLoader.loadFromFile(mockConfig);
            expect(config).toEqual(mockConfig);
        });
        it('should handle missing file gracefully', async () => {
            const config = await configLoader.loadFromFile('/nonexistent/path.json');
            expect(config).toEqual({});
        });
    });
    describe('parseCAIP2Networks', () => {
        it('should parse SAFE_RPC_EIP155_* environment variables correctly', () => {
            const env = {
                SAFE_RPC_EIP155_1: 'https://eth.example.com',
                SAFE_RPC_EIP155_137: 'https://polygon.example.com',
                SAFE_RPC_EIP155_42161: 'https://arbitrum.example.com',
                OTHER_VAR: 'should-be-ignored',
            };
            const networks = configLoader.parseCAIP2Networks(env);
            expect(networks).toEqual({
                'eip155:1': { rpcUrl: 'https://eth.example.com' },
                'eip155:137': { rpcUrl: 'https://polygon.example.com' },
                'eip155:42161': { rpcUrl: 'https://arbitrum.example.com' },
            });
        });
        it('should handle empty environment', () => {
            const networks = configLoader.parseCAIP2Networks({});
            expect(networks).toEqual({});
        });
    });
});
