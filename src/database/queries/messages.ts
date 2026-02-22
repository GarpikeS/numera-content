import { getDb } from '../db';
import type { CollectedMessage } from '../../types';

export const messageQueries = {
  create(channelId: number, externalId: string, content: string, pubDate: string): CollectedMessage | null {
    try {
      const stmt = getDb().prepare(
        'INSERT INTO collected_messages (channel_id, external_id, content, pub_date) VALUES (?, ?, ?, ?)'
      );
      const result = stmt.run(channelId, externalId, content, pubDate);
      return this.getById(Number(result.lastInsertRowid))!;
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') return null;
      throw err;
    }
  },

  getById(id: number): CollectedMessage | undefined {
    return getDb().prepare('SELECT * FROM collected_messages WHERE id = ?').get(id) as CollectedMessage | undefined;
  },

  getUnused(): CollectedMessage[] {
    return getDb().prepare(
      'SELECT * FROM collected_messages WHERE used_in_digest_id IS NULL ORDER BY pub_date DESC'
    ).all() as CollectedMessage[];
  },

  markUsedInDigest(ids: number[], digestId: number): void {
    const stmt = getDb().prepare('UPDATE collected_messages SET used_in_digest_id = ? WHERE id = ?');
    const tx = getDb().transaction(() => {
      for (const id of ids) {
        stmt.run(digestId, id);
      }
    });
    tx();
  },

  countByChannel(channelId: number): number {
    const row = getDb().prepare('SELECT COUNT(*) as cnt FROM collected_messages WHERE channel_id = ?').get(channelId) as { cnt: number };
    return row.cnt;
  },

  countTotal(): number {
    const row = getDb().prepare('SELECT COUNT(*) as cnt FROM collected_messages').get() as { cnt: number };
    return row.cnt;
  },

  getRecentByChannel(channelId: number, limit: number = 50): CollectedMessage[] {
    return getDb().prepare(
      'SELECT * FROM collected_messages WHERE channel_id = ? ORDER BY pub_date DESC LIMIT ?'
    ).all(channelId, limit) as CollectedMessage[];
  },
};
