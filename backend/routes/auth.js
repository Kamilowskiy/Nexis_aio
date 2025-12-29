import express from 'express';

const router = express.Router();

export default function authRoutes(oauth2Client, userTokens) {
  // 1. Get authorization URL
  router.get('/google', (req, res) => {
    const url = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      prompt: 'consent'
    });
    res.json({ url });
  });

  // 2. Handle OAuth callback
  router.get('/google/callback', async (req, res) => {
    const { code } = req.query;
    
    try {
      const { tokens } = await oauth2Client.getToken(code);
      oauth2Client.setCredentials(tokens);
      
      // Store tokens with user identifier
      const userId = 'default_user'; // In production, use proper user identification
      userTokens[userId] = tokens;
      
      // Redirect to frontend with success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/email?auth=success`);
    } catch (error) {
      console.error('Error getting tokens:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/email?auth=error`);
    }
  });

  // 3. Check authentication status
  router.get('/status', (req, res) => {
    const userId = 'default_user';
    res.json({ authenticated: !!userTokens[userId] });
  });

  // 4. Get access token (for Rust client) 🦀
  router.get('/token', (req, res) => {
    const userId = 'default_user';
    const tokens = userTokens[userId];
    
    if (!tokens || !tokens.access_token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    console.log('✅ Zwracam access_token dla Rust');
    res.json({ accessToken: tokens.access_token });
  });

  // 5. Logout
  router.post('/logout', (req, res) => {
    const userId = 'default_user';
    delete userTokens[userId];
    res.json({ success: true });
  });

  return router;
}