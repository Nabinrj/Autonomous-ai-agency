import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowStepService } from '../src/modules/workflows/workflow-step.service.js';
import type { CreateWorkflowStepInput, WorkflowStep, WorkflowStepRepository, WorkflowStepStatus } from '../src/modules/workflows/workflow-step.types.js';
import type { AuditLogInput, AuditRepository } from '../src/modules/audit/audit.types.js';

class MemorySteps implements WorkflowStepRepository {
  private readonly items = new Map<string, WorkflowStep>();
  async create(_organizationId: string, input: CreateWorkflowStepInput) {
    const step: WorkflowStep = { id: crypto.randomUUID(), workflowRunId: input.workflowRunId, stepKey: input.stepKey, status: 'PENDING', attempt: 0, inputReference: input.inputReference ?? null, outputReference: null, errorCode: null, errorMessage: null };
    this.items.set(step.id, step); return step;
  }
  async findById(_organizationId: string, workflowRunId: string, id: string) { const item=this.items.get(id); return item?.workflowRunId===workflowRunId ? item : null; }
  async list(_organizationId: string, workflowRunId: string) { return [...this.items.values()].filter(item=>item.workflowRunId===workflowRunId); }
  async transition(_organizationId: string, workflowRunId: string, id: string, expected: WorkflowStepStatus, next: WorkflowStepStatus, result: { outputReference?: string; errorCode?: string; errorMessage?: string } = {}) {
    const current=await this.findById(_organizationId,workflowRunId,id);
    if (!current || current.status!==expected) throw new Error('concurrent update');
    const updated: WorkflowStep={...current,status:next,attempt:next==='RUNNING'?current.attempt+1:current.attempt,outputReference:result.outputReference??current.outputReference,errorCode:result.errorCode??null,errorMessage:result.errorMessage??null};
    this.items.set(id,updated); return updated;
  }
}
class MemoryAudit implements AuditRepository { entries: AuditLogInput[]=[]; async record(input: AuditLogInput){this.entries.push(input);} }

test('workflow steps enforce lifecycle, attempt counts, and audit events', async () => {
  const audit=new MemoryAudit();
  const service=new WorkflowStepService(new MemorySteps(),audit);
  const runId=crypto.randomUUID(); const correlationId=crypto.randomUUID();
  const step=await service.create('org',{workflowRunId:runId,stepKey:'build.compile'},correlationId);
  assert.equal(step.status,'PENDING');
  await assert.rejects(()=>service.transition('org',runId,step.id,'COMPLETED',correlationId),/Invalid workflow step transition/);
  const running=await service.transition('org',runId,step.id,'RUNNING',correlationId);
  assert.equal(running.attempt,1);
  const completed=await service.transition('org',runId,step.id,'COMPLETED',correlationId,{outputReference:'artifact://build/123'});
  assert.equal(completed.status,'COMPLETED');
  assert.equal(completed.outputReference,'artifact://build/123');
  assert.equal(audit.entries.length,3);
});

test('failed workflow steps require an error code and retries are bounded', async () => {
  const service=new WorkflowStepService(new MemorySteps(),new MemoryAudit());
  const runId=crypto.randomUUID(); const correlationId=crypto.randomUUID();
  const step=await service.create('org',{workflowRunId:runId,stepKey:'test.unit'},correlationId);
  await service.transition('org',runId,step.id,'RUNNING',correlationId);
  await assert.rejects(()=>service.transition('org',runId,step.id,'FAILED',correlationId),/requires an error code/);
  let current=await service.transition('org',runId,step.id,'FAILED',correlationId,{errorCode:'TEST_FAILED'});
  for(let attempt=0;attempt<4;attempt++) {
    current=await service.transition('org',runId,step.id,'PENDING',correlationId);
    current=await service.transition('org',runId,step.id,'RUNNING',correlationId);
    current=await service.transition('org',runId,step.id,'FAILED',correlationId,{errorCode:'TEST_FAILED'});
  }
  await assert.rejects(()=>service.transition('org',runId,step.id,'PENDING',correlationId).then(()=>service.transition('org',runId,step.id,'RUNNING',correlationId)),/retry limit/);
});
