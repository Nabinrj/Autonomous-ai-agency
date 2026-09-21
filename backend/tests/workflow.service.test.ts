import test from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowService } from '../src/modules/workflows/workflow.service.js';
import type { WorkflowRepository, WorkflowRun } from '../src/modules/workflows/workflow.types.js';
import type { AuditLogInput, AuditRepository } from '../src/modules/audit/audit.types.js';

class MemoryWorkflow implements WorkflowRepository {
  private readonly items = new Map<string, WorkflowRun>();
  async create(input: Parameters<WorkflowRepository['create']>[0]) {
    const run: WorkflowRun={id:crypto.randomUUID(),organizationId:input.organizationId,workflowType:input.workflowType,entityType:input.entityType??null,entityId:input.entityId??null,status:'CREATED',correlationId:input.correlationId,errorCode:null,errorMessage:null};
    this.items.set(run.id,run); return run;
  }
  async findById(_org:string,id:string){return this.items.get(id)??null;}
  async updateStatus(_org:string,id:string,status:WorkflowRun['status'],errorCode?:string,errorMessage?:string){
    const current=this.items.get(id); if(!current) throw new Error('missing');
    const updated={...current,status,errorCode:errorCode??current.errorCode,errorMessage:errorMessage??current.errorMessage}; this.items.set(id,updated); return updated;
  }
}
class MemoryAudit implements AuditRepository {
  entries: AuditLogInput[]=[];
  async record(input: AuditLogInput){this.entries.push(input);}
}

test('workflow lifecycle records audit events', async()=>{
  const audit=new MemoryAudit();
  const service=new WorkflowService(new MemoryWorkflow(),audit);
  const run=await service.create({organizationId:'org',workflowType:'requirements.gathering',correlationId:crypto.randomUUID()});
  assert.equal(run.status,'CREATED');
  await service.transition('org',run.id,'RUNNING');
  const completed=await service.transition('org',run.id,'COMPLETED');
  assert.equal(completed.status,'COMPLETED');
  assert.equal(audit.entries.length,3);
  assert.equal(audit.entries[1]?.action,'workflow.running');
  assert.equal(audit.entries[2]?.action,'workflow.completed');
});

test('workflow rejects invalid transitions', async()=>{
  const service=new WorkflowService(new MemoryWorkflow(),new MemoryAudit());
  const run=await service.create({organizationId:'org',workflowType:'test',correlationId:crypto.randomUUID()});
  await assert.rejects(() => service.transition('org',run.id,'COMPLETED'), /Invalid workflow transition/);
});