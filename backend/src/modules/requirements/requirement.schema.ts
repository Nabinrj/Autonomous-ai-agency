import { z } from 'zod';

export const requirementIdSchema = z.object({ id: z.string().uuid() });
export const approveRequirementSchema = z.object({ versionId: z.string().uuid() });
