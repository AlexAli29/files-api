export type Session = {
  id: string;
  userId: string;
  version: number;
  refreshHash?: string;

  expiresAt: Date;
  createdAt: Date;
};

export interface SessionRepository {
  create(p: {
    userId: string;
    refreshHash: string;
    expiresAt: Date;
  }): Promise<{ id: string; version: number }>;
  findById(id: string): Promise<Session | null>;
  updateRefresh(id: string, refreshHash: string): Promise<void>;
  revoke(id: string): Promise<void>;
}
