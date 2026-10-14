import test from 'node:test';
import assert from 'node:assert/strict';
import { ZodError, z } from 'zod';
import { AppError } from '../src/common/errors/app-error.js';
import { toHttpError } from '../src/common/errors/http-error.js';

test('Zod validation errors become safe 400 responses', () => {
  let error: ZodError | undefined;
  try {
    z.object({ name: z.string() }).parse({ name: 123 });
  } catch (caught) {
    if (caught instanceof ZodError) error = caught;
  }

  assert.ok(error);
  assert.deepEqual(toHttpError(error), {
    statusCode: 400,
    code: 'VALIDATION_ERROR',
    message: 'Request validation failed.',
  });
});

test('application errors retain intentional status and public message', () => {
  assert.deepEqual(toHttpError(new AppError('NOT_FOUND', 404, 'Customer not found')), {
    statusCode: 404,
    code: 'NOT_FOUND',
    message: 'Customer not found',
  });
});

test('unknown errors never expose internal messages', () => {
  assert.deepEqual(toHttpError(new Error('password=secret; SQL connection failed')), {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred.',
  });
});

test('framework 4xx errors keep their status without reflecting their message', () => {
  assert.deepEqual(toHttpError({ statusCode: 413, message: 'request body contains secret input' }), {
    statusCode: 413,
    code: 'REQUEST_ERROR',
    message: 'The request could not be processed.',
  });
});
