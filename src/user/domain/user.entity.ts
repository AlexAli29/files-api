export class User {
  private constructor(
    public readonly id: string,
    private _passwordHash: string,
  ) {}

  get passwordHash() {
    return this._passwordHash;
  }

  static create(id: string, passwordHash: string): User {
    return new User(id, passwordHash);
  }
}
