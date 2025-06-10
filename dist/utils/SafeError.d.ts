/**
 * Structured error class for Safe MCP Server operations
 */
export declare class SafeError extends Error {
    readonly code: string;
    readonly details: Record<string, unknown> | undefined;
    constructor(message: string, code: string, details?: Record<string, unknown>);
    /**
     * Convert error to JSON for MCP response
     */
    toJSON(): {
        error: {
            code: string;
            message: string;
            details?: Record<string, unknown>;
        };
    };
}
export declare const ErrorCodes: {
    readonly NETWORK_ERROR: "NETWORK_ERROR";
    readonly VALIDATION_ERROR: "VALIDATION_ERROR";
    readonly SAFE_OPERATION_ERROR: "SAFE_OPERATION_ERROR";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly TOOL_NOT_FOUND: "TOOL_NOT_FOUND";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly INVALID_ADDRESS: "INVALID_ADDRESS";
    readonly NETWORK_NOT_SUPPORTED: "NETWORK_NOT_SUPPORTED";
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
