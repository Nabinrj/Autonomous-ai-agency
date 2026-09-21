import { z } from 'zod';

export const workflowIdSchema = z.object({ id: z.string().uuid() });
export const createWorkflowSchema = z.object({
  workflowType: z.string().trim().min(1).max(100),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().uuid().optional(),
  correlationId: z.string().uuid(),
});
export const workflowTransitionSchema = z.object({
  nextStatus: z.enum(['RUNNING', 'WAITING', 'COMPLETED', 'FAILED', 'CANCELLED', 'TIMED_OUT']),
  errorCode: z.string().max(100).optional(),
  errorMessage: z.string().max(1000).optional(),
});