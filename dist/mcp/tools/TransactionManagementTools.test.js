import { TransactionManagementTools } from './TransactionManagementTools';
import { SafeError, ErrorCodes } from '../../utils/SafeError';
describe('TransactionManagementTools', () => {
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
        tools = new TransactionManagementTools(mockRegistry);
    });
    describe('getTools', () => {
        it('should return all transaction management tools', () => {
            const toolList = tools.getTools();
            expect(toolList).toHaveLength(2);
            const toolNames = toolList.map((tool) => tool.name);
            expect(toolNames).toContain('safe_propose_transaction');
            expect(toolNames).toContain('safe_execute_transaction');
        });
        it('should have proper tool schemas', () => {
            const toolList = tools.getTools();
            toolList.forEach((tool) => {
                expect(tool).toHaveProperty('name');
                expect(tool).toHaveProperty('description');
                expect(tool).toHaveProperty('inputSchema');
                expect(tool.inputSchema).toHaveProperty('type', 'object');
                expect(tool.inputSchema).toHaveProperty('properties');
                expect(tool.inputSchema).toHaveProperty('required');
            });
        });
    });
    describe('safe_propose_transaction', () => {
        const validProposeArgs = {
            safeAddress: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            value: '1000000000000000000',
            data: '0x',
            networkId: 'eip155:1',
            operation: 0,
            safeTxGas: '0',
            baseGas: '0',
            gasPrice: '0',
            gasToken: '0x0000000000000000000000000000000000000000',
            refundReceiver: '0x0000000000000000000000000000000000000000',
            nonce: 0,
        };
        beforeEach(() => {
            mockRegistry.validateNetwork.mockReturnValue(true);
        });
        it('should validate required fields', async () => {
            const requiredFields = [
                'safeAddress',
                'to',
                'value',
                'data',
                'networkId',
            ];
            for (const field of requiredFields) {
                const invalidArgs = { ...validProposeArgs };
                delete invalidArgs[field];
                const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
                expect(result.isError).toBe(true);
                expect(result.content[0]?.text).toContain('validation failed');
            }
        });
        it('should validate safe address format', async () => {
            const invalidArgs = {
                ...validProposeArgs,
                safeAddress: 'invalid-address',
            };
            const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid Safe address format');
        });
        it('should validate recipient address format', async () => {
            const invalidArgs = {
                ...validProposeArgs,
                to: 'invalid-address',
            };
            const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid recipient address format');
        });
        it('should validate network format', async () => {
            mockRegistry.validateNetwork.mockReturnValue(false);
            const invalidArgs = {
                ...validProposeArgs,
                networkId: 'invalid-network',
            };
            const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid or unsupported network');
        });
        it('should validate value format', async () => {
            const invalidArgs = {
                ...validProposeArgs,
                value: 'invalid-value',
            };
            const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid value format');
        });
        it('should validate data format', async () => {
            const invalidArgs = {
                ...validProposeArgs,
                data: 'invalid-data',
            };
            const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid data format');
        });
        it('should validate operation type', async () => {
            const invalidArgs = {
                ...validProposeArgs,
                operation: 3, // Invalid operation type
            };
            const result = await tools.handleToolCall('safe_propose_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid operation type');
        });
        it('should successfully propose a valid transaction', async () => {
            const result = await tools.handleToolCall('safe_propose_transaction', validProposeArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response).toHaveProperty('transactionHash');
            expect(response).toHaveProperty('safeTxHash');
            expect(response).toHaveProperty('status', 'proposed');
            expect(response).toHaveProperty('safeAddress', validProposeArgs.safeAddress);
            expect(response).toHaveProperty('to', validProposeArgs.to);
            expect(response).toHaveProperty('value', validProposeArgs.value);
            expect(response).toHaveProperty('networkId', validProposeArgs.networkId);
        });
        it('should handle optional parameters correctly', async () => {
            const minimalArgs = {
                safeAddress: validProposeArgs.safeAddress,
                to: validProposeArgs.to,
                value: validProposeArgs.value,
                data: validProposeArgs.data,
                networkId: validProposeArgs.networkId,
            };
            const result = await tools.handleToolCall('safe_propose_transaction', minimalArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response.status).toBe('proposed');
        });
    });
    describe('safe_execute_transaction', () => {
        const validExecuteArgs = {
            safeAddress: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            value: '1000000000000000000',
            data: '0x',
            networkId: 'eip155:1',
            privateKey: '0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
            operation: 0,
            safeTxGas: '0',
            baseGas: '0',
            gasPrice: '0',
            gasToken: '0x0000000000000000000000000000000000000000',
            refundReceiver: '0x0000000000000000000000000000000000000000',
            nonce: 0,
        };
        beforeEach(() => {
            mockRegistry.validateNetwork.mockReturnValue(true);
        });
        it('should validate required fields', async () => {
            const requiredFields = [
                'safeAddress',
                'to',
                'value',
                'data',
                'networkId',
                'privateKey',
            ];
            for (const field of requiredFields) {
                const invalidArgs = { ...validExecuteArgs };
                delete invalidArgs[field];
                const result = await tools.handleToolCall('safe_execute_transaction', invalidArgs);
                expect(result.isError).toBe(true);
                expect(result.content[0]?.text).toContain('validation failed');
            }
        });
        it('should validate private key format', async () => {
            const invalidArgs = {
                ...validExecuteArgs,
                privateKey: 'invalid-key',
            };
            const result = await tools.handleToolCall('safe_execute_transaction', invalidArgs);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid private key format');
        });
        it('should successfully execute a valid transaction', async () => {
            const result = await tools.handleToolCall('safe_execute_transaction', validExecuteArgs);
            expect(result.isError).toBe(false);
            const responseText = result.content[0]?.text;
            const response = JSON.parse(responseText);
            expect(response).toHaveProperty('transactionHash');
            expect(response).toHaveProperty('status', 'executed');
            expect(response).toHaveProperty('safeAddress', validExecuteArgs.safeAddress);
            expect(response).toHaveProperty('to', validExecuteArgs.to);
            expect(response).toHaveProperty('value', validExecuteArgs.value);
            expect(response).toHaveProperty('networkId', validExecuteArgs.networkId);
            expect(response).toHaveProperty('gasUsed');
            expect(response).toHaveProperty('blockNumber');
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
            jest.spyOn(tools, 'proposeTransaction').mockImplementation(() => {
                throw new SafeError('Test error', ErrorCodes.VALIDATION_ERROR);
            });
            const result = await tools.handleToolCall('safe_propose_transaction', {
                safeAddress: '0x1234567890123456789012345678901234567890',
                to: '0x0987654321098765432109876543210987654321',
                value: '1000000000000000000',
                data: '0x',
                networkId: 'eip155:1',
            });
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Test error');
        });
        it('should handle unexpected errors', async () => {
            // Mock a method to throw generic error
            jest.spyOn(tools, 'proposeTransaction').mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            const result = await tools.handleToolCall('safe_propose_transaction', {
                safeAddress: '0x1234567890123456789012345678901234567890',
                to: '0x0987654321098765432109876543210987654321',
                value: '1000000000000000000',
                data: '0x',
                networkId: 'eip155:1',
            });
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Unexpected error');
        });
    });
});
