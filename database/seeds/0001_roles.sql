INSERT INTO roles (code, name, description) VALUES
    ('OWNER', 'Owner', 'Full agency ownership and approval authority'),
    ('ADMIN', 'Administrator', 'Administrative management access'),
    ('OPERATOR', 'Operator', 'Day-to-day workflow operations'),
    ('REVIEWER', 'Reviewer', 'Review and approval access'),
    ('CUSTOMER', 'Customer', 'Customer-scoped access'),
    ('SYSTEM', 'System', 'Internal service identity')
ON CONFLICT (code) DO NOTHING;

INSERT INTO permissions (code, description) VALUES
    ('customer.read', 'Read customer records'),
    ('customer.write', 'Create and update customer records'),
    ('lead.read', 'Read leads'),
    ('lead.write', 'Create and update leads'),
    ('requirements.read', 'Read requirements'),
    ('requirements.write', 'Create and update requirements'),
    ('requirements.approve', 'Approve requirements'),
    ('project.read', 'Read projects'),
    ('project.write', 'Create and update projects'),
    ('project.approve', 'Approve project actions'),
    ('workflow.read', 'Read workflow runs'),
    ('workflow.execute', 'Start or control workflows'),
    ('audit.read', 'Read audit records')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code IN ('OWNER', 'ADMIN');

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'customer.read', 'customer.write',
    'lead.read', 'lead.write',
    'requirements.read', 'requirements.write',
    'project.read', 'project.write',
    'workflow.read', 'workflow.execute'
)
WHERE r.code = 'OPERATOR'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'customer.read', 'lead.read', 'requirements.read', 'requirements.approve',
    'project.read', 'project.approve', 'workflow.read'
)
WHERE r.code = 'REVIEWER'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.code IN (
    'customer.read', 'requirements.read', 'project.read', 'workflow.read'
)
WHERE r.code = 'CUSTOMER'
ON CONFLICT DO NOTHING;
