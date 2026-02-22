import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { initSchema } from './schema';
import { logger } from '../logger';

let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!instance) {
    const dbDir = path.dirname(config.DB_PATH);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    instance = new Database(config.DB_PATH);
    instance.pragma('journal_mode = WAL');
    instance.pragma('foreign_keys = ON');
    initSchema(instance);
    logger.info({ path: config.DB_PATH }, 'Database initialized');
  }
  return instance;
}

export function closeDb(): void {
  if (instance) {
    instance.close();
    instance = null;
    logger.info('Database closed');
  }
}
