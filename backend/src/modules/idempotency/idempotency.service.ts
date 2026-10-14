import { createHash } from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { conflict, validationError } from '../../common/errors/app-error.js';

export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export interface IdempotentResponse<T extends JsonValue = JsonValue> {
  statusCode: number;
  body: T;
}

export interface IdempotencyResult<T extends JsonValue = JsonValue> extends IdempotentResponse<T> {
  replayed: boolean;
}

function canonicalize(value: JsonValue): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const object = value as Record<string, JsonValue>;
  return `{${Object.keys(object).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(object[key]!)}`).join(',')}}`;
}

export function hashIdempotencyRequest(value: JsonValue): string {
  return createHash('sha256').update(canonicalize(value)).digest('hex');
}

/**
 * Executes a database-only operation once per organization/key and persists its response.
 * The callback must use the supplied transaction client for all database writes.
 * Do not perform external network calls inside the callback: PostgreSQL cannot roll those back.
 */
export class IdempotencyService {
  constructor(private readonly pool: Pool) {}

  async execute<T extends JsonValue>(
    organizationId: string,
    key: string,
    request: JsonValue,
    operation: (transaction: PoolClient) => Promise<IdempotentResponse<T>>,
  ): Promise<IdempotencyResult<T>> {
    if (!organizationId) throw validationError('Organization ID is required.');
    if (!/^[A-Za-z0-9._:-]{8,200}$/.test(key)) {
      throw validationError('Idempotency-Key must be 8–200 safe characters.');
    }

    const requestHash = hashIdempotencyRequest(request);
    const client = await this.pool.connect();
    let transactionOpen = false;

    try {
      await client.query('BEGIN');
      transactionOpen = true;

      const reserved = await client.query<{ id: string }>(
        `INSERT INTO idempotency_keys (organization_id, operation_key, request_hash)
         VALUES ($1, $2, $3)
         ON CONFLICT (organization_id, operation_key) DO NOTHING
         RETURNING id`,
        [organizationId, key, requestHash],
      );

      if (reserved.rows[0]) {
        const response = await operation(client);
        if (!Number.isInteger(response.statusCode) || response.statusCode < 200 || response.statusCode > 599) {
          throw new Error('Idempotent operation returned an invalid HTTP status code.');
        }
        const encoded = JSON.stringify(response.body);
        if (encoded === undefined) throw new Error('Idempotent operation returned a non-JSON response.');
        await client.query(
          `UPDATE idempotency_keys
           SET response_status = $3, response_body = $4::jsonb
           WHERE organization_id = $1 AND operation_key = $2`,
          [organizationId, key, response.statusCode, encoded],
        );
        await client.query('COMMIT');
        transactionOpen = false;
        return { ...response, replayed: false };
      }

      const existing = await client.query<{
        request_hash: string;
        response_status: number | null;
        response_body: T | null;
      }>(
        `SELECT request_hash, response_status, response_body
         FROM idempotency_keys
         WHERE organization_id = $1 AND operation_key = $2
         FOR UPDATE`,
        [organizationId, key],
      );
      const row = existing.rows[0];
      if (!row) throw conflict('Idempotency reservation could not be resolved.');
      if (row.request_hash !== requestHash) {
        throw conflict('This Idempotency-Key was already used with a different request.');
      }
      if (row.response_status === null) {
        throw conflict('The original operation has no completed response; retry with a new key after investigation.');
      }

      await client.query('COMMIT');
      transactionOpen = false;
      return { statusCode: row.response_status, body: row.response_body, replayed: true };
    } catch (error) {
      if (transactionOpen) {
        try { await client.query('ROLLBACK'); } catch { /* Preserve the original error. */ }
      }
      throw error;
    } finally {
      client.release();
    }
  }
}
