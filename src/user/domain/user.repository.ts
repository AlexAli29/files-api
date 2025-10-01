import { User } from './user.entity';

export interface UserRepository {
  save(user: User): Promise<string>;
  getUserById(id: string): Promise<User | null>;
}
