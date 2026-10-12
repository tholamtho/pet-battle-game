import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().url(),
  DATABASE_SSL: z.enum(['true', 'false']).default('false'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.string().default('info'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const e = parsed.data;
export const env = Object.freeze({
  ...e,
  isProd: e.NODE_ENV === 'production',
  databaseSsl: e.DATABASE_SSL === 'true',
  corsOrigins: e.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
});
