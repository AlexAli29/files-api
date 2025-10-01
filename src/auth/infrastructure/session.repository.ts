import crypto from 'node:crypto';
import { SessionRepository, Session } from '../domain/session.repository';

export class MemorySessionRepoSitory implements SessionRepository {
  private map = new Map<string, Session>();

  async create(p: { userId: string; refreshHash: string; expiresAt: Date }) {
    const id = crypto.randomUUID();
    const rec: Session = {
      id,
      userId: p.userId,
      version: 1,
      refreshHash: p.refreshHash,
      expiresAt: p.expiresAt,
      createdAt: new Date(),
    };
    this.map.set(id, rec);
    return { id, version: rec.version };
  }
  async findById(id: string) {
    return this.map.get(id) ?? null;
  }
  async updateRefresh(id: string, refreshHash: string) {
    const s = this.map.get(id);
    if (s) s.refreshHash = refreshHash;
  }
  async revoke(id: string) {
    this.map.delete(id);
  }
}
