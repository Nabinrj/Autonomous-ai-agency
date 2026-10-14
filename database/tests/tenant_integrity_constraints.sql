-- Negative integration tests for tenant-bound foreign keys.
-- Each invalid write must raise a foreign_key_violation. The surrounding
-- transaction is rolled back so the test leaves no data behind.
BEGIN;

INSERT INTO organizations (id, name) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Tenant One'),
  ('00000000-0000-0000-0000-000000000102', 'Tenant Two');

INSERT INTO users (id, organization_id, email, display_name) VALUES
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', 'one@example.test', 'Tenant One User'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', 'two@example.test', 'Tenant Two User');

INSERT INTO customers (id, organization_id, name) VALUES
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101', 'Customer One'),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102', 'Customer Two');

INSERT INTO requirements (id, organization_id, customer_id) VALUES
  ('00000000-0000-0000-0000-000000000501', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000502', '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000302');

INSERT INTO requirement_versions (id, requirement_id, version_number, content) VALUES
  ('00000000-0000-0000-0000-000000000601', '00000000-0000-0000-0000-000000000501', 1, '{"title":"Tenant One Requirements"}'),
  ('00000000-0000-0000-0000-000000000602', '00000000-0000-0000-0000-000000000502', 1, '{"title":"Tenant Two Requirements"}');

INSERT INTO projects (id, organization_id, customer_id, requirement_id, name) VALUES
  ('00000000-0000-0000-0000-000000000701', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000501', 'Project One'),
  ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000501', 'Project Two');

INSERT INTO project_tasks (id, project_id, title) VALUES
  ('00000000-0000-0000-0000-000000000801', '00000000-0000-0000-0000-000000000701', 'Parent in Project One');

DO $$
BEGIN
  BEGIN
    INSERT INTO leads (organization_id, customer_id, source)
    VALUES ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000302', 'security-test');
    RAISE EXCEPTION 'Cross-tenant lead/customer reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  BEGIN
    UPDATE requirements
    SET approved_version_id = '00000000-0000-0000-0000-000000000602'
    WHERE id = '00000000-0000-0000-0000-000000000501';
    RAISE EXCEPTION 'Requirement accepted another requirement''s version';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO projects (organization_id, customer_id, requirement_id, name)
    VALUES ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000501', 'Invalid Cross-Tenant Project');
    RAISE EXCEPTION 'Cross-tenant project/customer reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO project_tasks (project_id, parent_task_id, title)
    VALUES ('00000000-0000-0000-0000-000000000702', '00000000-0000-0000-0000-000000000801', 'Invalid Cross-Project Child');
    RAISE EXCEPTION 'Cross-project parent task reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;

  BEGIN
    INSERT INTO audit_logs (organization_id, actor_type, actor_id, action)
    VALUES ('00000000-0000-0000-0000-000000000101', 'USER', '00000000-0000-0000-0000-000000000202', 'security-test');
    RAISE EXCEPTION 'Cross-tenant audit actor reference was accepted';
  EXCEPTION WHEN foreign_key_violation THEN
    NULL;
  END;
END $$;

ROLLBACK;
