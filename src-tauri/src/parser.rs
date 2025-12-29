use crate::types::{EmailAttachment, EmailMessage, GmailMessage, InlineImage};
use base64::{Engine as _, engine::general_purpose};

pub fn parse_email_message(message: GmailMessage) -> EmailMessage {
    // ✅ Poprawka: headers to Vec, nie Option
    let headers = &message.payload.headers;
    
    let mut attachments: Vec<EmailAttachment> = Vec::new();
    let mut inline_images: Vec<InlineImage> = Vec::new();

    let from = headers
        .iter()
        .find(|h| h.name.eq_ignore_ascii_case("From"))
        .map(|h| h.value.clone())
        .unwrap_or_default();

    let to = headers
        .iter()
        .find(|h| h.name.eq_ignore_ascii_case("To"))
        .map(|h| h.value.clone())
        .unwrap_or_default();

    let subject = headers
        .iter()
        .find(|h| h.name.eq_ignore_ascii_case("Subject"))
        .map(|h| h.value.clone())
        .unwrap_or_default();

    let date = headers
        .iter()
        .find(|h| h.name.eq_ignore_ascii_case("Date"))
        .map(|h| h.value.clone())
        .unwrap_or_default();

    let mut body = String::new();

    // ✅ Poprawka: body jest Option<GmailBody>
    if let Some(ref gmail_body) = message.payload.body {
        if let Some(ref data) = gmail_body.data {
            if let Ok(decoded) = general_purpose::URL_SAFE_NO_PAD.decode(data) {
                body = String::from_utf8_lossy(&decoded).to_string();
            }
        }
    }

    if let Some(parts) = &message.payload.parts {
        extract_parts(parts, &mut body, &mut attachments, &mut inline_images);
    }

    let unread = message.label_ids.iter().any(|l| l.eq_ignore_ascii_case("UNREAD"));
    let has_attachment = !attachments.is_empty();

    // ✅ Parse internalDate
    let internal_date = message.internal_date
        .and_then(|s| s.parse::<i64>().ok());

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
        internal_date,
    }
}

fn extract_parts(
    parts: &[crate::types::GmailPart],
    body: &mut String,
    attachments: &mut Vec<EmailAttachment>,
    inline_images: &mut Vec<InlineImage>,
) {
    for part in parts {
        let mime = &part.mime_type;

        // ✅ Poprawka: body jest Option<GmailBody>
        if let Some(ref part_body) = part.body {
            if let Some(ref attachment_id) = part_body.attachment_id {
                if let Some(ref filename) = part.filename {
                    if !filename.is_empty() {
                        let aid = attachment_id.clone();

                        if mime.starts_with("image/") {
                            if let Some(ref headers) = part.headers {
                                let cid = headers
                                    .iter()
                                    .find(|h| h.name.eq_ignore_ascii_case("Content-ID"))
                                    .map(|h| h.value.trim_matches(|c| c == '<' || c == '>').to_string());

                                if let Some(content_id) = cid {
                                    inline_images.push(InlineImage {
                                        id: aid.clone(),
                                        content_id,
                                        mime_type: mime.clone(),
                                    });
                                }
                            }
                        }

                        attachments.push(EmailAttachment {
                            id: aid,
                            filename: filename.clone(),
                            size: part_body.size,
                            mime_type: mime.clone(),
                        });
                    }
                }
            } else if mime.starts_with("text/html") || mime.starts_with("text/plain") {
                if let Some(ref data) = part_body.data {
                    if let Ok(decoded) = general_purpose::URL_SAFE_NO_PAD.decode(data) {
                        let text = String::from_utf8_lossy(&decoded).to_string();
                        if mime.starts_with("text/html") {
                            *body = text;
                        } else if body.is_empty() {
                            *body = text;
                        }
                    }
                }
            }
        }

        if let Some(ref subparts) = part.parts {
            extract_parts(subparts, body, attachments, inline_images);
        }
    }
}