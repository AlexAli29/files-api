import { MySql2Database } from 'drizzle-orm/mysql2';
import { User } from '../domain/user.entity';
import { UserRepository as DomainUserRepository } from '../domain/user.repository';
import { users } from './user.schema';
import { eq } from 'drizzle-orm';

export class UserRepository implements DomainUserRepository {
  constructor(private readonly db: MySql2Database) {}
  async save(user: User): Promise<string> {
    await this.db.insert(users).values({
      id: user.id,
      passwordHash: user.passwordHash,
    });

    return user.id;
  }
  async getUserById(id: string): Promise<User | null> {
    const row = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)
      .then((r) => r[0]);

    if (!row) return null;
    return User.create(row.id, row.passwordHash);
  }
}
