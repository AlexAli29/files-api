import { randomUUID } from 'node:crypto';
import path from 'node:path';

function normalizeExt(input: string): string {
  const e = input.trim().toLowerCase();
  if (!e) return '';
  if (e.startsWith('.')) return e.slice(1);
  return e;
}

function extFromName(name: string): string {
  const ext = path
    .extname(name || '')
    .toLowerCase()
    .replace(/^\./, '');
  return ext;
}

export class File {
  private constructor(
    public readonly id: string,
    private _name: string,
    private _ext: string,
    private _mime: string,
    private _path: string,
    private _size: number,
    public readonly uploadedAt: Date,
  ) {}

  get name() {
    return this._name;
  }
  get ext() {
    return this._ext;
  }
  get mime() {
    return this._mime;
  }
  get path() {
    return this._path;
  }
  get size() {
    return this._size;
  }

  static create(input: {
    name: string;
    mime: string;
    path: string;
    size: number;
    id?: string;
    ext?: string;
    uploadedAt?: Date;
  }): File {
    const id = input.id ?? randomUUID();
    const ext = normalizeExt(input.ext ?? extFromName(input.name));
    const uploadedAt = input.uploadedAt ?? new Date();
    return new File(
      id,
      input.name,
      ext,
      input.mime,
      input.path,
      input.size,
      uploadedAt,
    );
  }
}
