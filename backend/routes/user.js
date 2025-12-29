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

  return router;
}