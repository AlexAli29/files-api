import jwt, { Algorithm } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'node:crypto';
import { TokenPayload } from '../domain/token-payload';
import { SessionRepository } from '../domain/session.repository';

type VerificationResult = TokenPayload & { exp: number };
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export class AuthService {
  constructor(
    private readonly accessSecret: string,
    private readonly refreshSecret: string,
    private readonly algorithm: Algorithm = 'HS256',
    private readonly bcryptRounds: number = 12,
    private readonly sessionRepository: SessionRepository,
    private readonly accessTtlSec: number,
    private readonly refreshTtlSec: number,
  ) {}

  async signAccess(payload: TokenPayload, ttlSec: number): Promise<string> {
    return this.signJwt(payload, this.accessSecret, ttlSec);
  }
  async signRefresh(payload: TokenPayload, ttlSec: number): Promise<string> {
    return this.signJwt(payload, this.refreshSecret, ttlSec);
  }
  async verifyAccess(token: string): Promise<VerificationResult> {
    return this.verifyJwt(token, this.accessSecret);
  }
  async verifyRefresh(token: string): Promise<VerificationResult> {
    return this.verifyJwt(token, this.refreshSecret);
  }

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.bcryptRounds);
  }
  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }

  async createSessionAndIssuePair(params: {
    userId: string;
  }): Promise<{ access: string; refresh: string }> {
    const { userId } = params;

    const tmpRefresh = await this.signRefresh(
      { sub: userId, sid: randomUUID(), ver: 1 },
      this.refreshTtlSec,
    );
    const tmpHash = sha256(tmpRefresh);

    const { id: sid, version: ver } = await this.sessionRepository.create({
      userId,
      refreshHash: tmpHash,
      expiresAt: new Date(Date.now() + this.refreshTtlSec * 1000),
    });

    const access = await this.signAccess(
      { sub: userId, sid, ver },
      this.accessTtlSec,
    );
    const refresh = await this.signRefresh(
      { sub: userId, sid, ver },
      this.refreshTtlSec,
    );

    await this.sessionRepository.updateRefresh(sid, sha256(refresh));

    return { access, refresh };
  }

  async rotateRefresh(params: {
    refresh: string;
  }): Promise<{ access: string; refresh: string }> {
    const { refresh } = params;

    const claims = await this.verifyRefresh(refresh);
    const sess = await this.sessionRepository.findById(claims.sid);
    if (!sess || sess.expiresAt <= new Date()) {
      throw new Error('session_revoked');
    }
    if (sess.version !== claims.ver) {
      throw new Error('session_revoked');
    }

    if (!sess.refreshHash || sess.refreshHash !== sha256(refresh)) {
      await this.sessionRepository.revoke(sess.id);
      throw new Error('refresh_reused');
    }

    const accessNew = await this.signAccess(
      { sub: sess.userId, sid: sess.id, ver: sess.version },
      this.accessTtlSec,
    );
    const refreshNew = await this.signRefresh(
      { sub: sess.userId, sid: sess.id, ver: sess.version },
      this.refreshTtlSec,
    );

    await this.sessionRepository.updateRefresh(sess.id, sha256(refreshNew));
    return { access: accessNew, refresh: refreshNew };
  }

  async logoutBySid(sid: string): Promise<void> {
    await this.sessionRepository.revoke(sid);
  }

  async logoutByAccessToken(accessToken: string): Promise<void> {
    const claims = await this.verifyAccess(accessToken).catch(() => null);
    if (!claims) return;
    await this.sessionRepository.revoke(claims.sid);
  }

  private async signJwt(
    payload: TokenPayload,
    secret: string,
    ttlSec: number,
  ): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      jwt.sign(
        payload as Record<string, unknown>,
        secret,
        {
          algorithm: this.algorithm,
          expiresIn: ttlSec,
          jwtid: randomUUID(),
        },
        (err, token) => (err || !token ? reject(err) : resolve(token)),
      );
    });
  }

  private async verifyJwt(
    token: string,
    secret: string,
  ): Promise<VerificationResult> {
    return new Promise<VerificationResult>((resolve, reject) => {
      jwt.verify(
        token,
        secret,
        { algorithms: [this.algorithm] },
        (err, decoded) => {
          if (err || !decoded || typeof decoded !== 'object')
            return reject(err ?? new Error('invalid_token'));
          const { exp, ...rest } = decoded as any;
          if (typeof exp !== 'number')
            return reject(new Error('token_without_exp'));
          resolve({ ...(rest as TokenPayload), exp });
        },
      );
    });
  }
}
