import { z } from 'zod';
import { PROJECT_TASK_TRANSITIONS } from './project-task.types.js';

export const projectTaskIdSchema = z.object({ id: z.string().uuid() });
export const projectTaskProjectIdSchema = z.object({ projectId: z.string().uuid() });
export const createProjectTaskSchema = z.object({
  projectId: z.string().uuid(),
  parentTaskId: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional(),
  assignedTo: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).max(100000).optional(),
});
export const projectTaskTransitionSchema = z.object({
  nextStatus: z.enum(Object.keys(PROJECT_TASK_TRANSITIONS) as [keyof typeof PROJECT_TASK_TRANSITIONS, ...(keyof typeof PROJECT_TASK_TRANSITIONS)[]]),
});