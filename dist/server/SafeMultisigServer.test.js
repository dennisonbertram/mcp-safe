import { describe, it, expect, beforeEach } from '@jest/globals';
import { SafeMultisigServer } from './SafeMultisigServer';
import { SafeError, ErrorCodes } from '../utils/SafeError';
describe('SafeMultisigServer', () => {
    let server;
    beforeEach(() => {
        // Create server without auto-initializing tools for test isolation
        server = new SafeMultisigServer(false);
    });
    it('should create server instance', () => {
        expect(server).toBeDefined();
        expect(server).toBeInstanceOf(SafeMultisigServer);
    });
    it('should have connect method', () => {
        expect(typeof server.connect).toBe('function');
    });
    it('should support tool registration', () => {
        expect(typeof server.registerTool).toBe('function');
        const mockTool = {
            name: 'test_tool',
            description: 'Test tool',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        };
        const mockHandler = async () => ({
            content: [{ type: 'text', text: 'test result' }],
        });
        // Should not throw
        server.registerTool(mockTool, mockHandler);
    });
    it('should support dynamic tool management', () => {
        expect(typeof server.enableTool).toBe('function');
        expect(typeof server.disableTool).toBe('function');
        const mockTool = {
            name: 'test_tool',
            description: 'Test tool',
            inputSchema: {
                type: 'object',
                properties: {},
            },
        };
        const mockHandler = async () => ({
            content: [{ type: 'text', text: 'test result' }],
        });
        server.registerTool(mockTool, mockHandler);
        // Tool should be enabled by default after registration
        expect(server.getAvailableTools()).toHaveLength(1);
        // Disable tool
        expect(server.disableTool('test_tool')).toBe(true);
        expect(server.getAvailableTools()).toHaveLength(0);
        // Enable tool
        expect(server.enableTool('test_tool')).toBe(true);
        expect(server.getAvailableTools()).toHaveLength(1);
    });
    it('should have error handling capabilities', () => {
        expect(typeof server.handleError).toBe('function');
        const error = new SafeError('Test error', ErrorCodes.NETWORK_ERROR);
        const result = server.handleError(error);
        expect(result.isError).toBe(true);
        expect(result.content).toHaveLength(1);
        expect(result.content[0]?.type).toBe('text');
    });
    it('should get available tools list', () => {
        expect(typeof server.getAvailableTools).toBe('function');
        expect(server.getAvailableTools()).toEqual([]);
    });
    describe('Production mode', () => {
        it('should auto-initialize all MCP tools when autoInitialize is true', () => {
            const productionServer = new SafeMultisigServer(true);
            const tools = productionServer.getAvailableTools();
            // Should have all the MCP tools registered
            expect(tools.length).toBeGreaterThan(0);
            // Check for specific expected tools
            const toolNames = tools.map(t => t.name);
            expect(toolNames).toContain('safe_create_wallet_config');
            expect(toolNames).toContain('safe_predict_address');
            expect(toolNames).toContain('safe_deploy_wallet');
            expect(toolNames).toContain('safe_get_info');
            expect(toolNames).toContain('safe_propose_transaction');
            expect(toolNames).toContain('safe_execute_transaction');
            expect(toolNames).toContain('safe_add_owner');
            expect(toolNames).toContain('safe_remove_owner');
            expect(toolNames).toContain('safe_change_threshold');
            expect(toolNames).toContain('safe_deploy_infrastructure');
        });
        it('should default to auto-initialization when no parameter provided', () => {
            const defaultServer = new SafeMultisigServer();
            const tools = defaultServer.getAvailableTools();
            // Should have tools registered by default
            expect(tools.length).toBeGreaterThan(0);
        });
    });
    describe('MCP Protocol Compliance', () => {
        it('should properly manage tool lifecycle', () => {
            // Start with empty server
            const mcpServer = new SafeMultisigServer(false);
            expect(mcpServer.getAvailableTools()).toHaveLength(0);
            // Register first tool
            const tool1 = {
                name: 'mcp_tool_1',
                description: 'First MCP tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        input: { type: 'string' }
                    },
                    required: ['input']
                },
            };
            const handler1 = async (args) => ({
                content: [{ type: 'text', text: `Tool 1: ${args.input}` }],
            });
            mcpServer.registerTool(tool1, handler1);
            expect(mcpServer.getAvailableTools()).toHaveLength(1);
            expect(mcpServer.getAvailableTools()[0]?.name).toBe('mcp_tool_1');
            // Register second tool
            const tool2 = {
                name: 'mcp_tool_2',
                description: 'Second MCP tool',
                inputSchema: {
                    type: 'object',
                    properties: {
                        value: { type: 'number' }
                    },
                    required: ['value']
                },
            };
            const handler2 = async (args) => ({
                content: [{ type: 'text', text: `Tool 2: ${args.value}` }],
            });
            mcpServer.registerTool(tool2, handler2);
            expect(mcpServer.getAvailableTools()).toHaveLength(2);
            // Disable first tool
            mcpServer.disableTool('mcp_tool_1');
            expect(mcpServer.getAvailableTools()).toHaveLength(1);
            expect(mcpServer.getAvailableTools()[0]?.name).toBe('mcp_tool_2');
            // Re-enable first tool
            mcpServer.enableTool('mcp_tool_1');
            expect(mcpServer.getAvailableTools()).toHaveLength(2);
            // Verify both tools are present and in correct state
            const finalTools = mcpServer.getAvailableTools();
            const toolNames = finalTools.map(t => t.name);
            expect(toolNames).toContain('mcp_tool_1');
            expect(toolNames).toContain('mcp_tool_2');
        });
        it('should not enable non-existent tools', () => {
            const mcpServer = new SafeMultisigServer(false);
            // Try to enable a tool that doesn't exist
            const result = mcpServer.enableTool('non_existent_tool');
            expect(result).toBe(false);
            expect(mcpServer.getAvailableTools()).toHaveLength(0);
        });
        it('should not disable non-existent tools', () => {
            const mcpServer = new SafeMultisigServer(false);
            // Try to disable a tool that doesn't exist
            const result = mcpServer.disableTool('non_existent_tool');
            expect(result).toBe(false);
            expect(mcpServer.getAvailableTools()).toHaveLength(0);
        });
    });
});
