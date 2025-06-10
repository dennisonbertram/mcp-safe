import { describe, it, expect, beforeEach } from '@jest/globals';
import { ConfigMerger } from './ConfigMerger';
describe('ConfigMerger', () => {
    let merger;
    beforeEach(() => {
        merger = new ConfigMerger();
    });
    describe('mergeConfigs', () => {
        it('should merge configs with correct priority (runtime > env > file > defaults)', () => {
            const defaults = {
                defaultNetwork: 'eip155:1',
                networks: {
                    'eip155:1': { rpcUrl: 'https://default.com' },
                },
                apiKeys: { anthropic: 'default-key' },
            };
            const fileConfig = {
                defaultNetwork: 'eip155:137',
                networks: {
                    'eip155:137': { rpcUrl: 'https://file.com' },
                },
            };
            const envConfig = {
                networks: {
                    'eip155:1': { rpcUrl: 'https://env.com' },
                },
                apiKeys: { openai: 'env-key' },
            };
            const runtimeConfig = {
                networks: {
                    'eip155:1': { rpcUrl: 'https://runtime.com' },
                },
            };
            const result = merger.mergeConfigs(defaults, fileConfig, envConfig, runtimeConfig);
            expect(result).toEqual({
                defaultNetwork: 'eip155:137', // from file (env didn't override)
                networks: {
                    'eip155:1': { rpcUrl: 'https://runtime.com' }, // runtime wins
                    'eip155:137': { rpcUrl: 'https://file.com' }, // from file
                },
                apiKeys: {
                    anthropic: 'default-key', // from defaults
                    openai: 'env-key', // from env
                },
            });
        });
        it('should handle empty configs', () => {
            const result = merger.mergeConfigs({}, {}, {}, {});
            expect(result).toEqual({});
        });
        it('should deep merge network configurations', () => {
            const config1 = {
                networks: {
                    'eip155:1': {
                        rpcUrl: 'https://test.com',
                        timeout: 5000,
                    },
                },
            };
            const config2 = {
                networks: {
                    'eip155:1': {
                        rpcUrl: 'https://test.com', // Required field
                        apiKey: 'test-key',
                    },
                },
            };
            const result = merger.mergeConfigs(config1, config2);
            expect(result.networks['eip155:1']).toEqual({
                rpcUrl: 'https://test.com',
                timeout: 5000,
                apiKey: 'test-key',
            });
        });
    });
    describe('applyRuntimeOverrides', () => {
        it('should apply runtime network overrides', () => {
            const baseConfig = {
                networks: {
                    'eip155:1': { rpcUrl: 'https://base.com' },
                },
            };
            const overrides = {
                network: 'eip155:1',
                rpcUrl: 'https://override.com',
                apiKey: 'override-key',
            };
            const result = merger.applyRuntimeOverrides(baseConfig, overrides);
            expect(result.networks['eip155:1']).toEqual({
                rpcUrl: 'https://override.com',
                apiKey: 'override-key',
            });
        });
        it('should create new network if not exists', () => {
            const baseConfig = { networks: {} };
            const overrides = {
                network: 'eip155:137',
                rpcUrl: 'https://new.com',
            };
            const result = merger.applyRuntimeOverrides(baseConfig, overrides);
            expect(result.networks['eip155:137']).toEqual({
                rpcUrl: 'https://new.com',
            });
        });
    });
});
