// Helper function to parse email message
export function parseEmailMessage(message) {
  const headers = message.payload.headers;
  const getHeader = (name) => {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  // Get email body and attachments
  let body = '';
  let attachments = [];
  let inlineImages = [];

  function extractParts(parts, isNested = false) {
    if (!parts) return;

    for (const part of parts) {
      const { mimeType, filename, body: partBody, parts: nestedParts, partId } = part;

      // Handle nested parts (multipart)
      if (nestedParts) {
        extractParts(nestedParts, true);
        continue;
      }

      // Handle attachments
      if (filename && partBody.attachmentId) {
        const attachment = {
          id: partBody.attachmentId,
          filename,
          mimeType,
          size: partBody.size,
          partId
        };

        // Check if it's an inline image (used in email body)
        const contentId = part.headers?.find(h => h.name.toLowerCase() === 'content-id')?.value;
        if (contentId) {
          attachment.contentId = contentId.replace(/[<>]/g, ''); // Remove < >
          inlineImages.push(attachment);
        } else {
          attachments.push(attachment);
        }
        continue;
      }

      // Handle email body
      if (mimeType === 'text/html' && partBody.data) {
        body = Buffer.from(partBody.data, 'base64').toString('utf-8');
      } else if (mimeType === 'text/plain' && partBody.data && !body) {
        body = Buffer.from(partBody.data, 'base64').toString('utf-8');
      }
    }
  }

  // Extract body from main payload
  if (message.payload.body.data) {
    body = Buffer.from(message.payload.body.data, 'base64').toString('utf-8');
  } else if (message.payload.parts) {
    extractParts(message.payload.parts);
  }

  // Parse date
  const dateStr = getHeader('Date');
  const date = new Date(dateStr);

  return {
    id: message.id,
    threadId: message.threadId,
    labelIds: message.labelIds || [],
    from: getHeader('From'),
    to: getHeader('To'),
    subject: getHeader('Subject'),
    date: date.toISOString(),
    snippet: message.snippet,
    body,
    unread: message.labelIds?.includes('UNREAD') || false,
    hasAttachment: attachments.length > 0 || inlineImages.length > 0,
    attachments,
    inlineImages
  };
}