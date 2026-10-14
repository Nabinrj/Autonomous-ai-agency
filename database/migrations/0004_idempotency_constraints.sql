-- Make idempotency records self-consistent even if a future code path bypasses the service.
BEGIN;

ALTER TABLE idempotency_keys
  ADD CONSTRAINT ck_idempotency_operation_key_format
    CHECK (operation_key ~ '^[A-Za-z0-9._:-]{8,200}$'),
  ADD CONSTRAINT ck_idempotency_request_hash_format
    CHECK (request_hash ~ '^[a-f0-9]{64}$'),
  ADD CONSTRAINT ck_idempotency_response_status_range
    CHECK (response_status IS NULL OR response_status BETWEEN 200 AND 599),
  ADD CONSTRAINT ck_idempotency_response_pair
    CHECK ((response_status IS NULL) = (response_body IS NULL));

CREATE INDEX idx_idempotency_keys_created_at
  ON idempotency_keys (created_at);

COMMIT;
