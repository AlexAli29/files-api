import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { AppConfig } from '../common/config';

export class DbManager {
  _db: MySql2Database;
  constructor(private readonly config: AppConfig) {
    const pool = mysql.createPool({
      host: config.DB_HOST,
      port: config.DB_PORT,
      user: config.DB_USER,
      password: config.DB_PASSWORD,
      database: config.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
    });

    this._db = drizzle(pool);
  }

  getDbProvider() {
    return this._db;
  }
}
