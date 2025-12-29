use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::params;
use anyhow::Result;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use std::fs;
use dirs_next;

/// Cached message - persisted to SQLite
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CachedMessage {
    pub message_id: String,
    pub thread_id: String,
    pub headers_json: String,
    pub label_ids_json: String,
    pub snippet: String,
    pub synced_history_id: Option<i64>,
}

pub struct Cache {
    pool: Pool<SqliteConnectionManager>,
}

impl Cache {
    pub fn new(path: Option<PathBuf>) -> Result<Self> {
        let db_path = match path {
            Some(p) => p,
            None => {
                let mut base = dirs_next::data_local_dir()
                    .or_else(|| dirs_next::data_dir())
                    .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));
                base.push("NexDeck");
                fs::create_dir_all(&base)?;
                base.push("nexdeck_cache.sqlite3");
                base
            }
        };

        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let manager = SqliteConnectionManager::file(db_path);
        let pool = Pool::builder().build(manager)?;
        {
            let conn = pool.get()?;
            conn.execute_batch(
                "BEGIN;
                CREATE TABLE IF NOT EXISTS messages (
                    message_id TEXT PRIMARY KEY,
                    thread_id TEXT NOT NULL,
                    headers_json TEXT NOT NULL,
                    label_ids_json TEXT NOT NULL,
                    snippet TEXT,
                    synced_history_id INTEGER
                );
                CREATE TABLE IF NOT EXISTS meta (
                    key TEXT PRIMARY KEY,
                    value TEXT
                );
                COMMIT;",
            )?;
        }
        Ok(Self { pool })
    }

    fn conn(&self) -> Result<PooledConnection<SqliteConnectionManager>> {
        Ok(self.pool.get()?)
    }

    pub fn upsert_message(&self, msg: &CachedMessage) -> Result<()> {
        let conn = self.conn()?;
        conn.execute(
            "INSERT INTO messages (message_id, thread_id, headers_json, label_ids_json, snippet, synced_history_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(message_id) DO UPDATE SET
               thread_id=excluded.thread_id,
               headers_json=excluded.headers_json,
               label_ids_json=excluded.label_ids_json,
               snippet=excluded.snippet,
               synced_history_id=excluded.synced_history_id
            ;",
            params![
                msg.message_id,
                msg.thread_id,
                msg.headers_json,
                msg.label_ids_json,
                msg.snippet,
                msg.synced_history_id
            ],
        )?;
        Ok(())
    }

    pub fn delete_message(&self, message_id: &str) -> Result<()> {
        let conn = self.conn()?;
        conn.execute("DELETE FROM messages WHERE message_id = ?1", params![message_id])?;
        Ok(())
    }

    // ===== zmiana: sortowanie po ROWID DESC, czyli najnowsze w pierwszej kolejności =====
    pub fn load_all_messages(&self) -> Result<Vec<CachedMessage>> {
        let conn = self.conn()?;
        let mut stmt = conn.prepare(
            "SELECT message_id, thread_id, headers_json, label_ids_json, snippet, synced_history_id
             FROM messages
             ORDER BY ROWID DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(CachedMessage {
                message_id: row.get(0)?,
                thread_id: row.get(1)?,
                headers_json: row.get(2)?,
                label_ids_json: row.get(3)?,
                snippet: row.get(4)?,
                synced_history_id: row.get(5)?,
            })
        })?;

        let mut res = Vec::new();
        for r in rows {
            res.push(r?);
        }
        Ok(res)
    }

    pub fn set_meta(&self, key: &str, value: &str) -> Result<()> {
        let conn = self.conn()?;
        conn.execute(
            "INSERT INTO meta(key, value) VALUES (?1, ?2)
             ON CONFLICT(key) DO UPDATE SET value=excluded.value;",
            params![key, value],
        )?;
        Ok(())
    }

    pub fn get_meta(&self, key: &str) -> Result<Option<String>> {
        let conn = self.conn()?;
        let mut stmt = conn.prepare("SELECT value FROM meta WHERE key = ?1")?;
        let mut rows = stmt.query_map(params![key], |r| r.get::<_, String>(0))?;
        if let Some(r) = rows.next() {
            Ok(Some(r?))
        } else {
            Ok(None)
        }
    }

    pub fn delete_meta(&self, key: &str) -> Result<()> {
        let conn = self.conn()?;
        conn.execute("DELETE FROM meta WHERE key = ?1", params![key])?;
        Ok(())
    }
}