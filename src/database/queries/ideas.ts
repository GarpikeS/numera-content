import { getDb } from '../db';
import type { Idea, IdeaStatus } from '../../types';

export const ideaQueries = {
  create(text: string): Idea {
    const stmt = getDb().prepare('INSERT INTO ideas (text) VALUES (?)');
    const result = stmt.run(text);
    return this.getById(Number(result.lastInsertRowid))!;
  },

  getById(id: number): Idea | undefined {
    return getDb().prepare('SELECT * FROM ideas WHERE id = ?').get(id) as Idea | undefined;
  },

  getActive(): Idea[] {
    return getDb().prepare("SELECT * FROM ideas WHERE status = 'active' ORDER BY id DESC").all() as Idea[];
  },

  getAll(limit: number = 20): Idea[] {
    return getDb().prepare('SELECT * FROM ideas ORDER BY id DESC LIMIT ?').all(limit) as Idea[];
  },

  markUsed(id: number, postId: number): void {
    getDb().prepare("UPDATE ideas SET status = 'used', used_in_post_id = ? WHERE id = ?").run(postId, id);
  },

  updateStatus(id: number, status: IdeaStatus): void {
    getDb().prepare('UPDATE ideas SET status = ? WHERE id = ?').run(status, id);
  },

  delete(id: number): boolean {
    const result = getDb().prepare('DELETE FROM ideas WHERE id = ?').run(id);
    return result.changes > 0;
  },

  countActive(): number {
    const row = getDb().prepare("SELECT COUNT(*) as cnt FROM ideas WHERE status = 'active'").get() as { cnt: number };
    return row.cnt;
  },
};
