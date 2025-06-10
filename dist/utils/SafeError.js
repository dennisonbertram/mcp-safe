/**
 * Structured error class for Safe MCP Server operations
 */
export class SafeError extends Error {
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.name = 'SafeError';
        this.code = code;
        this.details = details;
        // Ensure proper prototype chain for instanceof checks
        Object.setPrototypeOf(this, SafeError.prototype);
    }
    /**
     * Convert error to JSON for MCP response
     */
    toJSON() {
        const result = {
            error: {
                code: this.code,
                message: this.message,
            },
        };
        if (this.details !== undefined) {
            result.error.details = this.details;
        }
        return result;
    }
}
// Common error codes
export const ErrorCodes = {
    NETWORK_ERROR: 'NETWORK_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    SAFE_OPERATION_ERROR: 'SAFE_OPERATION_ERROR',
    CONFIGURATION_ERROR: 'CONFIGURATION_ERROR',
    TOOL_NOT_FOUND: 'TOOL_NOT_FOUND',
    PERMISSION_DENIED: 'PERMISSION_DENIED',
    INVALID_INPUT: 'INVALID_INPUT',
    INVALID_ADDRESS: 'INVALID_ADDRESS',
    NETWORK_NOT_SUPPORTED: 'NETWORK_NOT_SUPPORTED',
};
