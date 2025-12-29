use crate::types::*;
use anyhow::{Context, Result};
use reqwest::{Client, StatusCode};
use std::sync::Arc;
use tokio::sync::Semaphore;
use std::time::Duration;
use tokio::io::AsyncWriteExt;

pub const GMAIL_API_BASE: &str = "https://www.googleapis.com/gmail/v1";

pub struct GmailClient {
    pub client: Client,
    pub access_token: Arc<String>,
    pub semaphore: Arc<Semaphore>,
}

impl GmailClient {
    pub fn new(access_token: String) -> Self {
        let client = Client::builder()
            .pool_max_idle_per_host(20)
            .build()
            .expect("reqwest client build");
        Self {
            client,
            access_token: Arc::new(access_token),
            semaphore: Arc::new(Semaphore::new(8)), // limit concurrency to 8
        }
    }

    /// simple retry-send helper (exponential backoff)
    async fn send_with_retry<F>(&self, make_req: F) -> Result<reqwest::Response>
    where
        F: Fn() -> reqwest::RequestBuilder,
    {
        let max_attempts = 5u32;
        for attempt in 0..max_attempts {
            let req = make_req();
            match req.send().await {
                Ok(resp) => {
                    // Retry on 429 or 5xx
                    if resp.status() == StatusCode::TOO_MANY_REQUESTS || resp.status().is_server_error() {
                        let wait = Duration::from_millis((2u64.pow(attempt) * 250).min(10000));
                        tokio::time::sleep(wait).await;
                        continue;
                    }
                    return Ok(resp);
                }
                Err(e) => {
                    // network error - retry
                    if attempt + 1 == max_attempts {
                        return Err(anyhow::Error::new(e));
                    } else {
                        let wait = Duration::from_millis((2u64.pow(attempt) * 250).min(10000));
                        tokio::time::sleep(wait).await;
                        continue;
                    }
                }
            }
        }
        Err(anyhow::anyhow!("Retries exhausted"))
    }

    /// Fetch message list metadata only (format=metadata)
    pub async fn get_messages_metadata(&self, max_results: u32, label_ids: &str, page_token: Option<String>) -> Result<GmailMessageList> {
        let url = format!("{}/users/me/messages", GMAIL_API_BASE);
        let mut params = vec![("maxResults", max_results.to_string()), ("labelIds", label_ids.to_string())];
        if let Some(token) = page_token {
            params.push(("pageToken", token));
        }

        let make_req = || {
            self.client
                .get(&url)
                .bearer_auth(self.access_token.as_str())
                .query(&params)
        };

        let response = self.send_with_retry(make_req).await.context("Failed to fetch message list")?;
        let list: GmailMessageList = response.json().await.context("Failed to parse message list")?;
        Ok(list)
    }

    /// Get single email full body (invoked lazily)
    pub async fn get_email_full(&self, message_id: &str) -> Result<GmailMessage> {
        let _permit = self.semaphore.acquire().await.unwrap();
        let url = format!("{}/users/me/messages/{}", GMAIL_API_BASE, message_id);
        let make_req = || {
            self.client
                .get(&url)
                .bearer_auth(self.access_token.as_str())
                .query(&[("format", "full")])
        };
        let response = self.send_with_retry(make_req).await.context("Failed to fetch email")?;
        let gmail_message: GmailMessage = response
            .json()
            .await
            .context("Failed to parse email")?;
        Ok(gmail_message)
    }

    pub async fn get_history_id(&self) -> Result<String> {
        let url = format!("{}/users/me/profile", GMAIL_API_BASE);
        let resp = self
            .client
            .get(&url)
            .bearer_auth(self.access_token.as_str())
            .send()
            .await
            .context("Failed to request users.profile")?;

        if !resp.status().is_success() {
            return Err(anyhow::anyhow!("Failed to get profile: {}", resp.status()));
        }
        let v: serde_json::Value = resp.json().await.context("Failed to parse profile json")?;
        if let Some(hid) = v.get("historyId").and_then(|v| v.as_str()) {
            Ok(hid.to_string())
        } else {
            Err(anyhow::anyhow!("historyId missing in profile response"))
        }
    }


    /// Stream an attachment to file by messageId + attachmentId (writes response bytes)
    pub async fn stream_attachment_to_file(&self, message_id: &str, attachment_id: &str, out_path: &str) -> Result<()> {
        let _permit = self.semaphore.acquire().await.unwrap();
        let url = format!("{}/users/me/messages/{}/attachments/{}", GMAIL_API_BASE, message_id, attachment_id);
        let make_req = || {
            self.client
                .get(&url)
                .bearer_auth(self.access_token.as_str())
        };

        let mut res = self.send_with_retry(make_req).await.context("Failed to fetch attachment")?;
        // Stream bytes into file to avoid loading all to memory
        let mut file = tokio::fs::File::create(out_path).await?;
        while let Some(chunk) = res.chunk().await? {
            file.write_all(&chunk).await?;
        }
        file.flush().await?;
        Ok(())
    }
}