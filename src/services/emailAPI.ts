import { invoke } from '@tauri-apps/api/core';

const API_BASE_URL = 'http://localhost:3001';

// Types (same as before)
export interface Attachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  partId?: string;
  contentId?: string;
}

export interface EmailData {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  from: string;
  to: string;
  subject: string;
  date: string;
  snippet: string;
  body: string;
  unread: boolean;
  hasAttachment: boolean;
  attachments: Attachment[];
  inlineImages: Attachment[];
}

export interface EmailListResponse {
  messages: EmailMessage[];
  nextPageToken?: string;
}

export interface GetEmailsOptions {
  maxResults?: number;
  pageToken?: string;
  labelIds?: string;
}

export interface UserProfile {
  email: string;
  name?: string;
  picture?: string;
}

export interface Label {
  id: string;
  name: string;
  type: string;
}

export interface MailboxStats {
  [labelId: string]: {
    id: string;
    name: string;
    total: number;
    unread: number;
  };
}

class EmailAPI {
  private accessToken: string | null = null;
  private useRust: boolean = false;

  constructor() {
    // Check if running in Tauri (Rust available)
    this.useRust = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    console.log('🦀 EmailAPI initialized:', this.useRust ? 'Using Rust' : 'Using Node.js');
  }

  // ===== AUTHENTICATION =====

  async getAuthUrl(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/google`);
    const data = await response.json();
    return data.url;
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`);
      const data = await response.json();
      
      // If authenticated, get the token for Rust
      if (data.authenticated && this.useRust) {
        await this.initRustClient();
      }
      
      return data.authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  private async initRustClient(): Promise<void> {
    try {
      // Get access token from backend
      const response = await fetch(`${API_BASE_URL}/auth/token`);
      const data = await response.json();
      
      if (data.accessToken) {
        this.accessToken = data.accessToken;
        
        // Initialize Rust client
        await invoke('init_gmail_client', {
          accessToken: data.accessToken
        });
        
        console.log('✅ Rust Gmail client initialized');
      }
    } catch (error) {
      console.error('Error initializing Rust client:', error);
      this.useRust = false; // Fallback to Node.js
    }
  }

  async logout(): Promise<{ success: boolean }> {
    this.accessToken = null;
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST'
    });
    return response.json();
  }

  // ===== EMAIL OPERATIONS =====

  async getEmails(options: GetEmailsOptions = {}): Promise<EmailListResponse> {
    const { maxResults = 20, pageToken, labelIds = 'INBOX' } = options;

    // ⚡ USE RUST if available (5-10x faster!)
    if (this.useRust && this.accessToken) {
      try {
        console.time('⚡ Rust getEmails');
        const result = await invoke<EmailListResponse>('get_emails_rust', {
          options: {
            maxResults,
            pageToken,
            labelIds
          }
        });
        console.timeEnd('⚡ Rust getEmails');
        return result;
      } catch (error) {
        console.error('Rust getEmails failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    console.time('🐌 Node.js getEmails');
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      labelIds
    });
    
    if (pageToken) {
      params.append('pageToken', pageToken);
    }

    const response = await fetch(`${API_BASE_URL}/api/emails?${params}`);
    if (!response.ok) {
      throw new Error('Failed to get emails');
    }
    const result = await response.json();
    console.timeEnd('🐌 Node.js getEmails');
    return result;
  }

  async getEmail(id: string): Promise<EmailMessage> {
    // ⚡ USE RUST if available (10x faster parsing!)
    if (this.useRust && this.accessToken) {
      try {
        console.time('⚡ Rust getEmail');
        const result = await invoke<EmailMessage>('get_email_rust', {
          messageId: id
        });
        console.timeEnd('⚡ Rust getEmail');
        return result;
      } catch (error) {
        console.error('Rust getEmail failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    console.time('🐌 Node.js getEmail');
    const response = await fetch(`${API_BASE_URL}/api/emails/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get email');
    }
    const result = await response.json();
    console.timeEnd('🐌 Node.js getEmail');
    return result;
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; id: string }> {
    // ⚡ USE RUST if available
    if (this.useRust && this.accessToken) {
      try {
        const id = await invoke<string>('send_email_rust', { emailData });
        return { success: true, id };
      } catch (error) {
        console.error('Rust sendEmail failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    const response = await fetch(`${API_BASE_URL}/api/emails/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    return response.json();
  }

  async markEmail(id: string, read: boolean): Promise<{ success: boolean }> {
    // ⚡ USE RUST if available
    if (this.useRust && this.accessToken) {
      try {
        await invoke('mark_email_rust', {
          messageId: id,
          read
        });
        return { success: true };
      } catch (error) {
        console.error('Rust markEmail failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    const response = await fetch(`${API_BASE_URL}/api/emails/${id}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ read })
    });
    
    if (!response.ok) {
      throw new Error('Failed to mark email');
    }
    return response.json();
  }

  async deleteEmail(id: string): Promise<{ success: boolean }> {
    // ⚡ USE RUST if available
    if (this.useRust && this.accessToken) {
      try {
        await invoke('delete_email_rust', {
          messageId: id
        });
        return { success: true };
      } catch (error) {
        console.error('Rust deleteEmail failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    const response = await fetch(`${API_BASE_URL}/api/emails/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
    return response.json();
  }

  // ===== MAILBOX OPERATIONS =====

  async getUserProfile(): Promise<UserProfile> {
    // ⚡ USE RUST if available
    if (this.useRust && this.accessToken) {
      try {
        return await invoke<UserProfile>('get_user_profile_rust');
      } catch (error) {
        console.error('Rust getUserProfile failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    const response = await fetch(`${API_BASE_URL}/api/user/profile`);
    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }
    return response.json();
  }

  async getMailboxStats(): Promise<MailboxStats> {
    // ⚡ USE RUST if available (8x faster - parallel fetching!)
    if (this.useRust && this.accessToken) {
      try {
        console.time('⚡ Rust getMailboxStats');
        const result = await invoke<{ stats: MailboxStats }>('get_mailbox_stats_rust');
        console.timeEnd('⚡ Rust getMailboxStats');
        return result.stats;
      } catch (error) {
        console.error('Rust getMailboxStats failed, falling back to Node.js:', error);
      }
    }

    // Fallback to Node.js
    console.time('🐌 Node.js getMailboxStats');
    const response = await fetch(`${API_BASE_URL}/api/mailbox/stats`);
    if (!response.ok) {
      throw new Error('Failed to get mailbox stats');
    }
    const result = await response.json();
    console.timeEnd('🐌 Node.js getMailboxStats');
    return result;
  }

  async getLabels(): Promise<Label[]> {
    const response = await fetch(`${API_BASE_URL}/api/labels`);
    if (!response.ok) {
      throw new Error('Failed to get labels');
    }
    return response.json();
  }

  // ===== ATTACHMENTS =====

  async getAttachment(messageId: string, attachmentId: string): Promise<{ data: string; size: number }> {
    const response = await fetch(`${API_BASE_URL}/api/emails/${messageId}/attachments/${attachmentId}`);
    if (!response.ok) {
      throw new Error('Failed to get attachment');
    }
    return response.json();
  }

  getAttachmentUrl(messageId: string, attachmentId: string): string {
    return `${API_BASE_URL}/api/emails/${messageId}/attachments/${attachmentId}`;
  }
}

export default new EmailAPI();