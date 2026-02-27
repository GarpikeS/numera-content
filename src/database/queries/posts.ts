import { getDb } from '../db';
import type { Post, PostStatus } from '../../types';

// Publish slots in MSK hours
const PUBLISH_SLOTS = [9, 13, 18];

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
      "SELECT * FROM posts WHERE status = 'scheduled' AND datetime(scheduled_at) <= datetime('now') ORDER BY scheduled_at"
    ).all() as Post[];
  },

  getAllScheduledFuture(): Post[] {
    return getDb().prepare(
      "SELECT * FROM posts WHERE status = 'scheduled' AND datetime(scheduled_at) > datetime('now') ORDER BY scheduled_at"
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

  /**
   * Get all occupied slot times (scheduled + published) from now onwards.
   * Returns Set of ISO strings truncated to hour for quick lookup.
   */
  getOccupiedSlots(): Set<string> {
    const rows = getDb().prepare(
      `SELECT scheduled_at FROM posts WHERE status = 'scheduled' AND scheduled_at IS NOT NULL
       UNION
       SELECT published_at FROM posts WHERE status = 'published' AND published_at IS NOT NULL AND published_at > datetime('now', '-24 hours')`
    ).all() as Array<{ scheduled_at?: string; published_at?: string }>;

    const occupied = new Set<string>();
    for (const row of rows) {
      const dt = row.scheduled_at || row.published_at;
      if (dt) {
        // Truncate to hour key: "YYYY-MM-DD HH"
        // Parse SQLite datetime format as UTC (add Z if no timezone)
        const normalized = dt.includes('T') ? dt : dt.replace(' ', 'T') + 'Z';
        const d = new Date(normalized);
        const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')} ${String(d.getUTCHours()).padStart(2, '0')}`;
        occupied.add(key);
      }
    }
    return occupied;
  },

  /**
   * Find the next free publish slot starting from now.
   * Slots are 09:00, 13:00, 18:00 MSK (06, 10, 15 UTC).
   * Skips already occupied slots. Searches up to 30 days ahead.
   */
  findNextFreeSlot(): Date {
    const occupied = this.getOccupiedSlots();
    const now = new Date();

    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      for (const mskHour of PUBLISH_SLOTS) {
        const utcHour = mskHour - 3;
        const candidate = new Date(now);
        candidate.setUTCDate(candidate.getUTCDate() + dayOffset);
        candidate.setUTCHours(utcHour, 0, 0, 0);

        // Skip past slots
        if (candidate <= now) continue;

        const key = `${candidate.getUTCFullYear()}-${String(candidate.getUTCMonth() + 1).padStart(2, '0')}-${String(candidate.getUTCDate()).padStart(2, '0')} ${String(candidate.getUTCHours()).padStart(2, '0')}`;
        if (!occupied.has(key)) {
          return candidate;
        }
      }
    }

    // Fallback: tomorrow first slot
    const fallback = new Date(now);
    fallback.setUTCDate(fallback.getUTCDate() + 1);
    fallback.setUTCHours(PUBLISH_SLOTS[0] - 3, 0, 0, 0);
    return fallback;
  },
};
