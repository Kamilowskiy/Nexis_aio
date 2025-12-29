import { invoke } from '@tauri-apps/api/core';

const API_BASE_URL = 'http://localhost:3001';

// Types
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

/**
 * EmailAPI - zoptymalizowana wersja z lepszym cache management
 */
class EmailAPI {
  private accessToken: string | null = null;
  private useRust: boolean = false;
  private rustInitialized: boolean = false;

  // ✅ NOWY SYSTEM CACHE - per-label cache
  private labelCache: Map<string, {
    messages: EmailMessage[];
    fetchedAt: number;
    nextPageToken?: string;
  }> = new Map();

  private bodyCache: Map<string, EmailMessage> = new Map();
  private cacheTTL = 30 * 1000; // 30s dla metadata
  private bodyCacheTTL = 5 * 60 * 1000; // 5min dla body

  // Pending requests tracking (avoid duplicate requests)
  private pendingRequests: Map<string, Promise<any>> = new Map();

  constructor() {
    this.useRust = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    console.log('🦀 EmailAPI initialized:', this.useRust ? 'Using Rust' : 'Using Node.js');
  }

  // ===== AUTH / INIT =====

  async getAuthUrl(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/google`);
    const data = await response.json();
    return data.url;
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`);
      const data = await response.json();

      if (data.authenticated && this.useRust && !this.rustInitialized) {
        await this.initRustClient();
      }

      return data.authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  async initRustClient(): Promise<void> {
    if (!this.useRust) {
      console.log('❌ Rust not available, skipping init');
      return;
    }
    if (this.rustInitialized) {
      console.log('✅ Rust client already initialized');
      return;
    }

    // ✅ Avoid duplicate initialization
    const initKey = 'rust-init';
    if (this.pendingRequests.has(initKey)) {
      console.log('⏳ Rust initialization already in progress...');
      return this.pendingRequests.get(initKey)!;
    }

    const initPromise = (async () => {
      try {
        console.log('🔄 Initializing Rust client...');
        const response = await fetch(`${API_BASE_URL}/auth/token`);
        if (!response.ok) {
          throw new Error(`Token request failed: ${response.status}`);
        }
        const data = await response.json();
        if (!data.accessToken) {
          throw new Error('accessToken missing in response');
        }
        this.accessToken = data.accessToken;

        await invoke('init_gmail_client', {
          accessToken: data.accessToken,
        });

        this.rustInitialized = true;
        console.log('✅ Rust Gmail client initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing Rust client:', error);
        this.rustInitialized = false;
        this.accessToken = null;
        throw error;
      } finally {
        this.pendingRequests.delete(initKey);
      }
    })();

    this.pendingRequests.set(initKey, initPromise);
    return initPromise;
  }

  async logout(): Promise<{ success: boolean }> {
    this.accessToken = null;
    this.rustInitialized = false;
    this.labelCache.clear();
    this.bodyCache.clear();
    this.pendingRequests.clear();
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    return response.json();
  }

  // ===== EMAIL OPERATIONS =====

  async getEmails(options: GetEmailsOptions = {}): Promise<EmailListResponse> {
    const { maxResults = 20, pageToken, labelIds = 'INBOX' } = options;
    
    // ✅ Check cache first (tylko dla pierwszej strony)
    if (!pageToken) {
      const cached = this.labelCache.get(labelIds);
      const now = Date.now();
      
      if (cached && (now - cached.fetchedAt) < this.cacheTTL) {
        console.log('📦 Cache hit for label:', labelIds);
        return {
          messages: cached.messages.slice(0, maxResults),
          nextPageToken: cached.nextPageToken
        };
      }
    }

    // ✅ Avoid duplicate requests
    const requestKey = `emails-${labelIds}-${pageToken || 'first'}`;
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Request already in progress:', requestKey);
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this._fetchEmails(labelIds, maxResults, pageToken);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // ✅ Cache result (tylko dla pierwszej strony)
      if (!pageToken) {
        this.labelCache.set(labelIds, {
          messages: result.messages,
          fetchedAt: Date.now(),
          nextPageToken: result.nextPageToken
        });
      }
      
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  private async _fetchEmails(labelIds: string, maxResults: number, pageToken?: string): Promise<EmailListResponse> {
    if (this.useRust) {
      if (!this.rustInitialized) {
        await this.initRustClient();
      }
      if (this.rustInitialized) {
        try {
          console.log('⚡ Fetching from Rust:', labelIds);
          const result = await invoke<EmailListResponse>('get_emails_rust', {
            options: { maxResults, pageToken, labelIds }
          });
          return { messages: result.messages || [], nextPageToken: result.nextPageToken };
        } catch (error) {
          console.error('Rust getEmails failed, falling back to Node.js:', error);
        }
      }
    }

    console.log('🐌 Fetching from Node.js:', labelIds);
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      labelIds,
    });
    if (pageToken) params.append('pageToken', pageToken);
    
    const response = await fetch(`${API_BASE_URL}/api/emails?${params}`);
    if (!response.ok) {
      throw new Error('Failed to get emails');
    }
    const result = await response.json();
    return { messages: result.messages || [], nextPageToken: result.nextPageToken };
  }

  async getEmail(id: string): Promise<EmailMessage> {
    // ✅ Check body cache
    const cached = this.bodyCache.get(id);
    if (cached) {
      console.log('📦 Body cache hit:', id);
      return cached;
    }

    // ✅ Avoid duplicate requests
    const requestKey = `email-${id}`;
    if (this.pendingRequests.has(requestKey)) {
      console.log('⏳ Email request already in progress:', id);
      return this.pendingRequests.get(requestKey)!;
    }

    const requestPromise = this._fetchEmail(id);
    this.pendingRequests.set(requestKey, requestPromise);

    try {
      const result = await requestPromise;
      
      // ✅ Cache body
      this.bodyCache.set(id, result);
      setTimeout(() => this.bodyCache.delete(id), this.bodyCacheTTL);
      
      return result;
    } finally {
      this.pendingRequests.delete(requestKey);
    }
  }

  private async _fetchEmail(id: string): Promise<EmailMessage> {
    if (this.useRust) {
      if (!this.rustInitialized) {
        await this.initRustClient();
      }
      if (this.rustInitialized) {
        try {
          console.log('⚡ Fetching email from Rust:', id);
          return await invoke<EmailMessage>('get_email_rust', { messageId: id });
        } catch (error) {
          console.error('Rust getEmail failed, falling back to Node.js:', error);
        }
      }
    }

    console.log('🐌 Fetching email from Node.js:', id);
    const response = await fetch(`${API_BASE_URL}/api/emails/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get email');
    }
    return response.json();
  }

  // ✅ Invalidate cache dla labela
  invalidateLabelCache(labelIds: string) {
    this.labelCache.delete(labelIds);
  }

  // ✅ Force refresh - wyczyść cache i pobierz na nowo
  async refreshEmails(labelIds: string): Promise<EmailListResponse> {
    this.invalidateLabelCache(labelIds);
    return this.getEmails({ labelIds, maxResults: 20 });
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; id: string }> {
    if (this.useRust) {
      if (!this.rustInitialized) {
        await this.initRustClient();
      }
      if (this.rustInitialized) {
        try {
          const id = await invoke<string>('send_email_rust', { emailData });
          // ✅ Invalidate SENT and INBOX cache
          this.invalidateLabelCache('SENT');
          this.invalidateLabelCache('INBOX');
          return { success: true, id };
        } catch (error) {
          console.error('Rust sendEmail failed, falling back to Node.js:', error);
        }
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/emails/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData)
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
    
    const result = await response.json();
    this.invalidateLabelCache('SENT');
    this.invalidateLabelCache('INBOX');
    return result;
  }

  async markEmail(id: string, read: boolean): Promise<{ success: boolean }> {
    if (this.useRust) {
      try {
        await invoke('mark_email_rust', { messageId: id, read });
        
        // ✅ Update cache
        for (const [, cache] of this.labelCache.entries()) {
          cache.messages = cache.messages.map(m => 
            m.id === id ? { ...m, unread: !read } : m
          );
        }
        
        const cached = this.bodyCache.get(id);
        if (cached) {
          cached.unread = !read;
          this.bodyCache.set(id, cached);
        }
        
        return { success: true };
      } catch (e) {
        console.error('Rust markEmail failed:', e);
      }
    }

    const res = await fetch(`${API_BASE_URL}/api/emails/${id}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ read })
    });

    if (!res.ok) {
      throw new Error('Failed to mark email');
    }
    
    // ✅ Update cache for Node.js too
    for (const [, cache] of this.labelCache.entries()) {
      cache.messages = cache.messages.map(m => 
        m.id === id ? { ...m, unread: !read } : m
      );
    }
    
    return res.json();
  }

  async deleteEmail(id: string): Promise<{ success: boolean }> {
    if (this.useRust) {
      try {
        await invoke('delete_email_rust', { messageId: id });
        
        // ✅ Remove from all caches
        for (const [, cache] of this.labelCache.entries()) {
          cache.messages = cache.messages.filter(m => m.id !== id);
        }
        this.bodyCache.delete(id);
        
        return { success: true };
      } catch (e) {
        console.error('Rust deleteEmail failed, falling back to Node.js:', e);
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/emails/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
    
    // ✅ Remove from cache for Node.js too
    for (const [, cache] of this.labelCache.entries()) {
      cache.messages = cache.messages.filter(m => m.id !== id);
    }
    this.bodyCache.delete(id);
    
    return response.json();
  }

  async getTodayStats(): Promise<{ totalToday: number; unreadToday: number }> {
    if (this.useRust) {
      try {
        return await invoke<{ totalToday: number; unreadToday: number }>('get_today_stats_rust');
      } catch (error) {
        console.error('Rust getTodayStats failed, falling back to Node.js:', error);
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/emails/stats/today`);
    if (!response.ok) {
      throw new Error('Failed to get today stats');
    }
    return response.json();
  }

  async getUserProfile(): Promise<UserProfile> {
    if (this.useRust) {
      try {
        return await invoke<UserProfile>('get_user_profile_rust');
      } catch (error) {
        console.error('Rust getUserProfile failed, falling back to Node.js:', error);
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/user/profile`);
    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }
    return response.json();
  }

  async getMailboxStats(): Promise<MailboxStats> {
    if (this.useRust) {
      if (!this.rustInitialized) await this.initRustClient();
      if (this.rustInitialized) {
        try {
          const result = await invoke<{ stats: MailboxStats }>('get_mailbox_stats_rust');
          if (result && result.stats && Object.keys(result.stats).length > 0) {
            return result.stats;
          }
        } catch (error) {
          console.error('Rust getMailboxStats failed, falling back to Node.js:', error);
        }
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/mailbox/stats`);
    if (!response.ok) throw new Error('Failed to get mailbox stats');
    return response.json();
  }

  async getLabels(): Promise<Label[]> {
    const response = await fetch(`${API_BASE_URL}/api/labels`);
    if (!response.ok) {
      throw new Error('Failed to get labels');
    }
    return response.json();
  }

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