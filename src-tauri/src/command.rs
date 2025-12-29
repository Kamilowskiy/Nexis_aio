// Tauri command handlers — thin layer over SyncManager/cache.
// Poprawiona wersja: używa snake_case dla pól EmailMessage/EmailListResponse (zgodnie z types.rs)
use crate::sync::SyncManager;
use crate::cache::Cache;
use crate::types::*;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;
use base64::engine::general_purpose;
use base64::Engine as _;
use serde::{Serialize, Deserialize};
use anyhow::Error as AnyhowError;

/// Global state for SyncManager
pub struct GmailState {
    pub sync: Arc<RwLock<Option<Arc<SyncManager>>>>,
}

impl GmailState {
    pub fn new() -> Self {
        Self {
            sync: Arc::new(RwLock::new(None)),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TodayStats {
    pub totalToday: i64,
    pub unreadToday: i64,
}

#[tauri::command]
pub async fn init_gmail_client(
    access_token: String,
    state: State<'_, GmailState>,
) -> Result<(), String> {
    let cache = Cache::new(None).map_err(|e| e.to_string())?;
    let manager = SyncManager::new(cache).await.map_err(|e| e.to_string())?;
    let manager = Arc::new(manager);
    {
        let token_store = manager.token_store.clone();
        token_store.set_token(access_token).await;
        manager.init_client_from_store().await.map_err(|e| e.to_string())?;

        if let Err(e) = manager.initial_sync(100, "INBOX").await {
            eprintln!("Initial sync failed: {}", e);
        }

        let _ = manager.start_background_sync().await;
    }
    let mut s = state.sync.write().await;
    *s = Some(manager);
    Ok(())
}

#[tauri::command]
pub async fn get_emails_rust(
    options: GetEmailsOptions,
    state: State<'_, GmailState>,
) -> Result<EmailListResponse, String> {
    let manager_arc = {
        let guard = state.sync.read().await;
        guard.as_ref().cloned().ok_or("Gmail client not initialized")?
    };

    let label_ids = options.label_ids.clone();
    let all_metas = manager_arc
        .get_cached_metadata_list(0, None, &label_ids)
        .await
        .map_err(|e| e.to_string())?;

    // diagnostyka - logujemy ile wpisów mamy w cache dla tego labela
    eprintln!("get_emails_rust: cache matched {} messages for label '{}'", all_metas.len(), label_ids);

    let mut messages: Vec<EmailMessage> = all_metas.into_iter().map(|m| {
        let headers: Vec<crate::types::GmailHeader> = serde_json::from_str(&m.headers_json).unwrap_or_default();
        let from = headers.iter().find(|h| h.name.eq_ignore_ascii_case("From")).map(|h| h.value.clone()).unwrap_or_default();
        let subject = headers.iter().find(|h| h.name.eq_ignore_ascii_case("Subject")).map(|h| h.value.clone()).unwrap_or_default();
        let date = headers.iter().find(|h| h.name.eq_ignore_ascii_case("Date")).map(|h| h.value.clone()).unwrap_or_default();
        let label_ids_vec: Vec<String> = serde_json::from_str(&m.label_ids_json).unwrap_or_default();
        let unread = label_ids_vec.iter().any(|l| l.eq_ignore_ascii_case("UNREAD"));
        EmailMessage {
            id: m.message_id.clone(),
            thread_id: m.thread_id.clone(),
            label_ids: label_ids_vec,
            from,
            to: String::new(),
            subject,
            date,
            snippet: m.snippet.clone(),
            body: String::new(),
            unread,
            has_attachment: false,
            attachments: vec![],
            inline_images: vec![],
        }
    }).collect();

    let page_size = options.max_results.unwrap_or(20) as usize;
    let start: usize = options.page_token.as_ref().and_then(|s| s.parse::<usize>().ok()).unwrap_or(0);
    let total = messages.len();
    let end = (start + page_size).min(total);
    let slice = if start >= total { vec![] } else { messages[start..end].to_vec() };
    let next_page_token = if end < total { Some(end.to_string()) } else { None };

    eprintln!("get_emails_rust: returning {} messages (start={}, end={}), next_page_token={:?}", slice.len(), start, end, next_page_token);

    Ok(EmailListResponse {
        messages: slice,
        next_page_token,
    })
}

// The rest of the commands (get_email_rust, get_mailbox_stats_rust, get_today_stats_rust, send_email_rust, etc.)
// remain unchanged from previous implementation and should continue to work as before.
/// Get single email - lazy loads full body if needed
#[tauri::command]
pub async fn get_email_rust(
    message_id: String,
    state: State<'_, GmailState>,
) -> Result<EmailMessage, String> {
    let manager_arc = {
        let guard = state.sync.read().await;
        guard.as_ref().cloned().ok_or("Gmail client not initialized")?
    };

    // make the awaited result's error type explicit to help the compiler
    manager_arc
        .fetch_full_message_lazy(&message_id)
        .await
        .map_err(|e: AnyhowError| e.to_string())
}

/// Get mailbox stats - FAST parallel implementation (computed from cache, fallback to Node.js if empty)
#[tauri::command]
pub async fn get_mailbox_stats_rust(
    state: State<'_, GmailState>,
) -> Result<MailboxStats, String> {
    // clone reference
    let manager_arc = {
        let guard = state.sync.read().await;
        guard.as_ref().cloned().ok_or("Gmail client not initialized")?
    };

    // Compute simple stats from cache
    let cached = manager_arc.cache.load_all_messages().map_err(|e| e.to_string())?;
    let mut map = std::collections::HashMap::new();
    for m in cached {
        for label in serde_json::from_str::<Vec<String>>(&m.label_ids_json).unwrap_or_default() {
            let stat = map.entry(label.clone()).or_insert(MailboxStat {
                id: label.clone(),
                name: label.clone(),
                total: 0,
                unread: 0,
            });
            stat.total += 1;
            // We could inspect headers-json to detect UNREAD and increment `unread` here
            let labels_vec: Vec<String> = serde_json::from_str(&m.label_ids_json).unwrap_or_default();
            if labels_vec.iter().any(|l| l.eq_ignore_ascii_case("UNREAD")) {
                stat.unread += 1;
            }
        }
    }

    // If cache-based map is empty, fallback to Node.js backend for stats to ensure UI has something
    if map.is_empty() {
        if let Ok(resp) = reqwest::Client::new()
            .get("http://localhost:3001/api/mailbox/stats")
            .send()
            .await
        {
            if resp.status().is_success() {
                if let Ok(node_stats) = resp.json::<MailboxStats>().await {
                    return Ok(node_stats);
                }
            }
        }
    }

    Ok(MailboxStats { stats: map })
}

/// Get "today" stats - NEW command used by frontend (get_today_stats_rust)
/// For reliability we fetch from Node.js backend endpoint /api/emails/stats/today
#[tauri::command]
pub async fn get_today_stats_rust(
    _state: State<'_, GmailState>,
) -> Result<TodayStats, String> {
    let client = reqwest::Client::new();
    let resp = client
        .get("http://localhost:3001/api/emails/stats/today")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch today stats: {}", e))?;

    if !resp.status().is_success() {
        return Err(format!("Backend returned non-success status: {}", resp.status()));
    }

    let json_val: serde_json::Value =
        resp.json().await.map_err(|e| format!("Failed to parse today stats: {}", e))?;
    // Try to map to our TodayStats shape; fall back to zeros if shape unexpected
    let total_today = json_val.get("totalToday").and_then(|v| v.as_i64()).unwrap_or(0);
    let unread_today = json_val.get("unreadToday").and_then(|v| v.as_i64()).unwrap_or(0);
    Ok(TodayStats {
        totalToday: total_today,
        unreadToday: unread_today,
    })
}

/// Get user profile
#[tauri::command]
pub async fn get_user_profile_rust(
    _state: State<'_, GmailState>,
) -> Result<UserProfile, String> {
    let resp = reqwest::Client::new()
        .get("http://localhost:3001/api/user/profile")
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let profile: UserProfile = resp.json().await.map_err(|e| e.to_string())?;
    Ok(profile)
}

/// Send email
#[tauri::command]
pub async fn send_email_rust(
    email_data: EmailData,
    state: State<'_, GmailState>,
) -> Result<String, String> {
    // clone manager reference
    let manager_arc = {
        let guard = state.sync.read().await;
        guard.as_ref().cloned().ok_or("Gmail client not initialized")?
    };

    // obtain token from inner GmailClient (clone Arc<String> to avoid holding client lock across await)
    let token_opt = {
        let client_guard = manager_arc.client.read().await;
        client_guard.as_ref().map(|c| c.access_token.clone())
    };

    if let Some(tok_arc) = token_opt {
        // Build email message
        let mut message = String::new();
        message.push_str(&format!("To: {}\r\n", email_data.to));
        if let Some(cc) = email_data.cc {
            message.push_str(&format!("Cc: {}\r\n", cc));
        }
        if let Some(bcc) = email_data.bcc {
            message.push_str(&format!("Bcc: {}\r\n", bcc));
        }
        message.push_str(&format!("Subject: {}\r\n", email_data.subject));
        message.push_str("Content-Type: text/html; charset=utf-8\r\n");
        message.push_str("\r\n");
        message.push_str(&email_data.body);
        // Encode to base64
        let encoded = general_purpose::URL_SAFE_NO_PAD.encode(message.as_bytes());
        // Send via Gmail API
        let url = format!("{}/users/me/messages/send", crate::client::GMAIL_API_BASE);
        let client_req = reqwest::Client::new();
        #[derive(serde::Serialize)]
        struct SendRequest {
            raw: String,
        }
        let res = client_req
            .post(&url)
            .bearer_auth(tok_arc.as_str())
            .json(&SendRequest { raw: encoded })
            .send()
            .await
            .map_err(|e| e.to_string())?;
        #[derive(serde::Deserialize)]
        struct SendResponse {
            id: String,
        }
        let sr: SendResponse = res.json().await.map_err(|e| e.to_string())?;
        Ok(sr.id)
    } else {
        // Fallback to Node.js backend if token not available
        let response = reqwest::Client::new()
            .post("http://localhost:3001/api/emails/send")
            .json(&email_data)
            .send()
            .await
            .map_err(|e| e.to_string())?;
        let v: serde_json::Value = response.json().await.map_err(|e| e.to_string())?;
        Ok(v
            .get("id")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string())
    }
}

/// Mark email as read/unread
#[tauri::command]
pub async fn mark_email_rust(
    message_id: String,
    read: bool,
    _state: State<'_, GmailState>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client
        .post(&format!("http://localhost:3001/api/emails/{}/mark", message_id))
        .json(&serde_json::json!({ "read": read }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err("Failed to mark".into())
    }
}

/// Delete email (move to trash)
#[tauri::command]
pub async fn delete_email_rust(
    message_id: String,
    _state: State<'_, GmailState>,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client
        .post(&format!("http://localhost:3001/api/emails/{}/trash", message_id))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if res.status().is_success() {
        Ok(())
    } else {
        Err("Failed to delete".into())
    }
}

/// Batch parse emails - for when you already have Gmail API responses
#[tauri::command]
pub fn parse_emails_batch_rust(messages_json: String) -> Result<Vec<EmailMessage>, String> {
    use crate::parser::parse_email_message;

    let gmail_messages: Vec<crate::types::GmailMessage> =
        serde_json::from_str(&messages_json).map_err(|e| e.to_string())?;

    let parsed: Vec<EmailMessage> = gmail_messages.into_iter().map(parse_email_message).collect();

    Ok(parsed)
}