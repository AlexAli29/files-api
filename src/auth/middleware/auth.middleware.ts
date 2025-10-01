import type { RequestHandler } from 'express';
import { AuthService } from '../application/auth.service';
import { SessionRepository } from '../domain/session.repository';

declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: string; sid: string; ver: number };
  }
}

export const AuthMiddleware =
  (deps: {
    tokens: AuthService;
    sessions: SessionRepository;
  }): RequestHandler =>
  async (req, res, next) => {
    try {
      const auth = req.headers.authorization ?? '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
      if (!token) return res.sendStatus(401);

      const claims = await deps.tokens.verifyAccess(token);
      const sess = await deps.sessions.findById(claims.sid);

      if (!sess || sess.version !== claims.ver) {
        return res.sendStatus(401);
      }

      req.user = { id: claims.sub, sid: claims.sid, ver: claims.ver };
      next();
    } catch {
      res.sendStatus(401);
    }
  };
