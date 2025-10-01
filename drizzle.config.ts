import { config } from './src/common/config';

import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  out: './drizzle',
  schema: [
    './src/user/infrastructure/user.schema.ts',
    './src/file/infrastructure/file.schema.ts',
  ],
  dialect: 'mysql',
  dbCredentials: {
    url: config.DATABASE_URL,
  },
});
