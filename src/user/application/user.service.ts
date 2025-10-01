import { User } from '../domain/user.entity';
import { UserRepository } from '../domain/user.repository';
import { CreateUserRequest } from './create-user-request';
import { UserAlreadyExistsError } from './errors';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async createUser(user: CreateUserRequest): Promise<string> {
    const userById = await this.userRepository.getUserById(user.id);
    if (userById) throw new UserAlreadyExistsError(userById.id);
    return this.userRepository.save(User.create(user.id, user.passwordHash));
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.getUserById(id);
  }
}
