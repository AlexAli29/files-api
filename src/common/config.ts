import 'dotenv/config';
import { z } from 'zod';
import path from 'node:path';

const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),

  APP_PORT: z.coerce.number().int().positive().default(3000),
  APP_HOST: z.string().default('0.0.0.0'),
  CORS_ORIGIN: z.string().default('*'),

  // DB
  DATABASE_URL: z.url(),

  DB_HOST: z.string().default('127.0.0.1'),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().default('app'),
  DB_PASSWORD: z.string().default('apppass'),
  DB_NAME: z.string().default('filesapi'),

  // Auth
  JWT_ALG: z.enum(['HS256', 'ES256']).default('HS256'),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  ACCESS_TTL_SEC: z.coerce
    .number()
    .int()
    .positive()
    .default(10 * 60),
  REFRESH_TTL_SEC: z.coerce
    .number()
    .int()
    .positive()
    .default(60 * 60 * 24),

  STORAGE_ROOT: z.string().default(path.resolve('file-storage')),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(50),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid configuration:', parsed.error.format());
  process.exit(1);
}

export type AppConfig = z.infer<typeof schema>;
export const config: AppConfig = parsed.data;
