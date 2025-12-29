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

class EmailAPI {
  // Authentication
  async getAuthUrl(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/auth/google`);
    const data = await response.json();
    return data.url;
  }

  async checkAuthStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/status`);
      const data = await response.json();
      return data.authenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      return false;
    }
  }

  async logout(): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST'
    });
    return response.json();
  }

  async getUserProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/user/profile`);
    if (!response.ok) {
      throw new Error('Failed to get user profile');
    }
    return response.json();
  }

  // Email operations
  async getEmails(options: GetEmailsOptions = {}): Promise<EmailListResponse> {
    const { maxResults = 20, pageToken, labelIds = 'INBOX' } = options;
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
    return response.json();
  }

  async getEmail(id: string): Promise<EmailMessage> {
    const response = await fetch(`${API_BASE_URL}/api/emails/${id}`);
    if (!response.ok) {
      throw new Error('Failed to get email');
    }
    return response.json();
  }

  async sendEmail(emailData: EmailData): Promise<{ success: boolean; id: string }> {
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
    const response = await fetch(`${API_BASE_URL}/api/emails/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
    return response.json();
  }

  async getLabels(): Promise<Label[]> {
    const response = await fetch(`${API_BASE_URL}/api/labels`);
    if (!response.ok) {
      throw new Error('Failed to get labels');
    }
    return response.json();
  }

  async getMailboxStats(): Promise<MailboxStats> {
    const response = await fetch(`${API_BASE_URL}/api/mailbox/stats`);
    if (!response.ok) {
      throw new Error('Failed to get mailbox stats');
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