import { z } from 'zod';

export const approvalIdSchema = z.object({ id: z.string().uuid() });
export const approvalDecisionSchema = z.object({ status: z.enum(['APPROVED', 'REJECTED']), note: z.string().max(2000).optional() });
