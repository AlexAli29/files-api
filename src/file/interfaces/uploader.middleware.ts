import multer from 'multer';
import os from 'node:os';
import path from 'node:path';

export const uploadMiddleware = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, path.join(os.tmpdir())),
    filename: (_req, file, cb) =>
      cb(null, `${Date.now()}_${file.originalname}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024 },
});
