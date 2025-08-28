import { ProviderFactory } from '../../blockchain/ProviderFactory.js';
import { SafeError } from '../../utils/SafeError.js';
export class WalletQueryTools {
    contractRegistry;
    providerFactory;
    constructor(contractRegistry) {
        this.contractRegistry = contractRegistry;
        this.providerFactory = new ProviderFactory();
    }
    getTools() {
        return [
            {
                name: 'safe_get_info',
                description: 'Get comprehensive information about a Safe wallet including owners, threshold, balance, modules, and deployment status.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        address: {
                            type: 'string',
                            description: 'Safe wallet address (must be a valid checksummed Ethereum address)',
                            pattern: '^0x[a-fA-F0-9]{40}$',
                        },
                        networkId: {
                            type: 'string',
                            description: 'CAIP-2 network identifier (e.g., eip155:1 for Ethereum mainnet)',
                            pattern: '^eip155:\\d+$',
                        },
                    },
                    required: ['address', 'networkId'],
                },
            },
        ];
    }
    async handleToolCall(name, arguments_) {
        try {
            switch (name) {
                case 'safe_get_info':
                    return await this.handleGetSafeInfo(arguments_);
                default:
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Unknown tool: ${name}`,
                            },
                        ],
                    };
            }
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: `Tool execution error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async handleGetSafeInfo(arguments_) {
        try {
            // Validate input
            if (!arguments_ || typeof arguments_ !== 'object') {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: 'Invalid input: query configuration object is required',
                        },
                    ],
                };
            }
            const input = arguments_;
            // Validate required fields
            if (!input.address) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: 'Required field missing: address',
                        },
                    ],
                };
            }
            if (!input.networkId) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: 'Required field missing: networkId',
                        },
                    ],
                };
            }
            // Validate address format
            if (!this.contractRegistry.validateSafeAddress(input.address)) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: 'Invalid Safe address format',
                        },
                    ],
                };
            }
            // Validate network support
            if (!this.contractRegistry.isNetworkSupported(input.networkId)) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Network ${input.networkId} is not supported`,
                        },
                    ],
                };
            }
            // Get Safe information using Safe SDK
            const safeInfo = await this.getSafeInfo(input.address, input.networkId);
            return {
                isError: false,
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(safeInfo, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [
                    {
                        type: 'text',
                        text: `Safe info query error: ${error instanceof Error ? error.message : String(error)}`,
                    },
                ],
            };
        }
    }
    async getSafeInfo(address, networkId) {
        const provider = await this.providerFactory.getProvider(networkId);
        const code = await provider.getCode(address);
        if (code === '0x') {
            throw new SafeError(`Safe at address ${address} is not deployed on network ${networkId}`, 'SAFE_NOT_FOUND');
        }
        const safe = await this.providerFactory.getSafe(address, networkId);
        const [owners, threshold, nonce, version] = await Promise.all([
            safe.getOwners(),
            safe.getThreshold(),
            safe.getNonce(),
            safe.getContractVersion(),
        ]);
        const balanceWei = await provider.getBalance(address);
        const balance = typeof balanceWei === 'string' ? balanceWei : balanceWei.toString();
        return {
            address,
            owners,
            threshold,
            nonce,
            version,
            isDeployed: true,
            networkId,
            balance,
            modules: [],
            guard: undefined,
            fallbackHandler: undefined,
        };
    }
}
