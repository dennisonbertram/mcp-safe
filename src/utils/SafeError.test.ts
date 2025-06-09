import { describe, it, expect } from '@jest/globals';
import { SafeError, ErrorCodes } from './SafeError';

describe('SafeError', () => {
  it('should create error with message and code', () => {
    const error = new SafeError('Test error', ErrorCodes.NETWORK_ERROR);

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(SafeError);
    expect(error.message).toBe('Test error');
    expect(error.code).toBe(ErrorCodes.NETWORK_ERROR);
    expect(error.name).toBe('SafeError');
  });

  it('should create error with details', () => {
    const details = { network: 'eip155:1', address: '0x123' };
    const error = new SafeError(
      'Network failed',
      ErrorCodes.NETWORK_ERROR,
      details
    );

    expect(error.details).toEqual(details);
  });

  it('should convert to JSON format', () => {
    const error = new SafeError(
      'Validation failed',
      ErrorCodes.VALIDATION_ERROR,
      { field: 'address' }
    );

    const json = error.toJSON();
    expect(json).toEqual({
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: { field: 'address' },
      },
    });
  });

  it('should have all required error codes', () => {
    expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR');
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCodes.SAFE_OPERATION_ERROR).toBe('SAFE_OPERATION_ERROR');
    expect(ErrorCodes.CONFIGURATION_ERROR).toBe('CONFIGURATION_ERROR');
    expect(ErrorCodes.TOOL_NOT_FOUND).toBe('TOOL_NOT_FOUND');
    expect(ErrorCodes.PERMISSION_DENIED).toBe('PERMISSION_DENIED');
  });
});
