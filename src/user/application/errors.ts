import { BaseError } from '../../common/error';

export class UserAlreadyExistsError extends BaseError {
  constructor(id: string) {
    super('Пользователь с таким id уже существует', { id });

    this.name = 'UserAlreadyExistsError';
  }
}
