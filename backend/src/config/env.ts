import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().or(z.string().startsWith('postgresql://')).optional(),
  REDIS_URL: z.string().url().or(z.string().startsWith('redis://')).optional(),
  AI_PROVIDER: z.string().default('mock'),
  AI_MODEL: z.string().default('development-model'),
  AI_API_KEY: z.string().optional(),
  OBJECT_STORAGE_ENDPOINT: z.string().url().optional(),
  OBJECT_STORAGE_BUCKET: z.string().optional(),
  OBJECT_STORAGE_ACCESS_KEY: z.string().optional(),
  OBJECT_STORAGE_SECRET_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.string().default('mock'),
  EMAIL_API_KEY: z.string().optional(),
  SESSION_SECRET: z.string().min(16).default('development-only-change-me')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
