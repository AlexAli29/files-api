import fs from 'node:fs';
import path from 'node:path';
import { FileRepository } from '../domain/file.repository';
import { File } from '../domain/file.entity';

export class FileService {
  constructor(
    private readonly fileRepository: FileRepository,
    private readonly storageRoot: string = 'storage',
  ) {
    fs.mkdirSync(this.storageRoot, { recursive: true });
  }

  private buildPath(fileName: string) {
    return path.join(this.storageRoot, fileName);
  }

  async upload(params: {
    tempPath: string;
    originalName: string;
    mime: string;
    size: number;
  }): Promise<{ id: string }> {
    const dest = this.buildPath(params.originalName);

    const exists = await fs.promises
      .access(dest, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    if (exists) {
      await fs.promises.unlink(params.tempPath).catch(() => {});
      throw new Error('file_exists');
    }

    await fs.promises.rename(params.tempPath, dest);

    const entity = File.create({
      name: params.originalName,
      mime: params.mime,
      path: params.originalName,
      size: params.size,
    });

    const id = await this.fileRepository.insert(entity);

    return { id };
  }

  async info(id: string) {
    return this.fileRepository.findById(id);
  }

  async list(page: number = 1, pageSize: number = 10) {
    const offset = (page - 1) * pageSize;

    const { results, total } = await this.fileRepository.list(pageSize, offset);
    return {
      results,
      page: page,
      pageSize: pageSize,
      total,
      pages: Math.ceil(total / pageSize),
    };
  }

  async remove(id: string) {
    const f = await this.fileRepository.findById(id);
    if (!f) return false;

    await this.fileRepository.deleteById(id);
    await fs.promises.unlink(this.buildPath(f.path)).catch(() => {});
    return true;
  }

  async update(
    id: string,
    params: {
      tempPath: string;
      originalName: string;
      mime: string;
      size: number;
    },
  ) {
    const f = await this.fileRepository.findById(id);
    if (!f) return false;

    const dest = this.buildPath(f.path);
    await fs.promises.copyFile(params.tempPath, dest);
    await fs.promises.unlink(params.tempPath).catch(() => {});

    const ext = path
      .extname(params.originalName)
      .replace(/^\./, '')
      .toLowerCase();
    await this.fileRepository.updateMeta(id, {
      name: params.originalName,
      ext,
      mime: params.mime,
      size: params.size,
    });

    return true;
  }

  downloadPath(fileName: string) {
    return this.buildPath(fileName);
  }
}
