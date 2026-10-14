-- Link local application users to stable OIDC subject identifiers.
-- User roles and permissions remain authoritative in this database.
BEGIN;

ALTER TABLE users
  ADD COLUMN identity_provider TEXT,
  ADD COLUMN auth_subject TEXT,
  ADD CONSTRAINT ck_users_oidc_identity_pair CHECK ((identity_provider IS NULL) = (auth_subject IS NULL));

CREATE UNIQUE INDEX uq_users_identity_provider_subject
  ON users (identity_provider, auth_subject)
  WHERE identity_provider IS NOT NULL AND auth_subject IS NOT NULL;

INSERT INTO roles (code, name, description) VALUES
  ('OWNER', 'Owner', 'Organization owner with all configured permissions'),
  ('ADMIN', 'Administrator', 'Organization administrator'),
  ('OPERATOR', 'Operator', 'Runs agency operations'),
  ('REVIEWER', 'Reviewer', 'Reviews requirements, approvals, and audit history'),
  ('CUSTOMER', 'Customer', 'Restricted customer-facing access'),
  ('SYSTEM', 'System', 'Service identity for controlled background operations')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
  ('customer.read', 'Read customers'),
  ('customer.write', 'Create and update customers'),
  ('lead.read', 'Read leads'),
  ('lead.write', 'Create and qualify leads'),
  ('requirements.read', 'Read requirements'),
  ('requirements.write', 'Create and update requirements'),
  ('requirements.approve', 'Approve requirement versions'),
  ('project.read', 'Read projects and tasks'),
  ('project.write', 'Create and update projects and tasks'),
  ('project.approve', 'Approve project-related actions'),
  ('workflow.read', 'Read workflow runs and steps'),
  ('workflow.execute', 'Create and transition workflows'),
  ('audit.read', 'Read audit events')
ON CONFLICT (code) DO NOTHING;

-- OWNER receives explicit permission rows. Runtime authorization does not rely
-- on untrusted token claims to construct permissions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permissions p
WHERE r.code = 'OWNER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'customer.read', 'customer.write', 'lead.read', 'lead.write',
  'requirements.read', 'requirements.write', 'requirements.approve',
  'project.read', 'project.write', 'project.approve',
  'workflow.read', 'workflow.execute', 'audit.read'
)
WHERE r.code = 'ADMIN'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'customer.read', 'customer.write', 'lead.read', 'lead.write',
  'requirements.read', 'requirements.write',
  'project.read', 'project.write', 'workflow.read', 'workflow.execute'
)
WHERE r.code = 'OPERATOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
  'customer.read', 'lead.read', 'requirements.read', 'requirements.approve',
  'project.read', 'project.approve', 'workflow.read', 'audit.read'
)
WHERE r.code = 'REVIEWER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('customer.read', 'project.read')
WHERE r.code = 'CUSTOMER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN ('workflow.read', 'workflow.execute', 'audit.read')
WHERE r.code = 'SYSTEM'
ON CONFLICT DO NOTHING;

COMMIT;
