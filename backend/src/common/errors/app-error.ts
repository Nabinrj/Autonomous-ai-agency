export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly statusCode: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const notFound = (resource: string) =>
  new AppError('NOT_FOUND', 404, `${resource} not found`);

export const conflict = (message: string, details?: unknown) =>
  new AppError('CONFLICT', 409, message, details);

export const forbidden = (message = 'Forbidden') =>
  new AppError('FORBIDDEN', 403, message);

export const unauthorized = (message = 'Authentication required') =>
  new AppError('UNAUTHORIZED', 401, message);

export const validationError = (message: string, details?: unknown) =>
  new AppError('VALIDATION_ERROR', 400, message, details);
