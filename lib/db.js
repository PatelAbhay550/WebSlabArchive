import { createClient } from "@libsql/client";

let db;

export function getDb() {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:local.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

/**
 * Initialize the database schema. Called once on first request.
 */
let initialized = false;

export async function initDb() {
  if (initialized) return;
  const client = getDb();

  await client.batch([
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT UNIQUE,
      image TEXT,
      provider TEXT,
      provider_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS archives (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      title TEXT,
      html TEXT NOT NULL,
      thumbnail TEXT,
      description TEXT,
      user_id TEXT,
      user_name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_archives_url ON archives(url)`,
    `CREATE INDEX IF NOT EXISTS idx_archives_title ON archives(title)`,
    `CREATE INDEX IF NOT EXISTS idx_archives_created ON archives(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_archives_user ON archives(user_id)`,
  ]);

  initialized = true;
}
