import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  HOST: z.string().default('127.0.0.1'),
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
  OIDC_ISSUER: z.string().url().optional(),
  OIDC_AUDIENCE: z.string().min(1).optional(),
  OIDC_JWKS_URL: z.string().url().optional(),
});

const productionSchema = envSchema.superRefine((value, context) => {
  if (value.NODE_ENV !== 'production') return;
  if (!value.DATABASE_URL) context.addIssue({ code: z.ZodIssueCode.custom, path: ['DATABASE_URL'], message: 'DATABASE_URL is required in production.' });
  if (!value.OIDC_ISSUER) context.addIssue({ code: z.ZodIssueCode.custom, path: ['OIDC_ISSUER'], message: 'OIDC_ISSUER is required in production.' });
  if (!value.OIDC_AUDIENCE) context.addIssue({ code: z.ZodIssueCode.custom, path: ['OIDC_AUDIENCE'], message: 'OIDC_AUDIENCE is required in production.' });
  if (!value.OIDC_JWKS_URL) context.addIssue({ code: z.ZodIssueCode.custom, path: ['OIDC_JWKS_URL'], message: 'OIDC_JWKS_URL is required in production.' });
  if (value.OIDC_ISSUER && !value.OIDC_ISSUER.startsWith('https://')) context.addIssue({ code: z.ZodIssueCode.custom, path: ['OIDC_ISSUER'], message: 'OIDC_ISSUER must use HTTPS in production.' });
  if (value.OIDC_JWKS_URL && !value.OIDC_JWKS_URL.startsWith('https://')) context.addIssue({ code: z.ZodIssueCode.custom, path: ['OIDC_JWKS_URL'], message: 'OIDC_JWKS_URL must use HTTPS in production.' });
  if (value.CORS_ORIGIN === '*' || !value.CORS_ORIGIN.startsWith('https://')) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'CORS_ORIGIN must be a specific HTTPS origin in production.' });
  } else {
    try {
      const origin = new URL(value.CORS_ORIGIN);
      if (origin.origin !== value.CORS_ORIGIN) context.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'CORS_ORIGIN must contain only the origin, without a path or trailing slash.' });
    } catch {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['CORS_ORIGIN'], message: 'CORS_ORIGIN must be a valid HTTPS origin.' });
    }
  }
});
const parsed = productionSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
