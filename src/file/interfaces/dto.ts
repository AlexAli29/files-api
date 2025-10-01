import z from 'zod';

export class FileInfoResponse {
  constructor(
    private id: string,
    private name: string,
    private ext: string,
    private size: number,
    private uploadedAt: Date,
  ) {}
}

export const FileUrlParamsSchema = z.object({
  id: z.uuid(),
});
