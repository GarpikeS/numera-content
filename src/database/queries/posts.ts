import { getDb } from '../db';
import type { Post, PostStatus } from '../../types';

export const postQueries = {
  create(content: string, sourceType: string, digestId?: number): Post {
    const stmt = getDb().prepare(
      'INSERT INTO posts (content, status, source_type, digest_id) VALUES (?, ?, ?, ?)'
    );
    const result = stmt.run(content, 'pending', sourceType, digestId ?? null);
    return this.getById(Number(result.lastInsertRowid))!;
  },

  getById(id: number): Post | undefined {
    return getDb().prepare('SELECT * FROM posts WHERE id = ?').get(id) as Post | undefined;
  },

  getByStatus(status: PostStatus): Post[] {
    return getDb().prepare('SELECT * FROM posts WHERE status = ? ORDER BY id DESC').all(status) as Post[];
  },

  getPending(): Post[] {
    return this.getByStatus('pending');
  },

  getScheduled(): Post[] {
    return getDb().prepare(
      "SELECT * FROM posts WHERE status = 'scheduled' AND scheduled_at <= datetime('now') ORDER BY scheduled_at"
    ).all() as Post[];
  },

  updateStatus(id: number, status: PostStatus): void {
    getDb().prepare('UPDATE posts SET status = ? WHERE id = ?').run(status, id);
  },

  updateContent(id: number, content: string): void {
    getDb().prepare('UPDATE posts SET content = ? WHERE id = ?').run(content, id);
  },

  setImageUrl(id: number, imageUrl: string): void {
    getDb().prepare('UPDATE posts SET image_url = ? WHERE id = ?').run(imageUrl, id);
  },

  schedule(id: number, scheduledAt: string): void {
    getDb().prepare("UPDATE posts SET status = 'scheduled', scheduled_at = ? WHERE id = ?").run(scheduledAt, id);
  },

  markPublished(id: number, tgMessageId: number): void {
    getDb().prepare(
      "UPDATE posts SET status = 'published', published_at = datetime('now'), tg_message_id = ? WHERE id = ?"
    ).run(tgMessageId, id);
  },

  countToday(): number {
    const row = getDb().prepare(
      "SELECT COUNT(*) as cnt FROM posts WHERE status = 'published' AND date(published_at) = date('now')"
    ).get() as { cnt: number };
    return row.cnt;
  },

  countByStatus(status: PostStatus): number {
    const row = getDb().prepare('SELECT COUNT(*) as cnt FROM posts WHERE status = ?').get(status) as { cnt: number };
    return row.cnt;
  },

  countTotal(): number {
    const row = getDb().prepare('SELECT COUNT(*) as cnt FROM posts').get() as { cnt: number };
    return row.cnt;
  },
};
