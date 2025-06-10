import { describe, it, expect, beforeEach } from '@jest/globals';
import { WalletQueryTools } from './WalletQueryTools';
import { ContractRegistry } from '../../network/ContractRegistry';
describe('WalletQueryTools', () => {
    let queryTools;
    let mockContractRegistry;
    beforeEach(() => {
        mockContractRegistry = new ContractRegistry();
        // Mock the validation methods for testing
        jest.spyOn(mockContractRegistry, 'validateSafeAddress').mockImplementation((address) => {
            // Accept any valid Ethereum address format
            return /^0x[a-fA-F0-9]{40}$/.test(address);
        });
        jest.spyOn(mockContractRegistry, 'isNetworkSupported').mockImplementation((networkId) => {
            // Accept test networks
            return ['eip155:1', 'eip155:137', 'eip155:42161', 'eip155:11155111'].includes(networkId);
        });
        queryTools = new WalletQueryTools(mockContractRegistry);
    });
    describe('safe_get_info tool', () => {
        it('should be registered as an MCP tool', () => {
            const tools = queryTools.getTools();
            const infoTool = tools.find(tool => tool.name === 'safe_get_info');
            expect(infoTool).toBeDefined();
            expect(infoTool?.description).toContain('Get comprehensive information about a Safe wallet');
        });
        it('should get info for valid Safe address', async () => {
            const validQuery = {
                address: '0x1234567890123456789012345678901234567890',
                networkId: 'eip155:1'
            };
            const result = await queryTools.handleToolCall('safe_get_info', validQuery);
            expect(result.isError).toBe(false);
            expect(result.content[0]?.type).toBe('text');
            const safeInfo = JSON.parse(result.content[0]?.text);
            expect(safeInfo.address).toBe(validQuery.address);
            expect(safeInfo.networkId).toBe(validQuery.networkId);
            expect(safeInfo.isDeployed).toBe(true);
            expect(Array.isArray(safeInfo.owners)).toBe(true);
            expect(safeInfo.owners.length).toBeGreaterThan(0);
            expect(typeof safeInfo.threshold).toBe('number');
            expect(safeInfo.threshold).toBeGreaterThanOrEqual(1);
            expect(safeInfo.threshold).toBeLessThanOrEqual(safeInfo.owners.length);
            expect(typeof safeInfo.nonce).toBe('number');
            expect(typeof safeInfo.version).toBe('string');
            expect(typeof safeInfo.balance).toBe('string');
            expect(Array.isArray(safeInfo.modules)).toBe(true);
        });
        it('should reject invalid address format', async () => {
            const invalidQuery = {
                address: '0x123',
                networkId: 'eip155:1'
            };
            const result = await queryTools.handleToolCall('safe_get_info', invalidQuery);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid Safe address format');
        });
        it('should reject unsupported networks', async () => {
            const invalidQuery = {
                address: '0x1234567890123456789012345678901234567890',
                networkId: 'eip155:999'
            };
            const result = await queryTools.handleToolCall('safe_get_info', invalidQuery);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Network eip155:999 is not supported');
        });
        it('should require address parameter', async () => {
            const incompleteQuery = {
                networkId: 'eip155:1'
                // Missing address
            };
            const result = await queryTools.handleToolCall('safe_get_info', incompleteQuery);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Required field missing: address');
        });
        it('should require networkId parameter', async () => {
            const incompleteQuery = {
                address: '0x1234567890123456789012345678901234567890'
                // Missing networkId
            };
            const result = await queryTools.handleToolCall('safe_get_info', incompleteQuery);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Required field missing: networkId');
        });
        it('should handle network-specific queries', async () => {
            const polygonQuery = {
                address: '0x1234567890123456789012345678901234567890',
                networkId: 'eip155:137'
            };
            const result = await queryTools.handleToolCall('safe_get_info', polygonQuery);
            expect(result.isError).toBe(false);
            const safeInfo = JSON.parse(result.content[0]?.text);
            expect(safeInfo.networkId).toBe('eip155:137');
            expect(safeInfo.address).toBe(polygonQuery.address);
        });
        it('should return consistent data for same address and network', async () => {
            const query = {
                address: '0x1234567890123456789012345678901234567890',
                networkId: 'eip155:1'
            };
            const result1 = await queryTools.handleToolCall('safe_get_info', query);
            const result2 = await queryTools.handleToolCall('safe_get_info', query);
            expect(result1.isError).toBe(false);
            expect(result2.isError).toBe(false);
            const safeInfo1 = JSON.parse(result1.content[0]?.text);
            const safeInfo2 = JSON.parse(result2.content[0]?.text);
            expect(safeInfo1).toEqual(safeInfo2);
        });
        it('should return different data for different addresses', async () => {
            const query1 = {
                address: '0x1234567890123456789012345678901234567890',
                networkId: 'eip155:1'
            };
            const query2 = {
                address: '0x2345678901234567890123456789012345678901',
                networkId: 'eip155:1'
            };
            const result1 = await queryTools.handleToolCall('safe_get_info', query1);
            const result2 = await queryTools.handleToolCall('safe_get_info', query2);
            expect(result1.isError).toBe(false);
            expect(result2.isError).toBe(false);
            const safeInfo1 = JSON.parse(result1.content[0]?.text);
            const safeInfo2 = JSON.parse(result2.content[0]?.text);
            expect(safeInfo1.address).not.toBe(safeInfo2.address);
            expect(safeInfo1.owners).not.toEqual(safeInfo2.owners);
        });
        it('should return proper tool schema', () => {
            const tools = queryTools.getTools();
            const infoTool = tools.find(tool => tool.name === 'safe_get_info');
            expect(infoTool?.inputSchema).toBeDefined();
            expect(infoTool?.inputSchema.type).toBe('object');
            expect(infoTool?.inputSchema.properties).toHaveProperty('address');
            expect(infoTool?.inputSchema.properties).toHaveProperty('networkId');
            expect(infoTool?.inputSchema.required).toContain('address');
            expect(infoTool?.inputSchema.required).toContain('networkId');
        });
    });
    describe('MCP Tool Interface', () => {
        it('should implement proper MCP tool registration', () => {
            const tools = queryTools.getTools();
            expect(Array.isArray(tools)).toBe(true);
            expect(tools.length).toBeGreaterThan(0);
            tools.forEach(tool => {
                expect(tool.name).toBeDefined();
                expect(tool.description).toBeDefined();
                expect(tool.inputSchema).toBeDefined();
            });
        });
        it('should handle unknown tool names', async () => {
            const result = await queryTools.handleToolCall('unknown_tool', {});
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Unknown tool');
        });
        it('should handle tool execution errors gracefully', async () => {
            // Pass malformed data to trigger error handling
            const result = await queryTools.handleToolCall('safe_get_info', null);
            expect(result.isError).toBe(true);
            expect(result.content[0]?.text).toContain('Invalid input');
        });
    });
});
