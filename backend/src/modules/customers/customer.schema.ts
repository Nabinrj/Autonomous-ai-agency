import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1).max(200),
  notes: z.string().max(5000).optional(),
});

export const customerIdSchema = z.object({
  id: z.string().uuid(),
});

export const listCustomersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});
