import { ZodError } from 'zod';
import { AppError } from './app-error.js';

export interface SafeHttpError {
  statusCode: number;
  code: string;
  message: string;
}

/**
 * Converts thrown values into a deliberately small public error contract.
 * Validation failures are client errors; unknown exceptions never expose their
 * message, stack, SQL text, or provider response to API consumers.
 */
export function toHttpError(error: unknown): SafeHttpError {
  if (error instanceof ZodError) {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
    };
  }

  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
    };
  }

  const candidate = typeof error === 'object' && error !== null
    ? error as { statusCode?: unknown }
    : undefined;

  // Preserve framework-generated 4xx status codes, but do not echo arbitrary
  // framework/parser messages which may contain untrusted request fragments.
  if (typeof candidate?.statusCode === 'number'
    && Number.isInteger(candidate.statusCode)
    && candidate.statusCode >= 400
    && candidate.statusCode < 500) {
    return {
      statusCode: candidate.statusCode,
      code: 'REQUEST_ERROR',
      message: 'The request could not be processed.',
    };
  }

  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  };
}
