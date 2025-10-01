import { mysqlTable, varchar } from 'drizzle-orm/mysql-core';

export const users = mysqlTable('users', {
  id: varchar('id', { length: 64 }).primaryKey(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
});
