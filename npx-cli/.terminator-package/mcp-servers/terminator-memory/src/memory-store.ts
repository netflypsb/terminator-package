import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface Memory {
  key: string;
  value: string;
  tags: string[];
  metadata: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  key: string;
  value: string;
  tags: string[];
  metadata: Record<string, string>;
  score: number;
  created_at: string;
  updated_at: string;
}

export class MemoryStore {
  private db: Database.Database;

  constructor(dbPath: string) {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(dbPath);
    this.db.pragma("journal_mode = WAL");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memories (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        tags TEXT NOT NULL DEFAULT '[]',
        metadata TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_memories_updated
        ON memories(updated_at DESC);
    `);
  }

  store(
    key: string,
    value: string,
    tags: string[] = [],
    metadata: Record<string, string> = {}
  ): Memory {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO memories (key, value, tags, metadata, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        tags = excluded.tags,
        metadata = excluded.metadata,
        updated_at = excluded.updated_at
    `);

    stmt.run(key, value, JSON.stringify(tags), JSON.stringify(metadata), now, now);

    return { key, value, tags, metadata, created_at: now, updated_at: now };
  }

  retrieve(key: string): Memory | null {
    const row = this.db
      .prepare("SELECT * FROM memories WHERE key = ?")
      .get(key) as any;

    if (!row) return null;

    return {
      key: row.key,
      value: row.value,
      tags: JSON.parse(row.tags),
      metadata: JSON.parse(row.metadata),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  search(query: string, limit: number = 10): SearchResult[] {
    const lowerQuery = query.toLowerCase();
    const words = lowerQuery.split(/\s+/).filter((w) => w.length > 0);

    const rows = this.db
      .prepare("SELECT * FROM memories ORDER BY updated_at DESC")
      .all() as any[];

    const scored: SearchResult[] = [];

    for (const row of rows) {
      const keyLower = row.key.toLowerCase();
      const valueLower = row.value.toLowerCase();
      const tags: string[] = JSON.parse(row.tags);
      const tagsLower = tags.map((t: string) => t.toLowerCase());

      let score = 0;

      for (const word of words) {
        // Exact key match is highest
        if (keyLower === lowerQuery) score += 10;
        // Key contains word
        if (keyLower.includes(word)) score += 5;
        // Tag exact match
        if (tagsLower.includes(word)) score += 4;
        // Value contains word
        if (valueLower.includes(word)) score += 2;
      }

      if (score > 0) {
        scored.push({
          key: row.key,
          value: row.value,
          tags,
          metadata: JSON.parse(row.metadata),
          score,
          created_at: row.created_at,
          updated_at: row.updated_at,
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }

  list(tag?: string, limit: number = 50): Memory[] {
    let rows: any[];

    if (tag) {
      // SQLite JSON search: find rows where tags array contains the tag
      rows = this.db
        .prepare(
          `SELECT * FROM memories 
           WHERE tags LIKE ?
           ORDER BY updated_at DESC
           LIMIT ?`
        )
        .all(`%"${tag}"%`, limit);
    } else {
      rows = this.db
        .prepare(
          "SELECT * FROM memories ORDER BY updated_at DESC LIMIT ?"
        )
        .all(limit);
    }

    return rows.map((row: any) => ({
      key: row.key,
      value: row.value,
      tags: JSON.parse(row.tags),
      metadata: JSON.parse(row.metadata),
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  }

  delete(key: string): boolean {
    const result = this.db
      .prepare("DELETE FROM memories WHERE key = ?")
      .run(key);
    return result.changes > 0;
  }

  context(conversationHints: string, limit: number = 5): SearchResult[] {
    return this.search(conversationHints, limit);
  }

  close(): void {
    this.db.close();
  }
}
