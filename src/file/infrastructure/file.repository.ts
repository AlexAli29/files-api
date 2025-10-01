import { count, desc, eq } from 'drizzle-orm';
import type { MySql2Database } from 'drizzle-orm/mysql2';
import { files } from './file.schema';
import { File as DomainFile } from '../domain/file.entity';
import { FileRepository as DomainFileRepository } from '../domain/file.repository';

export class FileRepository implements DomainFileRepository {
  constructor(private readonly db: MySql2Database) {}

  private toDomain(row: typeof files.$inferSelect): DomainFile {
    return DomainFile.create({
      id: row.id,
      name: row.name,
      mime: row.mime,
      path: row.path,
      size: row.size,
      uploadedAt:
        row.uploadedAt instanceof Date
          ? row.uploadedAt
          : new Date(row.uploadedAt),
      ext: row.ext,
    });
  }

  async insert(file: DomainFile): Promise<string> {
    await this.db.insert(files).values({
      id: file.id,
      name: file.name,
      ext: file.ext,
      mime: file.mime,
      uploadedAt: file.uploadedAt,
      size: file.size,
      path: file.path,
    });

    return file.id;
  }

  async findById(id: string): Promise<DomainFile | null> {
    const rows = await this.db.select().from(files).where(eq(files.id, id));
    const row = rows[0];
    if (!row) return null;
    return this.toDomain(row);
  }

  async list(limit: number, offset: number) {
    const [countRows, rows] = await Promise.all([
      this.db.select({ total: count() }).from(files),
      this.db
        .select()
        .from(files)
        .orderBy(desc(files.uploadedAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = countRows?.[0]?.total ?? 0;

    return {
      results: rows.map((r) => this.toDomain(r)),
      total: total,
    };
  }

  async deleteById(id: string): Promise<boolean> {
    await this.db.delete(files).where(eq(files.id, id));
    return true;
  }

  async updateMeta(id: string, patch: Partial<DomainFile>): Promise<void> {
    await this.db
      .update(files)
      .set(patch as any)
      .where(eq(files.id, id));
  }
}
