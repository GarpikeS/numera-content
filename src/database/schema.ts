import type Database from 'better-sqlite3';

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      rsshub_route TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS collected_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id INTEGER NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      external_id TEXT NOT NULL,
      content TEXT NOT NULL,
      pub_date TEXT NOT NULL,
      used_in_digest_id INTEGER REFERENCES digests(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(channel_id, external_id)
    );

    CREATE TABLE IF NOT EXISTS digests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      summary TEXT NOT NULL,
      message_count INTEGER NOT NULL DEFAULT 0,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      image_url TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','pending','approved','scheduled','published','rejected')),
      source_type TEXT NOT NULL DEFAULT 'manual' CHECK(source_type IN ('digest','idea','manual','mixed')),
      digest_id INTEGER REFERENCES digests(id),
      scheduled_at TEXT,
      published_at TEXT,
      tg_message_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','used','archived')),
      used_in_post_id INTEGER REFERENCES posts(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_messages_channel ON collected_messages(channel_id);
    CREATE INDEX IF NOT EXISTS idx_messages_digest ON collected_messages(used_in_digest_id);
    CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
    CREATE INDEX IF NOT EXISTS idx_posts_scheduled ON posts(scheduled_at);
    CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
  `);
}
