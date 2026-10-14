-- Enforce tenant boundaries at the database layer, not only in application queries.
-- This migration intentionally fails if existing rows contain cross-organization
-- references; repair those rows before deploying rather than weakening the constraints.
BEGIN;

ALTER TABLE users ADD CONSTRAINT uq_users_id_organization UNIQUE (id, organization_id);
ALTER TABLE customers ADD CONSTRAINT uq_customers_id_organization UNIQUE (id, organization_id);
ALTER TABLE leads ADD CONSTRAINT uq_leads_id_organization UNIQUE (id, organization_id);
ALTER TABLE requirements ADD CONSTRAINT uq_requirements_id_organization UNIQUE (id, organization_id);
ALTER TABLE projects ADD CONSTRAINT uq_projects_id_organization UNIQUE (id, organization_id);
ALTER TABLE workflow_runs ADD CONSTRAINT uq_workflow_runs_id_organization UNIQUE (id, organization_id);
ALTER TABLE documents ADD CONSTRAINT uq_documents_id_organization UNIQUE (id, organization_id);
ALTER TABLE requirement_versions ADD CONSTRAINT uq_requirement_versions_id_requirement UNIQUE (id, requirement_id);
ALTER TABLE project_tasks ADD CONSTRAINT uq_project_tasks_id_project UNIQUE (id, project_id);

ALTER TABLE leads
  ADD CONSTRAINT fk_leads_customer_same_organization
  FOREIGN KEY (customer_id, organization_id)
  REFERENCES customers (id, organization_id);

ALTER TABLE conversations
  ADD CONSTRAINT fk_conversations_customer_same_organization
  FOREIGN KEY (customer_id, organization_id)
  REFERENCES customers (id, organization_id),
  ADD CONSTRAINT fk_conversations_lead_same_organization
  FOREIGN KEY (lead_id, organization_id)
  REFERENCES leads (id, organization_id);

ALTER TABLE requirements
  ADD CONSTRAINT fk_requirements_customer_same_organization
  FOREIGN KEY (customer_id, organization_id)
  REFERENCES customers (id, organization_id),
  ADD CONSTRAINT fk_requirements_approved_version_same_requirement
  FOREIGN KEY (approved_version_id, id)
  REFERENCES requirement_versions (id, requirement_id);

ALTER TABLE projects
  ADD CONSTRAINT fk_projects_customer_same_organization
  FOREIGN KEY (customer_id, organization_id)
  REFERENCES customers (id, organization_id),
  ADD CONSTRAINT fk_projects_requirement_same_organization
  FOREIGN KEY (requirement_id, organization_id)
  REFERENCES requirements (id, organization_id),
  ADD CONSTRAINT fk_projects_approved_version_same_requirement
  FOREIGN KEY (approved_requirement_version_id, requirement_id)
  REFERENCES requirement_versions (id, requirement_id);

ALTER TABLE approvals
  ADD CONSTRAINT fk_approvals_project_same_organization
  FOREIGN KEY (project_id, organization_id)
  REFERENCES projects (id, organization_id),
  ADD CONSTRAINT fk_approvals_requirement_same_organization
  FOREIGN KEY (requirement_id, organization_id)
  REFERENCES requirements (id, organization_id),
  ADD CONSTRAINT fk_approvals_decider_same_organization
  FOREIGN KEY (decided_by, organization_id)
  REFERENCES users (id, organization_id);

ALTER TABLE documents
  ADD CONSTRAINT fk_documents_project_same_organization
  FOREIGN KEY (project_id, organization_id)
  REFERENCES projects (id, organization_id),
  ADD CONSTRAINT fk_documents_requirement_same_organization
  FOREIGN KEY (requirement_id, organization_id)
  REFERENCES requirements (id, organization_id);

ALTER TABLE artifacts
  ADD CONSTRAINT fk_artifacts_project_same_organization
  FOREIGN KEY (project_id, organization_id)
  REFERENCES projects (id, organization_id),
  ADD CONSTRAINT fk_artifacts_workflow_same_organization
  FOREIGN KEY (workflow_run_id, organization_id)
  REFERENCES workflow_runs (id, organization_id),
  ADD CONSTRAINT fk_artifacts_document_same_organization
  FOREIGN KEY (document_id, organization_id)
  REFERENCES documents (id, organization_id);

ALTER TABLE notifications
  ADD CONSTRAINT fk_notifications_project_same_organization
  FOREIGN KEY (project_id, organization_id)
  REFERENCES projects (id, organization_id);

ALTER TABLE model_runs
  ADD CONSTRAINT fk_model_runs_workflow_same_organization
  FOREIGN KEY (workflow_run_id, organization_id)
  REFERENCES workflow_runs (id, organization_id);

ALTER TABLE audit_logs
  ADD CONSTRAINT fk_audit_actor_same_organization
  FOREIGN KEY (actor_id, organization_id)
  REFERENCES users (id, organization_id);

ALTER TABLE project_tasks
  ADD CONSTRAINT fk_project_tasks_parent_same_project
  FOREIGN KEY (parent_task_id, project_id)
  REFERENCES project_tasks (id, project_id);

COMMIT;
