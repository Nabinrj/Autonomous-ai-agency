import test from 'node:test';
import assert from 'node:assert/strict';
import { ProjectTaskService } from '../src/modules/projects/project-task.service.js';
import type { ProjectTask, ProjectTaskRepository } from '../src/modules/projects/project-task.types.js';

class MemoryTasks implements ProjectTaskRepository {
  private readonly items = new Map<string, ProjectTask>();
  async create(_organizationId: string, input: { projectId: string; parentTaskId?: string; title: string; description?: string; assignedTo?: string; sortOrder?: number }) {
    const task: ProjectTask = { id: crypto.randomUUID(), projectId: input.projectId, parentTaskId: input.parentTaskId ?? null, title: input.title, description: input.description ?? null, status: 'TODO', assignedTo: input.assignedTo ?? null, sortOrder: input.sortOrder ?? 0 };
    this.items.set(task.id, task); return task;
  }
  async findById(_organizationId: string, _projectId: string, id: string) { return this.items.get(id) ?? null; }
  async list(_organizationId: string, projectId: string) { return [...this.items.values()].filter((item) => item.projectId === projectId); }
  async updateStatus(_organizationId: string, _projectId: string, id: string, status: ProjectTask['status']) {
    const current=this.items.get(id); if(!current) throw new Error('missing');
    const updated={...current,status}; this.items.set(id,updated); return updated;
  }
}

test('project task lifecycle enforces valid transitions', async () => {
  const service = new ProjectTaskService(new MemoryTasks());
  const projectId=crypto.randomUUID();
  const task=await service.create('org', {projectId,title:'Build landing page'});
  await assert.rejects(() => service.transition('org', projectId, task.id, 'DONE'), /Invalid task transition/);
  const ready=await service.transition('org', projectId, task.id, 'READY');
  assert.equal(ready.status,'READY');
  const running=await service.transition('org', projectId, task.id, 'IN_PROGRESS');
  assert.equal(running.status,'IN_PROGRESS');
  const done=await service.transition('org', projectId, task.id, 'DONE');
  assert.equal(done.status,'DONE');
});