import { z } from 'zod';
import { WORKFLOW_STEP_TRANSITIONS } from './workflow-step.types.js';

export const workflowRunPathSchema = z.object({ workflowRunId: z.string().uuid() });
export const workflowStepPathSchema = z.object({ workflowRunId: z.string().uuid(), id: z.string().uuid() });

export const createWorkflowStepSchema = z.object({
  stepKey: z.string().trim().min(1).max(120).regex(/^[a-zA-Z0-9._-]+$/),
  inputReference: z.string().max(500).optional(),
});

export const workflowStepTransitionSchema = z.object({
  nextStatus: z.enum(Object.keys(WORKFLOW_STEP_TRANSITIONS) as [keyof typeof WORKFLOW_STEP_TRANSITIONS, ...(keyof typeof WORKFLOW_STEP_TRANSITIONS)[]]),
  outputReference: z.string().max(500).optional(),
  errorCode: z.string().max(100).optional(),
  errorMessage: z.string().max(1000).optional(),
});
