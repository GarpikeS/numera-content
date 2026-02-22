import { getDb } from '../db';
import type { Channel } from '../../types';

export const channelQueries = {
  getAll(): Channel[] {
    return getDb().prepare('SELECT * FROM channels ORDER BY id').all() as Channel[];
  },

  getActive(): Channel[] {
    return getDb().prepare('SELECT * FROM channels WHERE is_active = 1 ORDER BY id').all() as Channel[];
  },

  getById(id: number): Channel | undefined {
    return getDb().prepare('SELECT * FROM channels WHERE id = ?').get(id) as Channel | undefined;
  },

  create(username: string, title: string, rsshubRoute: string): Channel {
    const stmt = getDb().prepare(
      'INSERT INTO channels (username, title, rsshub_route) VALUES (?, ?, ?)'
    );
    const result = stmt.run(username, title, rsshubRoute);
    return this.getById(Number(result.lastInsertRowid))!;
  },

  toggle(id: number): Channel | undefined {
    getDb().prepare('UPDATE channels SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE id = ?').run(id);
    return this.getById(id);
  },

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM channels WHERE id = ?').run(id);
    return result.changes > 0;
  },

  count(): number {
    const row = getDb().prepare('SELECT COUNT(*) as cnt FROM channels').get() as { cnt: number };
    return row.cnt;
  },
};
