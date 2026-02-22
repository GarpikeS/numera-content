import { getDb } from '../db';
import type { Digest } from '../../types';

export const digestQueries = {
  create(summary: string, messageCount: number, periodStart: string, periodEnd: string): Digest {
    const stmt = getDb().prepare(
      'INSERT INTO digests (summary, message_count, period_start, period_end) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(summary, messageCount, periodStart, periodEnd);
    return this.getById(Number(result.lastInsertRowid))!;
  },

  getById(id: number): Digest | undefined {
    return getDb().prepare('SELECT * FROM digests WHERE id = ?').get(id) as Digest | undefined;
  },

  getLatest(): Digest | undefined {
    return getDb().prepare('SELECT * FROM digests ORDER BY id DESC LIMIT 1').get() as Digest | undefined;
  },

  getAll(limit: number = 10): Digest[] {
    return getDb().prepare('SELECT * FROM digests ORDER BY id DESC LIMIT ?').all(limit) as Digest[];
  },

  count(): number {
    const row = getDb().prepare('SELECT COUNT(*) as cnt FROM digests').get() as { cnt: number };
    return row.cnt;
  },
};
