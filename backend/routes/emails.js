import express from 'express';
import { google } from 'googleapis';
import { parseEmailMessage } from '../utils/emailParser.js';

const router = express.Router();

export default function emailRoutes(oauth2Client, userTokens) {
  // Middleware to check authentication
  const requireAuth = (req, res, next) => {
    const userId = 'default_user';
    if (!userTokens[userId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    oauth2Client.setCredentials(userTokens[userId]);
    req.gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    next();
  };

  // 1. Get emails list
  router.get('/', requireAuth, async (req, res) => {
    try {
      const { maxResults = 20, pageToken, labelIds = 'INBOX' } = req.query;
      
      const response = await req.gmail.users.messages.list({
        userId: 'me',
        maxResults: parseInt(maxResults),
        pageToken,
        labelIds: labelIds.split(',')
      });

      // Get full message details for each email
      const messages = await Promise.all(
        (response.data.messages || []).map(async (message) => {
          const details = await req.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'full'
          });
          return parseEmailMessage(details.data);
        })
      );

      res.json({
        messages,
        nextPageToken: response.data.nextPageToken
      });
    } catch (error) {
      console.error('Error getting emails:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Get single email
  router.get('/:id', requireAuth, async (req, res) => {
    try {
      const response = await req.gmail.users.messages.get({
        userId: 'me',
        id: req.params.id,
        format: 'full'
      });

      res.json(parseEmailMessage(response.data));
    } catch (error) {
      console.error('Error getting email:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Send email
  router.post('/send', requireAuth, async (req, res) => {
    try {
      const { to, subject, body, cc, bcc } = req.body;
      
      // Create email message
      const emailLines = [
        `To: ${to}`,
        subject && `Subject: ${subject}`,
        cc && `Cc: ${cc}`,
        bcc && `Bcc: ${bcc}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        body
      ].filter(Boolean);
      
      const email = emailLines.join('\n');
      const encodedEmail = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      const response = await req.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedEmail
        }
      });

      res.json({ success: true, id: response.data.id });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Mark email as read/unread
  router.post('/:id/mark', requireAuth, async (req, res) => {
    try {
      const { read } = req.body;
      const { id } = req.params;
      
      await req.gmail.users.messages.modify({
        userId: 'me',
        id,
        requestBody: {
          removeLabelIds: read ? ['UNREAD'] : [],
          addLabelIds: read ? [] : ['UNREAD']
        }
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking email:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Delete email (move to trash)
  router.delete('/:id', requireAuth, async (req, res) => {
    try {
      await req.gmail.users.messages.trash({
        userId: 'me',
        id: req.params.id
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting email:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Get attachment
  router.get('/:messageId/attachments/:attachmentId', requireAuth, async (req, res) => {
    try {
      const { messageId, attachmentId } = req.params;
      
      // Get attachment data
      const attachment = await req.gmail.users.messages.attachments.get({
        userId: 'me',
        messageId,
        id: attachmentId
      });

      // Get message to find filename and mimeType
      const message = await req.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      // Find the part with this attachment
      let filename = 'attachment';
      let mimeType = 'application/octet-stream';

      function findAttachment(parts) {
        if (!parts) return;
        for (const part of parts) {
          if (part.body?.attachmentId === attachmentId) {
            filename = part.filename || filename;
            mimeType = part.mimeType || mimeType;
            return;
          }
          if (part.parts) {
            findAttachment(part.parts);
          }
        }
      }

      findAttachment([message.data.payload]);

      // Decode base64 data
      const data = Buffer.from(attachment.data.data, 'base64');

      // Set headers
      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', data.length);

      res.send(data);
    } catch (error) {
      console.error('Error getting attachment:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}