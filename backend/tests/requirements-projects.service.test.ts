import assert from 'node:assert/strict';
import test from 'node:test';
import { RequirementService } from '../src/modules/requirements/requirement.service.js';
import type { Requirement, RequirementRepository, RequirementVersion } from '../src/modules/requirements/requirement.types.js';
import { ProjectService } from '../src/modules/projects/project.service.js';
import type { Project, ProjectRepository } from '../src/modules/projects/project.types.js';

const org = '00000000-0000-0000-0000-000000000001';
const reqId = '00000000-0000-0000-0000-000000000002';
const versionId = '00000000-0000-0000-0000-000000000003';

class RequirementsMemory implements RequirementRepository {
  requirement: Requirement = { id: reqId, organizationId: org, customerId: '00000000-0000-0000-0000-000000000004', status: 'READY_FOR_REVIEW', approvedVersionId: null };
  version: RequirementVersion = { id: versionId, requirementId: reqId, versionNumber: 1, content: { name: 'Demo' }, completenessScore: 100 };
  async findById() { return this.requirement; }
  async getVersion() { return this.version; }
  async updateStatus(_o: string, _i: string, status: Requirement['status'], approvedVersionId?: string) { this.requirement = { ...this.requirement, status, approvedVersionId: approvedVersionId ?? this.requirement.approvedVersionId }; return this.requirement; }
}

test('requirement approval records the selected version', async () => {
  const repo = new RequirementsMemory();
  const result = await new RequirementService(repo).approve(org, reqId, versionId);
  assert.equal(result.status, 'APPROVED');
  assert.equal(result.approvedVersionId, versionId);
});

class ProjectsMemory implements ProjectRepository {
  project: Project = { id: reqId, organizationId: org, customerId: '00000000-0000-0000-0000-000000000004', requirementId: versionId, approvedRequirementVersionId: null, name: 'Demo', status: 'APPROVED' };
  async findById() { return this.project; }
  async updateStatus(_o: string, _i: string, status: Project['status']) { this.project = { ...this.project, status }; return this.project; }
}

test('project cannot enter planning without approved requirements', async () => {
  const repo = new ProjectsMemory();
  await assert.rejects(() => new ProjectService(repo).transition(org, reqId, 'PLANNING'), /approved requirement version/);
});
