use crate::types::*;
use base64::{engine::general_purpose, Engine as _};

/// Parse Gmail message into our EmailMessage format
pub fn parse_email_message(message: GmailMessage) -> EmailMessage {
    // payload.headers is Option<Vec<GmailHeader>> in types; use helper that accepts Option<&[GmailHeader]>
    let headers_opt = message.payload.headers.as_deref();

    // Extract headers efficiently
    let from = get_header(headers_opt, "From");
    let to = get_header(headers_opt, "To");
    let subject = get_header(headers_opt, "Subject");
    let date = get_header(headers_opt, "Date");

    // Parse body and attachments
    let mut body = String::new();
    let mut attachments: Vec<Attachment> = Vec::new();
    let mut inline_images: Vec<Attachment> = Vec::new();

    // Try main body first
    if let Some(data) = &message.payload.body.data {
        body = decode_base64(data);
    } else if let Some(parts) = &message.payload.parts {
        extract_parts(parts, &mut body, &mut attachments, &mut inline_images);
    }

    // Check if unread
    let unread = message.label_ids.contains(&"UNREAD".to_string());

    // Check if has attachments
    let has_attachment = !attachments.is_empty() || !inline_images.is_empty();

    EmailMessage {
        id: message.id,
        thread_id: message.thread_id,
        label_ids: message.label_ids,
        from,
        to,
        subject,
        date,
        snippet: message.snippet,
        body,
        unread,
        has_attachment,
        attachments,
        inline_images,
    }
}

/// Fast base64 decode with SIMD optimization
fn decode_base64(data: &str) -> String {
    // Gmail uses URL-safe base64 without padding
    let cleaned = data.replace('-', "+").replace('_', "/");

    general_purpose::STANDARD
        .decode(cleaned.as_bytes())
        .ok()
        .and_then(|bytes| String::from_utf8(bytes).ok())
        .unwrap_or_default()
}

/// Get header value by name (case-insensitive)
fn get_header(headers: Option<&[GmailHeader]>, name: &str) -> String {
    if let Some(hdrs) = headers {
        hdrs.iter()
            .find(|h| h.name.eq_ignore_ascii_case(name))
            .map(|h| h.value.clone())
            .unwrap_or_default()
    } else {
        String::new()
    }
}

/// Recursively extract parts from email
fn extract_parts(
    parts: &[GmailPart],
    body: &mut String,
    attachments: &mut Vec<Attachment>,
    inline_images: &mut Vec<Attachment>,
) {
    for part in parts {
        // Handle nested parts
        if let Some(nested) = &part.parts {
            extract_parts(nested, body, attachments, inline_images);
            continue;
        }

        // Handle attachments
        if let Some(filename) = &part.filename {
            // filename is Option<String> -> as ref it's &String
            if !filename.is_empty() {
                if let Some(attachment_id) = &part.body.attachment_id {
                    // Extract content-id for inline images
                    let content_id = part
                        .headers
                        .as_ref()
                        .and_then(|headers: &Vec<GmailHeader>| {
                            headers
                                .iter()
                                .find(|h| h.name.eq_ignore_ascii_case("content-id"))
                                .map(|h| h.value.trim_matches(&['<', '>'][..]).to_string())
                        });

                    // Ensure we clone attachment_id into owned String
                    let aid: String = attachment_id.clone();

                    let attachment = Attachment {
                        id: Some(aid),
                        filename: filename.clone(),
                        mime_type: part.mime_type.clone(),
                        size: part.body.size.unwrap_or(0),
                        part_id: part.part_id.clone(),
                        content_id: content_id.clone(),
                    };

                    // Inline images have content-id
                    if content_id.is_some() {
                        inline_images.push(attachment);
                    } else {
                        attachments.push(attachment);
                    }
                    continue;
                }
            }
        }

        // Extract body (prefer HTML, fallback to plain text)
        if part.mime_type == "text/html" {
            if let Some(data) = &part.body.data {
                *body = decode_base64(data);
            }
        } else if part.mime_type == "text/plain" && body.is_empty() {
            if let Some(data) = &part.body.data {
                *body = decode_base64(data);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_decode_base64() {
        let encoded = "SGVsbG8gV29ybGQh";
        let decoded = decode_base64(encoded);
        assert_eq!(decoded, "Hello World!");
    }

    #[test]
    fn test_get_header() {
        let headers = vec![
            GmailHeader {
                name: "From".to_string(),
                value: "test@example.com".to_string(),
            },
            GmailHeader {
                name: "Subject".to_string(),
                value: "Test Subject".to_string(),
            },
        ];

        assert_eq!(get_header(Some(&headers), "from"), "test@example.com");
        assert_eq!(get_header(Some(&headers), "SUBJECT"), "Test Subject");
        assert_eq!(get_header(None, "To"), "");
    }
}