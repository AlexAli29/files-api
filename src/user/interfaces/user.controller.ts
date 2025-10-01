import { UserService } from '../application/user.service';
import { Request, RequestHandler, Response, Router } from 'express';
import { SignInDto, SignInSchema, SignUpDto, SignUpSchema } from './dto';
import { validate } from '../../common/validation';
import { AuthService } from '../../auth/application/auth.service';
import { UserAlreadyExistsError } from '../application/errors';

export class UserController {
  private _router: Router;
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly authMiddleware: RequestHandler,
  ) {
    this._router = Router();
  }

  async signUp(req: Request<{}, any, SignUpDto>, res: Response) {
    try {
      const signUpDto = req.body;
      const passwordHash = await this.authService.hashPassword(
        signUpDto.password,
      );
      const newUserId = await this.userService.createUser({
        id: signUpDto.id,
        passwordHash,
      });
      const tokens = await this.authService.createSessionAndIssuePair({
        userId: newUserId,
      });
      res.status(201).json(tokens);
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        return res.status(409).json({ error: error.message });
      }
      return res.sendStatus(500);
    }
  }

  async signIn(req: Request<{}, any, SignInDto>, res: Response) {
    const signInDto = req.body;

    const user = await this.userService.getUserById(signInDto.id);

    if (!user) {
      return res.sendStatus(401);
    }

    const isCorrectPass = await this.authService.verifyPassword(
      signInDto.password,
      user.passwordHash,
    );

    if (!isCorrectPass) {
      return res.sendStatus(401);
    }
    const tokens = await this.authService.createSessionAndIssuePair({
      userId: user.id,
    });
    res.status(201).json(tokens);
  }

  async info(req: Request, res: Response) {
    const session = req.user;

    if (!session) return res.sendStatus(401);
    const userId = await this.userService.getUserById(session.id);

    res.json({ id: userId?.id });
  }

  async logout(req: Request, res: Response) {
    const session = req.user;

    if (!session) return res.sendStatus(401);

    await this.authService.logoutBySid(session.sid);
    res.sendStatus(200);
  }

  async refreshTokens(req: Request, res: Response) {
    try {
      const { refresh } = req.body;
      if (!refresh) {
        res.sendStatus(401);
      }
      const pair = await this.authService.rotateRefresh({
        refresh,
      });
      res.json(pair);
    } catch (e) {
      res.sendStatus(401);
    }
  }

  get router() {
    this._router.post('/signup', validate({ body: SignUpSchema }), (req, res) =>
      this.signUp(req, res),
    );
    this._router.post('/signin', validate({ body: SignInSchema }), (req, res) =>
      this.signIn(req, res),
    );
    this._router.get('/logout', this.authMiddleware, (req, res) =>
      this.logout(req, res),
    );

    this._router.get('/info', this.authMiddleware, (req, res) =>
      this.info(req, res),
    );
    this._router.get('/signin/new_token', (req, res) => this.info(req, res));
    return this._router;
  }
}
