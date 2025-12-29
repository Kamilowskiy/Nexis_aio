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

  return router;
}