// Pełny plik sync.rs (zawiera poprawki opisane powyżej)

use crate::cache::{Cache, CachedMessage};
use crate::client::GmailClient;
use crate::types::*;
use crate::parser::parse_email_message;
use anyhow::{Result, Context};
use std::sync::Arc;
use tokio::sync::{RwLock, Semaphore};
use tokio::task::JoinHandle;
use reqwest::Client as HttpClient;
use reqwest::StatusCode;
use std::time::Instant;
use futures::stream::{self, StreamExt};

#[derive(Clone)]
pub struct TokenStore {
    pub token: Arc<RwLock<Option<(String, Instant)>>>,
    pub http: HttpClient,
}

impl TokenStore {
    pub fn new() -> Self {
        Self {
            token: Arc::new(RwLock::new(None)),
            http: HttpClient::new(),
        }
    }

    pub async fn get_token(&self) -> Result<Option<String>> {
        {
            let guard = self.token.read().await;
            if let Some((tok, instant)) = &*guard {
                if instant.elapsed().as_secs() < 50 * 60 {
                    return Ok(Some(tok.clone()));
                }
            }
        }
        let resp = self.http.get("http://localhost:3001/auth/token").send().await?;
        if resp.status().is_success() {
            let v: serde_json::Value = resp.json().await?;
            if let Some(at) = v.get("accessToken").and_then(|s| s.as_str()) {
                let mut guard = self.token.write().await;
                *guard = Some((at.to_string(), Instant::now()));
                return Ok(Some(at.to_string()));
            }
        }
        Ok(None)
    }

    pub async fn set_token(&self, token: String) {
        let mut guard = self.token.write().await;
        *guard = Some((token, Instant::now()));
    }
}

pub struct SyncManager {
    pub cache: Arc<Cache>,
    pub client: Arc<RwLock<Option<GmailClient>>>,
    pub token_store: TokenStore,
    pub bg_handle: Arc<RwLock<Option<JoinHandle<()>>>>,
    pub prefetch_sem: Arc<Semaphore>,
}

impl SyncManager {
    pub async fn new(cache: Cache) -> Result<Self> {
        let token_store = TokenStore::new();
        let client = Arc::new(RwLock::new(None));
        let mgr = Self {
            cache: Arc::new(cache),
            client,
            token_store,
            bg_handle: Arc::new(RwLock::new(None)),
            prefetch_sem: Arc::new(Semaphore::new(4)),
        };
        Ok(mgr)
    }

    pub async fn init_client_from_store(&self) -> Result<()> {
        if let Some(tok) = self.token_store.get_token().await? {
            let g = GmailClient::new(tok);
            let mut guard = self.client.write().await;
            *guard = Some(g);
            Ok(())
        } else {
            anyhow::bail!("No access token available");
        }
    }

    /// One-shot initial sync: fetch metadata + full messages (best-effort) and store historyId
    pub async fn initial_sync(&self, max_results: u32, label_ids: &str) -> Result<()> {
        if self.client.read().await.is_none() {
            if let Err(e) = self.init_client_from_store().await {
                anyhow::bail!("Failed to init client for initial sync: {}", e);
            }
        }
        let client_guard = self.client.read().await;
        let client = client_guard.as_ref().ok_or_else(|| anyhow::anyhow!("Gmail client not initialized"))?;

        // fetch list
        let list = client.get_messages_metadata(max_results, label_ids, None).await.context("Failed to fetch message list for initial sync")?;
        let refs = list.messages.unwrap_or_default();

        // fetch profile to get historyId and store it
        if let Ok(hid) = client.get_history_id().await {
            let _ = self.cache.set_meta("last_history_id", &hid);
        }

        // fetch full messages parallel
        let messages_fut = stream::iter(refs.into_iter())
            .map(|msg_ref| {
                let cli = client;
                async move {
                    match cli.get_email_full(&msg_ref.id).await {
                        Ok(full) => Some(full),
                        Err(e) => {
                            eprintln!("Initial sync: error fetching message {}: {}", msg_ref.id, e);
                            None
                        }
                    }
                }
            })
            .buffer_unordered(8);

        tokio::pin!(messages_fut);

        while let Some(opt_msg) = messages_fut.next().await {
            if let Some(full) = opt_msg {
                let headers_json = serde_json::to_string(&full.payload.headers).unwrap_or_default();
                let labels_json = serde_json::to_string(&full.label_ids).unwrap_or_default();
                let cached = CachedMessage {
                    message_id: full.id.clone(),
                    thread_id: full.thread_id.clone(),
                    headers_json,
                    label_ids_json: labels_json,
                    snippet: full.snippet.clone(),
                    synced_history_id: None,
                };
                if let Err(e) = self.cache.upsert_message(&cached) {
                    eprintln!("Initial sync: failed to upsert message {}: {}", full.id, e);
                }
            }
        }

        Ok(())
    }

    pub async fn start_background_sync(&self) -> Result<()> {
        let cache = Arc::clone(&self.cache);
        let client_lock = Arc::clone(&self.client);
        let token_store = self.token_store.clone();

        let handle = tokio::spawn(async move {
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(20)).await;

                if client_lock.read().await.is_none() {
                    if let Ok(Some(tok)) = token_store.get_token().await {
                        let new_client = GmailClient::new(tok);
                        *client_lock.write().await = Some(new_client);
                    } else {
                        continue;
                    }
                }

                if let Some(ref client) = *client_lock.read().await {
                    // read last_history_id defensively
                    let last_history_opt = match cache.get_meta("last_history_id") {
                        Ok(Some(s)) if !s.trim().is_empty() => {
                            match s.trim().parse::<i64>() {
                                Ok(v) => Some(v),
                                Err(_) => {
                                    let _ = cache.delete_meta("last_history_id");
                                    None
                                }
                            }
                        }
                        _ => None,
                    };

                    if last_history_opt.is_none() {
                        eprintln!("No valid last_history_id — skipping history API call this iteration.");
                        continue;
                    }

                    let start_h = last_history_opt.unwrap();
                    let url = format!("{}/users/me/history", crate::client::GMAIL_API_BASE);
                    let http = reqwest::Client::new();
                    let req = http.get(&url).bearer_auth(client.access_token.as_str()).query(&[("startHistoryId", start_h.to_string())]);

                    match req.send().await {
                        Ok(resp) => {
                            if resp.status() == StatusCode::BAD_REQUEST {
                                if let Ok(text) = resp.text().await {
                                    eprintln!("History list 400 response body: {}", text);
                                } else {
                                    eprintln!("History list returned 400 Bad Request (no body)");
                                }

                                let _ = cache.delete_meta("last_history_id");
                                eprintln!("History startHistoryId invalid — performing full recovery sync (initial fetch)");

                                if let Ok(list) = client.get_messages_metadata(200, "INBOX", None).await {
                                    let refs = list.messages.unwrap_or_default();
                                    let fetches = stream::iter(refs.into_iter())
                                        .map(|msg_ref| {
                                            let cli = client;
                                            async move {
                                                match cli.get_email_full(&msg_ref.id).await {
                                                    Ok(full) => Some(full),
                                                    Err(e) => {
                                                        eprintln!("Recovery sync: error fetching {}: {}", msg_ref.id, e);
                                                        None
                                                    }
                                                }
                                            }
                                        })
                                        .buffer_unordered(8);

                                    tokio::pin!(fetches);
                                    while let Some(opt_full) = fetches.next().await {
                                        if let Some(full) = opt_full {
                                            let headers_json = serde_json::to_string(&full.payload.headers).unwrap_or_default();
                                            let labels_json = serde_json::to_string(&full.label_ids).unwrap_or_default();
                                            let cached = CachedMessage {
                                                message_id: full.id.clone(),
                                                thread_id: full.thread_id.clone(),
                                                headers_json,
                                                label_ids_json: labels_json,
                                                snippet: full.snippet.clone(),
                                                synced_history_id: None,
                                            };
                                            if let Err(e) = cache.upsert_message(&cached) {
                                                eprintln!("Recovery sync: failed to upsert {}: {}", full.id, e);
                                            }
                                        }
                                    }
                                } else {
                                    eprintln!("Recovery sync: failed to list messages");
                                }

                                continue;
                            }

                            if resp.status().is_success() {
                                if let Ok(json) = resp.json::<serde_json::Value>().await {
                                    if let Some(histories) = json.get("history") {
                                        for item in histories.as_array().unwrap_or(&vec![]) {
                                            if let Some(added) = item.get("messagesAdded") {
                                                for m in added.as_array().unwrap_or(&vec![]) {
                                                    if let Some(msg) = m.get("message") {
                                                        if let Some(id) = msg.get("id").and_then(|v| v.as_str()) {
                                                            if let Ok(full) = client.get_email_full(id).await {
                                                                let headers_json = serde_json::to_string(&full.payload.headers).unwrap_or_default();
                                                                let labels_json = serde_json::to_string(&full.label_ids).unwrap_or_default();
                                                                let cached = CachedMessage {
                                                                    message_id: full.id.clone(),
                                                                    thread_id: full.thread_id.clone(),
                                                                    headers_json,
                                                                    label_ids_json: labels_json,
                                                                    snippet: full.snippet.clone(),
                                                                    synced_history_id: json.get("historyId").and_then(|h| h.as_i64()),
                                                                };
                                                                let _ = cache.upsert_message(&cached);
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                            if let Some(deleted) = item.get("messagesDeleted") {
                                                for m in deleted.as_array().unwrap_or(&vec![]) {
                                                    if let Some(msg) = m.get("message") {
                                                        if let Some(id) = msg.get("id").and_then(|v| v.as_str()) {
                                                            let _ = cache.delete_message(id);
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    if let Some(hid) = json.get("historyId").and_then(|v| v.as_str()) {
                                        let _ = cache.set_meta("last_history_id", hid);
                                    }
                                }
                            } else {
                                eprintln!("History list returned error: {}", resp.status());
                            }
                        }
                        Err(e) => {
                            eprintln!("Error fetching history list: {}", e);
                        }
                    }
                }
            }
        });

        *self.bg_handle.write().await = Some(handle);
        Ok(())
    }

    pub async fn get_cached_metadata_list(&self, _max_results: u32, _page_token: Option<String>, label_ids: &str) -> Result<Vec<CachedMessage>> {
        let items = self.cache.load_all_messages()?;
        // Filter by label_ids (simple contains logic)
        let filtered: Vec<CachedMessage> = items.into_iter().filter(|m| {
            let labels: Vec<String> = serde_json::from_str(&m.label_ids_json).unwrap_or_default();
            // if label_ids is empty -> include all
            if label_ids.is_empty() { return true; }
            // allow comma-separated labels (e.g., "INBOX,STARRED")
            let requested: Vec<&str> = label_ids.split(',').map(|s| s.trim()).filter(|s| !s.is_empty()).collect();
            if requested.is_empty() { return true; }
            for req in requested {
                // direct match
                if labels.iter().any(|l| l.eq_ignore_ascii_case(req)) {
                    return true;
                }
            }
            false
        }).collect();
        Ok(filtered)
    }

    pub async fn fetch_full_message_lazy(&self, message_id: &str) -> Result<EmailMessage> {
        if self.client.read().await.is_none() {
            self.init_client_from_store().await?;
        }
        if let Some(ref client) = *self.client.read().await {
            let gmail_message = client.get_email_full(message_id).await?;
            Ok(parse_email_message(gmail_message))
        } else {
            anyhow::bail!("Gmail client not initialized");
        }
    }

    pub async fn prefetch_bodies(&self, message_ids: Vec<String>) {
        let sem = self.prefetch_sem.clone();
        let client_clone = self.client.clone();
        for id in message_ids {
            let permit = sem.clone().acquire_owned().await.unwrap();
            let client_ref = client_clone.clone();
            tokio::spawn(async move {
                if let Some(ref client) = *client_ref.read().await {
                    let _ = client.get_email_full(&id).await;
                }
                drop(permit);
            });
        }
    }
}