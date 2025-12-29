use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GmailMessage {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
    #[serde(rename = "labelIds")]
    pub label_ids: Vec<String>,
    pub snippet: String,
    #[serde(rename = "internalDate")]
    pub internal_date: Option<String>,
    pub payload: GmailPayload,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GmailPayload {
    pub headers: Vec<GmailHeader>,
    pub parts: Option<Vec<GmailPart>>,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub body: Option<GmailBody>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GmailHeader {
    pub name: String,
    pub value: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GmailPart {
    #[serde(rename = "mimeType")]
    pub mime_type: String,
    pub body: Option<GmailBody>,
    pub parts: Option<Vec<GmailPart>>,
    pub headers: Option<Vec<GmailHeader>>,
    #[serde(rename = "partId")]
    pub part_id: Option<String>,
    pub filename: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GmailBody {
    pub size: i64,
    #[serde(rename = "attachmentId")]
    pub attachment_id: Option<String>,
    pub data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailMessageList {
    pub messages: Option<Vec<GmailMessageRef>>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct GmailMessageRef {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
}

// ✅ Dodaj Clone dla EmailAttachment
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmailAttachment {
    pub id: String,
    pub filename: String,
    pub size: i64,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
}

// ✅ Dodaj Clone dla InlineImage
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InlineImage {
    pub id: String,
    #[serde(rename = "contentId")]
    pub content_id: String,
    #[serde(rename = "mimeType")]
    pub mime_type: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmailThread {
    pub thread_id: String,
    pub messages: Vec<EmailMessage>,
    pub last_activity: i64,
    pub subject: String,
    pub snippet: String,
    pub from: String,
    pub date: String,
    pub unread: bool,
    pub has_attachment: bool,
    pub label_ids: Vec<String>,
    pub message_count: usize,
}

// ✅ Dodaj Clone dla EmailMessage
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EmailMessage {
    pub id: String,
    #[serde(rename = "threadId")]
    pub thread_id: String,
    #[serde(rename = "labelIds")]
    pub label_ids: Vec<String>,
    pub from: String,
    pub to: String,
    pub subject: String,
    pub date: String,
    pub snippet: String,
    pub body: String,
    pub unread: bool,
    #[serde(rename = "hasAttachment")]
    pub has_attachment: bool,
    pub attachments: Vec<EmailAttachment>,
    #[serde(rename = "inlineImages")]
    pub inline_images: Vec<InlineImage>,
    #[serde(rename = "internalDate")]
    pub internal_date: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailListResponse {
    pub messages: Vec<EmailMessage>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThreadListResponse {
    pub threads: Vec<EmailThread>,
    #[serde(rename = "nextPageToken")]
    pub next_page_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserProfile {
    #[serde(rename = "emailAddress")]
    pub email: String,
    #[serde(rename = "messagesTotal")]
    pub messages_total: u32,
    #[serde(rename = "threadsTotal")]
    pub threads_total: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MailboxStat {
    pub id: String,
    pub name: String,
    pub total: usize,
    pub unread: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MailboxStats {
    pub stats: std::collections::HashMap<String, MailboxStat>,
}

// ✅ Dodaj brakujące typy dla command.rs
#[derive(Debug, Serialize, Deserialize)]
pub struct GetEmailsOptions {
    #[serde(rename = "labelIds")]
    pub label_ids: String,
    #[serde(rename = "maxResults")]
    pub max_results: Option<u32>,
    #[serde(rename = "pageToken")]
    pub page_token: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailData {
    pub to: String,
    pub subject: String,
    pub body: String,
    pub cc: Option<String>,   // ✅ dodaj
    pub bcc: Option<String>,  // ✅ dodaj
}