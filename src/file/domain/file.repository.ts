import { File } from './file.entity';

export interface FileRepository {
  insert(file: File): Promise<string>;
  findById(id: string): Promise<File | null>;
  list(
    limit: number,
    offset: number,
  ): Promise<{
    results: File[];
    total: number;
  }>;
  deleteById(id: string): Promise<boolean>;
  updateMeta(id: string, patch: Partial<File>): Promise<void>;
}
