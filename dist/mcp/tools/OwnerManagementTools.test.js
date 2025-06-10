import { OwnerManagementTools } from './OwnerManagementTools';
import { SafeError, ErrorCodes } from '../../utils/SafeError';
describe('OwnerManagementTools', () => {
    let tools;
    let mockRegistry;
    beforeEach(() => {
        mockRegistry = {
            getSafeAddress: jest.fn(),
            getProxyFactoryAddress: jest.fn(),
            getMultiSendAddress: jest.fn(),
            getCompatibilityFallbackHandlerAddress: jest.fn(),
            validateNetwork: jest.fn(),
        };
        tools = new OwnerManagementTools(mockRegistry);
    });
    describe('getTools', () => {
        it('should return all owner management tools', () => {
            const toolList = tools.getTools();
            expect(toolList).toHaveLength(3);
            const toolNames = toolList.map(tool => tool.name);
            expect(toolNames).toContain('safe_add_owner');
            expect(toolNames).toContain('safe_remove_owner');
            expect(toolNames).toContain('safe_change_threshold');
        });
        it('should have proper tool schemas', () => {
            const toolList = tools.getTools();
            toolList.forEach(tool => {
                expect(tool).toHaveProperty('name');
                expect(tool).toHaveProperty('description');
                expect(tool).toHaveProperty('inputSchema');
                expect(tool.inputSchema).toHaveProperty('type', 'object');
                expect(tool.inputSchema).toHaveProperty('properties');
                expect(tool.inputSchema).toHaveProperty('required');
            });
        });
    });
    describe('safe_add_owner', () => {
        const validAddOwnerArgs = {
            safeAddress: '0x1234567890123456789012345678901234567890',
            ownerAddress: '0x0987654321098765432109876543210987654321',
            threshold: 2,
            networkId: 'eip155:1',
            privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        };
        beforeEach(() => {
            mockRegistry.validateNetwork.mockReturnValue(true);
        });
        it('should validate required fields', async () => {
            const requiredFields = ['safeAddress', 'ownerAddress', 'networkId', 'privateKey'];
            for (const field of requiredFields) {
                const invalidArgs = { ...validAddOwnerArgs };
                delete invalidArgs[field];
                const result = await tools.handleToolCall('safe_add_owner', invalidArgs);
                expect(result.isError).toBe(true);
                expect(result.content[0]?.text).toContain('validation failed');
            }
        });
        it('should validate safe address format', async () => {
            const invalidArgs = {
                ...validAddOwnerArgs,
                safeAddress: 'invalid-address'
            };
            const result = await tools.handleToolCall('safe_add_owner', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid Safe address format');
        });
        it('should validate owner address format', async () => {
            const invalidArgs = {
                ...validAddOwnerArgs,
                ownerAddress: 'invalid-address'
            };
            const result = await tools.handleToolCall('safe_add_owner', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid owner address format');
        });
        it('should validate network format', async () => {
            mockRegistry.validateNetwork.mockReturnValue(false);
            const invalidArgs = {
                ...validAddOwnerArgs,
                networkId: 'invalid-network'
            };
            const result = await tools.handleToolCall('safe_add_owner', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid or unsupported network');
        });
        it('should validate private key format', async () => {
            const invalidArgs = {
                ...validAddOwnerArgs,
                privateKey: 'invalid-key'
            };
            const result = await tools.handleToolCall('safe_add_owner', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid private key format');
        });
        it('should validate threshold range', async () => {
            const invalidArgs = {
                ...validAddOwnerArgs,
                threshold: 0
            };
            const result = await tools.handleToolCall('safe_add_owner', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid threshold');
        });
        it('should successfully add an owner', async () => {
            const result = await tools.handleToolCall('safe_add_owner', validAddOwnerArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response).toHaveProperty('transactionHash');
            expect(response).toHaveProperty('status', 'executed');
            expect(response).toHaveProperty('operation', 'add_owner');
            expect(response).toHaveProperty('safeAddress', validAddOwnerArgs.safeAddress);
            expect(response).toHaveProperty('ownerAddress', validAddOwnerArgs.ownerAddress);
            expect(response).toHaveProperty('newThreshold', validAddOwnerArgs.threshold);
            expect(response).toHaveProperty('networkId', validAddOwnerArgs.networkId);
        });
        it('should handle optional threshold parameter', async () => {
            const minimalArgs = {
                safeAddress: validAddOwnerArgs.safeAddress,
                ownerAddress: validAddOwnerArgs.ownerAddress,
                networkId: validAddOwnerArgs.networkId,
                privateKey: validAddOwnerArgs.privateKey
            };
            const result = await tools.handleToolCall('safe_add_owner', minimalArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response.operation).toBe('add_owner');
            expect(response.newThreshold).toBeGreaterThan(0);
        });
    });
    describe('safe_remove_owner', () => {
        const validRemoveOwnerArgs = {
            safeAddress: '0x1234567890123456789012345678901234567890',
            ownerAddress: '0x0987654321098765432109876543210987654321',
            threshold: 1,
            networkId: 'eip155:1',
            privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        };
        beforeEach(() => {
            mockRegistry.validateNetwork.mockReturnValue(true);
        });
        it('should validate required fields', async () => {
            const requiredFields = ['safeAddress', 'ownerAddress', 'networkId', 'privateKey'];
            for (const field of requiredFields) {
                const invalidArgs = { ...validRemoveOwnerArgs };
                delete invalidArgs[field];
                const result = await tools.handleToolCall('safe_remove_owner', invalidArgs);
                expect(result.isError).toBe(true);
                expect(result.content[0]?.text).toContain('validation failed');
            }
        });
        it('should successfully remove an owner', async () => {
            const result = await tools.handleToolCall('safe_remove_owner', validRemoveOwnerArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response).toHaveProperty('transactionHash');
            expect(response).toHaveProperty('status', 'executed');
            expect(response).toHaveProperty('operation', 'remove_owner');
            expect(response).toHaveProperty('safeAddress', validRemoveOwnerArgs.safeAddress);
            expect(response).toHaveProperty('ownerAddress', validRemoveOwnerArgs.ownerAddress);
            expect(response).toHaveProperty('newThreshold', validRemoveOwnerArgs.threshold);
            expect(response).toHaveProperty('networkId', validRemoveOwnerArgs.networkId);
        });
    });
    describe('safe_change_threshold', () => {
        const validChangeThresholdArgs = {
            safeAddress: '0x1234567890123456789012345678901234567890',
            threshold: 3,
            networkId: 'eip155:1',
            privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
        };
        beforeEach(() => {
            mockRegistry.validateNetwork.mockReturnValue(true);
        });
        it('should validate required fields', async () => {
            const requiredFields = ['safeAddress', 'threshold', 'networkId', 'privateKey'];
            for (const field of requiredFields) {
                const invalidArgs = { ...validChangeThresholdArgs };
                delete invalidArgs[field];
                const result = await tools.handleToolCall('safe_change_threshold', invalidArgs);
                expect(result.isError).toBe(true);
                expect(result.content[0]?.text).toContain('validation failed');
            }
        });
        it('should validate threshold range', async () => {
            const invalidArgs = {
                ...validChangeThresholdArgs,
                threshold: 0 // Invalid: minimum threshold is 1
            };
            const result = await tools.handleToolCall('safe_change_threshold', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid threshold');
        });
        it('should successfully change threshold', async () => {
            const result = await tools.handleToolCall('safe_change_threshold', validChangeThresholdArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response).toHaveProperty('transactionHash');
            expect(response).toHaveProperty('status', 'executed');
            expect(response).toHaveProperty('operation', 'change_threshold');
            expect(response).toHaveProperty('safeAddress', validChangeThresholdArgs.safeAddress);
            expect(response).toHaveProperty('newThreshold', validChangeThresholdArgs.threshold);
            expect(response).toHaveProperty('networkId', validChangeThresholdArgs.networkId);
        });
    });
    describe('handleToolCall', () => {
        it('should handle unknown tool names', async () => {
            const result = await tools.handleToolCall('unknown_tool', {});
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Unknown tool');
        });
        it('should handle SafeError exceptions', async () => {
            // Mock a method to throw SafeError
            jest.spyOn(tools, 'addOwner').mockImplementation(() => {
                throw new SafeError('Test error', ErrorCodes.VALIDATION_ERROR);
            });
            const result = await tools.handleToolCall('safe_add_owner', {
                safeAddress: '0x1234567890123456789012345678901234567890',
                ownerAddress: '0x0987654321098765432109876543210987654321',
                networkId: 'eip155:1',
                privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
            });
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Test error');
        });
        it('should handle unexpected errors', async () => {
            // Mock a method to throw generic error
            jest.spyOn(tools, 'addOwner').mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            const result = await tools.handleToolCall('safe_add_owner', {
                safeAddress: '0x1234567890123456789012345678901234567890',
                ownerAddress: '0x0987654321098765432109876543210987654321',
                networkId: 'eip155:1',
                privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
            });
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Unexpected error');
        });
    });
});
