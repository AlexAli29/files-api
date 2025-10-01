import type { RequestHandler } from 'express';
import { ZodType, ZodError, z } from 'zod';

type Schemas = Partial<{
  body: ZodType<any>;
  query: ZodType<any>;
  params: ZodType<any>;
  headers: ZodType<any>;
}>;

type Options = {
  assignParsed?: boolean;
};

export function validate(schemas: Schemas, opts: Options = {}): RequestHandler {
  const { assignParsed = true } = opts;

  return (req, res, next) => {
    try {
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        if (assignParsed) req.params = parsed;
      }
      if (schemas.query) {
        const parsed = schemas.query.parse(req.query);
        if (assignParsed) req.query = parsed;
      }
      if (schemas.body) {
        const parsed = schemas.body.parse(req.body);
        if (assignParsed) req.body = parsed;
      }
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json(
          e.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        );
      }
      next(e);
    }
  };
}
