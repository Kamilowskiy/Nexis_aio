use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::params;
use anyhow::Result;
use std::path::PathBuf;
use serde::{Serialize, Deserialize};
use std::fs;
use dirs_next;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CachedMessage {
    pub message_id: String,
    pub thread_id: String,
    pub headers_json: String,
    pub label_ids_json: String,
    pub snippet: String,
    pub internal_date: i64, // ✅ MUST HAVE - ms timestamp
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
                    internal_date INTEGER NOT NULL,
                    synced_history_id INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_thread_id ON messages(thread_id);
                CREATE INDEX IF NOT EXISTS idx_internal_date ON messages(internal_date DESC);
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
            "INSERT INTO messages (message_id, thread_id, headers_json, label_ids_json, snippet, internal_date, synced_history_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
             ON CONFLICT(message_id) DO UPDATE SET
               thread_id=excluded.thread_id,
               headers_json=excluded.headers_json,
               label_ids_json=excluded.label_ids_json,
               snippet=excluded.snippet,
               internal_date=excluded.internal_date,
               synced_history_id=excluded.synced_history_id
            ;",
            params![
                msg.message_id,
                msg.thread_id,
                msg.headers_json,
                msg.label_ids_json,
                msg.snippet,
                msg.internal_date,
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

    // ✅ Sortowanie WĄTKÓW po lastActivity (max internalDate w wątku)
    pub fn load_threads_sorted(&self) -> Result<Vec<(String, Vec<CachedMessage>, i64)>> {
        let conn = self.conn()?;
        
        // Znajdź wszystkie wątki z ich lastActivity
        let mut stmt = conn.prepare(
            "SELECT thread_id, MAX(internal_date) as last_activity
             FROM messages
             GROUP BY thread_id
             ORDER BY last_activity DESC"
        )?;
        
        let thread_activities: Vec<(String, i64)> = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?.collect::<Result<Vec<_>, _>>()?;
        
        // Dla każdego wątku pobierz wszystkie wiadomości
        let mut threads = Vec::new();
        for (thread_id, last_activity) in thread_activities {
            let mut msg_stmt = conn.prepare(
                "SELECT message_id, thread_id, headers_json, label_ids_json, snippet, internal_date, synced_history_id
                 FROM messages
                 WHERE thread_id = ?1
                 ORDER BY internal_date ASC" // wewnątrz wątku chronologicznie
            )?;
            
            let messages: Vec<CachedMessage> = msg_stmt.query_map([&thread_id], |row| {
                Ok(CachedMessage {
                    message_id: row.get(0)?,
                    thread_id: row.get(1)?,
                    headers_json: row.get(2)?,
                    label_ids_json: row.get(3)?,
                    snippet: row.get(4)?,
                    internal_date: row.get(5)?,
                    synced_history_id: row.get(6)?,
                })
            })?.collect::<Result<Vec<_>, _>>()?;
            
            threads.push((thread_id, messages, last_activity));
        }
        
        Ok(threads)
    }

    pub fn load_all_messages(&self) -> Result<Vec<CachedMessage>> {
        let conn = self.conn()?;
        let mut stmt = conn.prepare(
            "SELECT message_id, thread_id, headers_json, label_ids_json, snippet, internal_date, synced_history_id
             FROM messages
             ORDER BY internal_date DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(CachedMessage {
                message_id: row.get(0)?,
                thread_id: row.get(1)?,
                headers_json: row.get(2)?,
                label_ids_json: row.get(3)?,
                snippet: row.get(4)?,
                internal_date: row.get(5)?,
                synced_history_id: row.get(6)?,
            })
        })?;

        let mut messages = Vec::new();
        for r in rows {
            messages.push(r?);
        }
        
        Ok(messages)
    }

    pub fn clear_all_messages(&self) -> Result<()> {
        let conn = self.conn()?;
        conn.execute("DELETE FROM messages", [])?;
        eprintln!("🗑️  Cleared all messages from cache");
        Ok(())
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