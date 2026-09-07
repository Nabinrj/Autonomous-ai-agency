import { z } from 'zod';
import { PROJECT_TRANSITIONS } from './project.types.js';

export const projectIdSchema = z.object({ id: z.string().uuid() });
export const projectTransitionSchema = z.object({ nextStatus: z.enum(Object.keys(PROJECT_TRANSITIONS) as [keyof typeof PROJECT_TRANSITIONS, ...(keyof typeof PROJECT_TRANSITIONS)[]]) });
