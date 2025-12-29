use crate::client::GmailClient;
use crate::types::*;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

// Global state for Gmail client
pub struct GmailState {
    pub client: Arc<RwLock<Option<GmailClient>>>,
}

impl GmailState {
    pub fn new() -> Self {
        Self {
            client: Arc::new(RwLock::new(None)),
        }
    }
}

/// Initialize Gmail client with access token
#[tauri::command]
pub async fn init_gmail_client(
    access_token: String,
    state: State<'_, GmailState>,
) -> Result<(), String> {
    let client = GmailClient::new(access_token);
    let mut client_lock = state.client.write().await;
    *client_lock = Some(client);
    Ok(())
}

/// Get emails - FAST Rust implementation
#[tauri::command]
pub async fn get_emails_rust(
    options: GetEmailsOptions,
    state: State<'_, GmailState>,
) -> Result<EmailListResponse, String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .get_emails(options)
        .await
        .map_err(|e| e.to_string())
}

/// Get single email - FAST Rust implementation
#[tauri::command]
pub async fn get_email_rust(
    message_id: String,
    state: State<'_, GmailState>,
) -> Result<EmailMessage, String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .get_email(&message_id)
        .await
        .map_err(|e| e.to_string())
}

/// Get mailbox stats - FAST parallel implementation
#[tauri::command]
pub async fn get_mailbox_stats_rust(
    state: State<'_, GmailState>,
) -> Result<MailboxStats, String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .get_mailbox_stats()
        .await
        .map_err(|e| e.to_string())
}

/// Get user profile
#[tauri::command]
pub async fn get_user_profile_rust(
    state: State<'_, GmailState>,
) -> Result<UserProfile, String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .get_user_profile()
        .await
        .map_err(|e| e.to_string())
}

/// Send email
#[tauri::command]
pub async fn send_email_rust(
    email_data: EmailData,
    state: State<'_, GmailState>,
) -> Result<String, String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .send_email(email_data)
        .await
        .map_err(|e| e.to_string())
}

/// Mark email as read/unread
#[tauri::command]
pub async fn mark_email_rust(
    message_id: String,
    read: bool,
    state: State<'_, GmailState>,
) -> Result<(), String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .mark_email(&message_id, read)
        .await
        .map_err(|e| e.to_string())
}

/// Delete email
#[tauri::command]
pub async fn delete_email_rust(
    message_id: String,
    state: State<'_, GmailState>,
) -> Result<(), String> {
    let client_lock = state.client.read().await;
    let client = client_lock
        .as_ref()
        .ok_or("Gmail client not initialized")?;
    
    client
        .delete_email(&message_id)
        .await
        .map_err(|e| e.to_string())
}

/// Batch parse emails - for when you already have Gmail API responses
#[tauri::command]
pub fn parse_emails_batch_rust(messages_json: String) -> Result<Vec<EmailMessage>, String> {
    use crate::parser::parse_email_message;
    
    let gmail_messages: Vec<crate::types::GmailMessage> =
        serde_json::from_str(&messages_json).map_err(|e| e.to_string())?;
    
    // Parse all emails (FAST!)
    let parsed: Vec<EmailMessage> = gmail_messages
        .into_iter()
        .map(parse_email_message)
        .collect();
    
    Ok(parsed)
}