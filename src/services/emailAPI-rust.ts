import { invoke } from '@tauri-apps/api/core';

const API_BASE_URL = 'http://localhost:3001';

// Types (zachowane zgodnie z oryginałem)
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
 * EmailAPI (Rust-enabled) - zoptymalizowana wersja (poprawiona)
 *
 * Poprawki w tej wersji:
 * - Bezpieczne użycie console.time/console.timeEnd (unikamy "Timer already exists" i "does not exist")
 * - Klasyczny frontendowy cache metadata/body
 * - Prefetching w tle (nieblokujące)
 * - Fallback do Node.js tam, gdzie Rust zwraca puste dane (np. mailbox stats)
 */
class EmailAPI {
  private accessToken: string | null = null;
  private useRust: boolean = false;
  private rustInitialized: boolean = false;

  // Cache metadata + body
  private metadataCache: { messages: EmailMessage[]; fetchedAt: number } | null = null;
  private bodyCache: Map<string, EmailMessage> = new Map();

  // konfigurowalne TTLy
  private metadataTTL = 5 * 1000; // 5s - krótki TTL metadata, UI responsiveness
  private bodyTTL = 60 * 1000; // 60s - cache na ciała maili w pamięci JS

  // prefetch concurrency
  private prefetchConcurrency = 3;

  // active timers set to avoid duplicate console.time/timeEnd calls
  private activeTimers: Set<string> = new Set();

  constructor() {
    // detect Tauri / Rust availability
    this.useRust = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
    console.log('🦀 EmailAPI initialized:', this.useRust ? 'Using Rust' : 'Using Node.js');
  }

  // ===== safe console timer helpers =====
  private startTimer(label: string) {
    try {
      if (!this.activeTimers.has(label)) {
        console.time(label);
        this.activeTimers.add(label);
      }
    } catch {
      // ignore - some consoles may behave differently
    }
  }

  private endTimer(label: string) {
    try {
      if (this.activeTimers.has(label)) {
        console.timeEnd(label);
        this.activeTimers.delete(label);
      }
    } catch {
      // ignore
      this.activeTimers.delete(label);
    }
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

      // If authenticated and running in Tauri, attempt to init Rust client (only once)
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
    if (!this.useRust) return;
    if (this.rustInitialized) return;

    try {
      const response = await fetch(`${API_BASE_URL}/auth/token`);
      if (!response.ok) {
        throw new Error('No token from backend');
      }
      const data = await response.json();
      if (!data.accessToken) {
        throw new Error('accessToken missing');
      }
      this.accessToken = data.accessToken;

      // Wywołanie invoke tylko raz — inicjalizuje GmailClient po stronie Rust
      await invoke('init_gmail_client', {
        accessToken: data.accessToken,
      });

      this.rustInitialized = true;
      console.log('✅ Rust Gmail client initialized (frontend)');
    } catch (error) {
      console.error('Error initializing Rust client:', error);
      // Disable rust usage to fallback gracefully
      this.useRust = false;
      this.rustInitialized = false;
      this.accessToken = null;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    this.accessToken = null;
    this.rustInitialized = false;
    // clear caches
    this.metadataCache = null;
    this.bodyCache.clear();
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
    });
    return response.json();
  }

  // ===== HELPERS (frontend cache and prefetch) =====

  private cacheMetadata(messages: EmailMessage[]) {
    this.metadataCache = { messages, fetchedAt: Date.now() };
  }

  private cacheBody(message: EmailMessage) {
    this.bodyCache.set(message.id, message);
    // optional: schedule eviction after TTL
    setTimeout(() => {
      this.bodyCache.delete(message.id);
    }, this.bodyTTL);
  }

  private async prefetchBodies(ids: string[]) {
    if (!ids || ids.length === 0) return;
    // naive concurrency control: sequential groups of prefetchConcurrency
    const queue = [...ids];
    const workers: Promise<void>[] = [];
    for (let i = 0; i < this.prefetchConcurrency; i++) {
      workers.push((async () => {
        while (queue.length) {
          const id = queue.shift();
          if (!id) break;
          try {
            if (!this.bodyCache.has(id)) {
              const full = await this.getEmail(id);
              void full;
            }
          } catch (e) {
            // ignore prefetch errors
            console.debug('Prefetch error', e);
          }
        }
      })());
    }
    // Run workers but don't await them to avoid blocking UI; still let them execute in background
    // We intentionally don't await Promise.all(workers) here.
  }

  // ===== EMAIL OPERATIONS =====

  async getEmails(options: GetEmailsOptions = {}): Promise<EmailListResponse> {
    const { maxResults = 20, pageToken, labelIds = 'INBOX' } = options;

    // If we have recent metadata cached, return it (fast UI response)
    const now = Date.now();
    if (this.metadataCache && (now - this.metadataCache.fetchedAt) < this.metadataTTL && !pageToken) {
      const messages = this.metadataCache.messages.slice(0, maxResults);
      const toPrefetch = messages.slice(0, 3).map(m => m.id);
      void this.prefetchBodies(toPrefetch);
      return { messages, nextPageToken: undefined };
    }

    if (this.useRust) {
      if (!this.rustInitialized) {
        await this.initRustClient();
      }
      if (this.rustInitialized) {
        const timerLabel = '⚡ Rust getEmails';
        this.startTimer(timerLabel);
        try {
          const result = await invoke<EmailListResponse>('get_emails_rust', {
            options: {
              maxResults,
              pageToken,
              labelIds
            }
          });
          const messages = result.messages || [];
          this.cacheMetadata(messages);
          const toPrefetch = messages.slice(0, 3).map(m => m.id);
          void this.prefetchBodies(toPrefetch);
          return result;
        } catch (error) {
          console.error('Rust getEmails failed, falling back to Node.js:', error);
        } finally {
          this.endTimer(timerLabel);
        }
      }
    }

    // Fallback to Node.js
    const timerLabelNode = '🐌 Node.js getEmails';
    this.startTimer(timerLabelNode);
    try {
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
      this.cacheMetadata(result.messages || []);
      const toPrefetch = (result.messages || []).slice(0, 3).map((m: EmailMessage) => m.id);
      void this.prefetchBodies(toPrefetch);
      return result;
    } finally {
      this.endTimer(timerLabelNode);
    }
  }

  async getEmail(id: string): Promise<EmailMessage> {
    const cached = this.bodyCache.get(id);
    if (cached) {
      return cached;
    }

    if (this.useRust) {
      if (!this.rustInitialized) {
        await this.initRustClient();
      }
      if (this.rustInitialized) {
        const timerLabel = '⚡ Rust getEmail';
        this.startTimer(timerLabel);
        try {
          const result = await invoke<EmailMessage>('get_email_rust', {
            messageId: id
          });
          this.cacheBody(result);
          return result;
        } catch (error) {
          console.error('Rust getEmail failed, falling back to Node.js:', error);
        } finally {
          this.endTimer(timerLabel);
        }
      }
    }

    const timerLabelNode = '🐌 Node.js getEmail';
    this.startTimer(timerLabelNode);
    try {
      const response = await fetch(`${API_BASE_URL}/api/emails/${id}`);
      if (!response.ok) {
        throw new Error('Failed to get email');
      }
      const result = await response.json();
      this.cacheBody(result);
      return result;
    } finally {
      this.endTimer(timerLabelNode);
    }
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; id: string }> {
    if (this.useRust) {
      if (!this.rustInitialized) {
        await this.initRustClient();
      }
      if (this.rustInitialized) {
        try {
          const id = await invoke<string>('send_email_rust', { emailData });
          this.metadataCache = null;
          return { success: true, id };
        } catch (error) {
          console.error('Rust sendEmail failed, falling back to Node.js:', error);
        }
      }
    }

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
    if (this.useRust) {
      try {
        await invoke('mark_email_rust', { messageId: id, read });
        if (this.metadataCache) {
          this.metadataCache.messages = this.metadataCache.messages.map(m => m.id === id ? { ...m, unread: !read } : m);
        }
        const cached = this.bodyCache.get(id);
        if (cached) { cached.unread = !read; this.bodyCache.set(id, cached); }
        return { success: true };
      } catch (e) {
        console.error(e);
      }
    }

    const res = await fetch(`${API_BASE_URL}/api/emails/${id}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ read })
    });

    if (!res.ok) {
      throw new Error('Failed to mark email');
    }
    return res.json();
  }

  async deleteEmail(id: string): Promise<{ success: boolean }> {
    if (this.useRust) {
      try {
        await invoke('delete_email_rust', { messageId: id });
        if (this.metadataCache) {
          this.metadataCache.messages = this.metadataCache.messages.filter(m => m.id !== id);
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
    return response.json();
  }

  async getTodayStats(): Promise<{ totalToday: number; unreadToday: number }> {
    if (this.useRust) {
      try {
        const result = await invoke<{ totalToday: number; unreadToday: number }>('get_today_stats_rust');
        return result;
      } catch (error) {
        console.error('Rust getTodayStats failed, falling back to Node.js:', error);
      }
    }

    const response = await fetch(`${API_BASE_URL}/api/emails/stats/today`);
    if (!response.ok) {
      throw new Error('Failed to get today stats');
    }
    const result = await response.json();
    return result;
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
    // Try Rust path first
    if (this.useRust) {
      if (!this.rustInitialized) await this.initRustClient();
      if (this.rustInitialized) {
        const timerLabel = '⚡ Rust getMailboxStats';
        this.startTimer(timerLabel);
        try {
          // rust returns { stats: MailboxStats } according to earlier contract
          const result = await invoke<{ stats: MailboxStats }>('get_mailbox_stats_rust');
          // If Rust returned empty map, fallback to Node.js to ensure frontend has data
          if (result && result.stats && Object.keys(result.stats).length > 0) {
            return result.stats;
          } else {
            console.debug('Rust returned empty mailbox stats, falling back to Node.js');
          }
        } catch (error) {
          console.error('Rust getMailboxStats failed, falling back to Node.js:', error);
        } finally {
          this.endTimer(timerLabel);
        }
      }
    }

    const timerLabelNode = '🐌 Node.js getMailboxStats';
    this.startTimer(timerLabelNode);
    try {
      const response = await fetch(`${API_BASE_URL}/api/mailbox/stats`);
      if (!response.ok) throw new Error('Failed to get mailbox stats');
      const result = await response.json();
      return result;
    } finally {
      this.endTimer(timerLabelNode);
    }
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