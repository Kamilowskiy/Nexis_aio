import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

export default function mailboxRoutes(oauth2Client, userTokens) {
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

  // 1. Get labels
  router.get('/labels', requireAuth, async (req, res) => {
    try {
      const response = await req.gmail.users.labels.list({
        userId: 'me'
      });

      res.json(response.data.labels);
    } catch (error) {
      console.error('Error getting labels:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Get mailbox statistics (OPTIMIZED - only needed labels)
  router.get('/stats', requireAuth, async (req, res) => {
    try {
      // Tylko labelki które nas interesują (znacznie szybsze!)
      const NEEDED_LABELS = [
        'INBOX',
        'SENT', 
        'DRAFT',
        'STARRED',
        'TRASH',
        'SPAM',
        'CATEGORY_SOCIAL',
        'CATEGORY_PROMOTIONS',
      ];

      const stats = {};
      
      // Pobierz stats tylko dla potrzebnych labelek
      const requests = NEEDED_LABELS.map(labelId => 
        req.gmail.users.labels.get({
          userId: 'me',
          id: labelId
        }).catch(err => {
          // Jeśli labelka nie istnieje, zwróć null
          console.log(`Label ${labelId} not found, skipping`);
          return null;
        })
      );

      const results = await Promise.all(requests);
      
      results.forEach((result, index) => {
        if (result) {
          const labelId = NEEDED_LABELS[index];
          stats[labelId] = {
            id: labelId,
            name: labelId,
            total: result.data.messagesTotal || 0,
            unread: result.data.messagesUnread || 0
          };
        }
      });

      console.log('📊 Mailbox stats (optimized):', Object.keys(stats).length, 'labels');
      res.json(stats);
    } catch (error) {
      console.error('Error getting mailbox stats:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}