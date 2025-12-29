import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

export default function userRoutes(oauth2Client, userTokens) {
  // Middleware to check authentication
  const requireAuth = (req, res, next) => {
    const userId = 'default_user';
    if (!userTokens[userId]) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    oauth2Client.setCredentials(userTokens[userId]);
    next();
  };

  // Get user profile
  router.get('/profile', requireAuth, async (req, res) => {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data } = await oauth2.userinfo.get();
      
      res.json(data);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}