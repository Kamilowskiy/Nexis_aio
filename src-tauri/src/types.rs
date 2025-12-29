//! Shared types used by the Rust Tauri backend.
//! These types model the subset of Gmail API JSON we consume and the internal EmailMessage/cache shapes.

use serde::{Deserialize, Serialize};

/// Response when listing messages (metadata)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailMessageList {
    #[serde(default)]
    pub messages: Option<Vec<GmailMessageRef>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
    #[serde(rename = "resultSizeEstimate")]
    pub result_size_estimate: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailMessageRef {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
}

/// Gmail message payload/body header structures (subset)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailMessage {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
    #[serde(rename = "labelIds", default)]
    pub label_ids: Vec<String>,
    pub snippet: String,
    pub payload: GmailPart, // top-level payload
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailPart {
    #[serde(rename = "partId", default)]
    pub part_id: Option<String>,

    #[serde(rename = "mimeType", default)]
    pub mime_type: String,

    #[serde(default)]
    pub filename: Option<String>,

    #[serde(default)]
    pub headers: Option<Vec<GmailHeader>>,

    #[serde(default)]
    pub body: GmailBody,

    #[serde(default)]
    pub parts: Option<Vec<GmailPart>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GmailBody {
    #[serde(default)]
    pub size: Option<u32>,

    /// Base64url data when present (Gmail returns urlsafe base64 without padding)
    #[serde(default)]
    pub data: Option<String>,

    /// If this body refers to an attachment, attachmentId is provided
    #[serde(rename = "attachmentId", default)]
    pub attachment_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

/// Gmail label response (for mailbox stats)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GmailLabelResponse {
    pub id: String,
    pub name: String,
    #[serde(rename = "messagesTotal")]
    pub messages_total: Option<i64>,
    #[serde(rename = "messagesUnread")]
    pub messages_unread: Option<i64>,
}

/// Internal representation of parsed Email message (what frontend expects from Rust)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailMessage {
    pub id: String,
    pub thread_id: String,
    #[serde(default)]
    pub label_ids: Vec<String>,
    pub from: String,
    pub to: String,
    pub subject: String,
    pub date: String,
    pub snippet: String,
    pub body: String,
    pub unread: bool,
    pub has_attachment: bool,
    #[serde(default)]
    pub attachments: Vec<Attachment>,
    #[serde(default)]
    pub inline_images: Vec<Attachment>,
}

/// Attachment info used by frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Attachment {
    #[serde(rename = "id")]
    pub id: Option<String>,
    pub filename: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    #[serde(default)]
    pub size: u32,
    #[serde(rename = "partId", default)]
    pub part_id: Option<String>,
    #[serde(rename = "contentId", default)]
    pub content_id: Option<String>,
}

/// Mailbox stat used in responses
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MailboxStat {
    pub id: String,
    pub name: String,
    pub total: i64,
    pub unread: i64,
}

/// MailboxStats wrapper used across code (matches previous structure)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MailboxStats {
    pub stats: std::collections::HashMap<String, MailboxStat>,
}

/// User profile (from Google oauth userinfo)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub email: String,
    pub name: Option<String>,
    pub picture: Option<String>,
}

/// Options passed from frontend to get emails
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetEmailsOptions {
    #[serde(rename = "maxResults")]
    pub max_results: Option<u32>,
    #[serde(rename = "pageToken")]
    pub page_token: Option<String>,
    #[serde(rename = "labelIds")]
    pub label_ids: String,
}

/// EmailData shape for sending
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailData {
    pub to: String,
    pub subject: String,
    pub body: String,
    pub cc: Option<String>,
    pub bcc: Option<String>,
}

/// EmailListResponse returned by get_emails_rust (metadata-only messages)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EmailListResponse {
    pub messages: Vec<EmailMessage>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}