import express from 'express';
import { UserService } from './user/application/user.service';
import { UserRepository } from './user/infrastructure/user.repository';
import { UserController } from './user/interfaces/user.controller';
import { AuthService } from './auth/application/auth.service';
import { MemorySessionRepoSitory } from './auth/infrastructure/session.repository';
import { AuthMiddleware } from './auth/middleware/auth.middleware';
import { DbManager } from './database/db-manager';
import { FileRepository } from './file/infrastructure/file.repository';
import { FileService } from './file/application/file.service';
import { FileController } from './file/interfaces/file.controller';
import { config } from './common/config';
import cors, { type CorsOptions } from 'cors';

const app = express();

function main() {
  app.use(express.json());
  const appConfig = config;
  const dbManager = new DbManager(appConfig);
  const dbProvider = dbManager.getDbProvider();

  const sessionRepository = new MemorySessionRepoSitory();
  const authService = new AuthService(
    appConfig.JWT_ACCESS_SECRET,
    appConfig.JWT_REFRESH_SECRET,
    appConfig.JWT_ALG,
    12,
    sessionRepository,
    appConfig.ACCESS_TTL_SEC,
    appConfig.REFRESH_TTL_SEC,
  );
  const authMiddleWare = AuthMiddleware({
    tokens: authService,
    sessions: sessionRepository,
  });

  const userRepository = new UserRepository(dbProvider);
  const userService = new UserService(userRepository);
  const userController = new UserController(
    userService,
    authService,
    authMiddleWare,
  );

  const fileRepository = new FileRepository(dbProvider);
  const fileService = new FileService(fileRepository, appConfig.STORAGE_ROOT);
  const fileController = new FileController(fileService);

  app.use('/', userController.router);
  app.use('/file', authMiddleWare, fileController.router);

  const corsOptions: CorsOptions = {
    origin: appConfig.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Content-Disposition'],
  };

  app.use(cors(corsOptions));

  app.listen(appConfig.APP_PORT, () => {
    console.log(
      `Server listening on http://${appConfig.APP_HOST}:${appConfig.APP_PORT}`,
    );
  });
}

main();
