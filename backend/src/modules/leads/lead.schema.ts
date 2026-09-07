import { z } from 'zod';

export const createLeadSchema = z.object({
  source: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().email().max(320).optional(),
  phone: z.string().trim().min(3).max(50).optional(),
}).refine((value) => Boolean(value.name || value.email || value.phone), {
  message: 'At least one of name, email, or phone is required.',
});

export const leadIdSchema = z.object({ id: z.string().uuid() });

export const qualifyLeadSchema = z.object({
  score: z.number().min(0).max(100),
  qualified: z.boolean(),
  reason: z.string().trim().min(1).max(2000),
});

export const convertLeadSchema = z.object({ customerId: z.string().uuid() });
