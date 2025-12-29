import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';

// Import routes
import authRoutes from './routes/auth.js';
// import emailRoutes from './routes/emails.js';
import mailboxRoutes from './routes/mailbox.js';
// import userRoutes from './routes/user.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// OAuth2 Client Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
);

// Store tokens in memory (in production, use database)
let userTokens = {};

// Health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'running',
    service: 'Gmail Integration API',
    version: '1.0.0',
    endpoints: {
      auth: '/auth/*',
      // emails: '/api/emails/*',
      mailbox: '/api/mailbox/*',
      // user: '/api/user/*'
    }
  });
});

// Mount routes
app.use('/auth', authRoutes(oauth2Client, userTokens));
// app.use('/api/emails', emailRoutes(oauth2Client, userTokens));
app.use('/api/mailbox', mailboxRoutes(oauth2Client, userTokens));
// app.use('/api/user', userRoutes(oauth2Client, userTokens));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: [
      'GET /auth/google',
      'GET /auth/google/callback',
      'GET /auth/status',
      'POST /auth/logout',
      'GET /api/emails',
      'GET /api/emails/:id',
      'POST /api/emails/send',
      'POST /api/emails/:id/mark',
      'DELETE /api/emails/:id',
      'GET /api/emails/:messageId/attachments/:attachmentId',
      'GET /api/mailbox/labels',
      'GET /api/mailbox/stats',
      'GET /api/user/profile'
    ]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('💥 Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log(`📧 Gmail Integration API`);
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   - Auth:    /auth/*`);
  console.log(`   - Emails:  /api/emails/*`);
  console.log(`   - Mailbox: /api/mailbox/*`);
  console.log(`   - User:    /api/user/*`);
  console.log('================================ 🚀');
});