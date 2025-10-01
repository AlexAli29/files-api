import { mysqlTable, varchar, int, datetime } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

export const files = mysqlTable('files', {
  id: varchar('id', { length: 36 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ext: varchar('ext', { length: 20 }).notNull(),
  mime: varchar('mime', { length: 127 }).notNull(),
  path: varchar('path', { length: 255 }).notNull(),
  size: int('size').notNull(),
  uploadedAt: datetime('uploaded_at', { mode: 'date' })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});
