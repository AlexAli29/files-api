import { Request, Response, Router } from 'express';
import fs from 'node:fs';
import { validate } from '../../common/validation';
import { FileService } from '../application/file.service';
import { uploadMiddleware } from './uploader.middleware';
import { FileInfoResponse, FileUrlParamsSchema } from './dto';

export class FileController {
  private _router: Router;
  constructor(private readonly fileService: FileService) {
    this._router = Router();
  }

  private async upload(req: Request, res: Response) {
    try {
      if (!req.file) return res.status(400).json({ error: 'file_required' });

      const { originalname, mimetype, size, path } = req.file;
      const { id } = await this.fileService.upload({
        tempPath: path,
        originalName: originalname,
        mime: mimetype || 'application/octet-stream',
        size,
      });

      res.status(201).json({ id });
    } catch (e: any) {
      if (e?.message === 'file_exists')
        return res.status(409).json({ error: 'file_already_exists' });

      if (req.file) fs.promises.unlink(req.file.path).catch(() => {});
      res.sendStatus(500);
    }
  }

  private async list(req: Request, res: Response) {
    const { list_size, page } = req.query as any;
    const result = await this.fileService.list(page ?? 1, list_size ?? 10);
    res.json({
      ...result,
      results: result.results.map(
        (file) =>
          new FileInfoResponse(
            file.id,
            file.name,
            file.ext,
            file.size,
            file.uploadedAt,
          ),
      ),
    });
  }

  private async delete(req: Request, res: Response) {
    const ok = await this.fileService.remove(req.params.id);
    if (!ok) return res.sendStatus(404);
    res.json({ ok: true });
  }

  private async info(req: Request, res: Response) {
    const file = await this.fileService.info(req.params.id);
    if (!file) return res.sendStatus(404);
    res.json(
      new FileInfoResponse(
        file.id,
        file.name,
        file.ext,
        file.size,
        file.uploadedAt,
      ),
    );
  }

  private async download(req: Request, res: Response) {
    const f = await this.fileService.info(req.params.id);
    if (!f) return res.sendStatus(404);

    const abs = this.fileService.downloadPath(f.path);

    try {
      await fs.promises.access(abs, fs.constants.F_OK);
    } catch {
      return res.sendStatus(410);
    }

    res.setHeader('Content-Type', f.mime);
    res.setHeader('Content-Length', String(f.size));
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(f.name)}"`,
    );
    fs.createReadStream(abs).pipe(res);
  }

  private async update(req: Request, res: Response) {
    if (!req.file) return res.status(400).json({ error: 'file_required' });

    const ok = await this.fileService.update(req.params.id, {
      tempPath: req.file.path,
      originalName: req.file.originalname,
      mime: req.file.mimetype || 'application/octet-stream',
      size: req.file.size,
    });

    if (!ok) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.sendStatus(404);
    }

    res.json({ ok: true });
  }

  get router() {
    this._router.post('/upload', uploadMiddleware.single('file'), (req, res) =>
      this.upload(req, res),
    );

    this._router.get('/list', (req, res) => this.list(req, res));

    this._router.delete(
      '/delete/:id',
      validate({ params: FileUrlParamsSchema }),
      (req, res) => this.delete(req, res),
    );

    this._router.get(
      '/:id',
      validate({ params: FileUrlParamsSchema }),
      (req, res) => this.info(req, res),
    );

    this._router.get(
      '/download/:id',
      validate({ params: FileUrlParamsSchema }),
      (req, res) => this.download(req, res),
    );

    this._router.put(
      '/update/:id',
      validate({ params: FileUrlParamsSchema }),
      uploadMiddleware.single('file'),
      (req, res) => this.update(req, res),
    );

    return this._router;
  }
}
