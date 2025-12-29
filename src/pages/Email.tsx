import { useState, useEffect, useCallback, useRef } from 'react';
import EmailSidebar from '../components/sidebar/EmailSidebar';
import emailAPI, { type EmailMessage, type UserProfile, type MailboxStats } from '../services/emailAPI-rust';

interface EmailProps {
  sidebarVisible: boolean;
}

function Email({ sidebarVisible }: EmailProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [emails, setEmails] = useState<EmailMessage[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null);
  const [showCompose, setShowCompose] = useState(false);
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    body: ''
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedLabel, setSelectedLabel] = useState('INBOX');
  const [nextPageToken, setNextPageToken] = useState<string | undefined>(undefined);
  const [mailboxStats, setMailboxStats] = useState<MailboxStats>({});
  const [todayStats, setTodayStats] = useState<{ totalToday: number; unreadToday: number }>({
    totalToday: 0,
    unreadToday: 0
  });

  const currentLabelRef = useRef(selectedLabel);
  const nextPageTokenRef = useRef(nextPageToken);

  useEffect(() => {
    currentLabelRef.current = selectedLabel;
  }, [selectedLabel]);

  useEffect(() => {
    nextPageTokenRef.current = nextPageToken;
  }, [nextPageToken]);

  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ POPRAWKA: Usuń nextPageToken z dependencies
  const loadEmails = useCallback(async (label: string, loadMore = false, pageToken?: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const currentAbortController = abortControllerRef.current;

    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      // ✅ Użyj przekazanego tokena lub ref
      const tokenToUse = pageToken || nextPageTokenRef.current;

      console.log('📧 Loading emails for label:', label, 'loadMore:', loadMore, 'pageToken:', tokenToUse);

      const response = await emailAPI.getEmails({
        labelIds: label,
        maxResults: 20,
        pageToken: loadMore ? tokenToUse : undefined
      });

      if (currentAbortController.signal.aborted || currentLabelRef.current !== label) {
        console.log('⏹️ Request aborted or label changed, ignoring result');
        return;
      }

      console.log('📧 Received', response.messages?.length || 0, 'emails');
      console.log('📧 Next page token:', response.nextPageToken);

      if (loadMore) {
        setEmails(prev => {
          const newEmails = [...prev, ...(response.messages || [])];
          console.log('📧 Total emails after load more:', newEmails.length);
          return newEmails;
        });
      } else {
        setEmails(response.messages || []);
      }

      setNextPageToken(response.nextPageToken);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('⏹️ Request was aborted');
        return;
      }
      console.error('❌ Error loading emails:', error);
      if (!loadMore) {
        setEmails([]);
      }
    } finally {
      if (!currentAbortController.signal.aborted && currentLabelRef.current === label) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []); // ✅ Pusta tablica - funkcja się nie przebudowuje

  // ✅ POPRAWKA: handleLoadMore z useCallback
  const handleLoadMore = useCallback(() => {
    const token = nextPageTokenRef.current;
    console.log('🔽 Load more clicked');
    console.log('   - nextPageToken:', token);
    console.log('   - loadingMore:', loadingMore);
    console.log('   - selectedLabel:', currentLabelRef.current);

    if (token && !loadingMore) {
      loadEmails(currentLabelRef.current, true, token);
    } else {
      console.warn('⚠️ Cannot load more:', { token, loadingMore });
    }
  }, [loadingMore, loadEmails]);

  const loadUserProfile = useCallback(async () => {
    try {
      const profile = await emailAPI.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }, []);

  const loadMailboxStats = useCallback(async () => {
    try {
      const stats = await emailAPI.getMailboxStats();
      console.log('📊 Mailbox stats loaded:', stats);
      setMailboxStats(stats);
    } catch (error) {
      console.error('Error loading mailbox stats:', error);
    }
  }, []);

  const loadTodayStats = useCallback(async () => {
    try {
      const stats = await emailAPI.getTodayStats();
      console.log('📅 Today stats:', stats);
      setTodayStats(stats);
    } catch (error) {
      console.error('Error loading today stats:', error);
    }
  }, []);

  useEffect(() => {
    console.log('🔍 Email component mounted, checking auth...');

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auth') === 'success') {
      console.log('✅ Auth callback detected! Setting authenticated=true');
      setAuthenticated(true);
      setLoading(false);

      window.history.replaceState({}, '', '/email');

      Promise.all([
        loadEmails('INBOX', false),
        loadUserProfile(),
        loadMailboxStats(),
        loadTodayStats()
      ]).catch(err => {
        console.error('Error loading initial data:', err);
      });
    } else {
      console.log('🔍 No auth callback, checking auth status...');
      checkAuthentication();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authenticated) return;

    console.log('📬 Label changed to:', selectedLabel);

    setNextPageToken(undefined);
    setSelectedEmail(null);

    loadEmails(selectedLabel, false);
  }, [selectedLabel, authenticated, loadEmails]);

  const checkAuthentication = async () => {
    try {
      console.log('🔍 Calling /auth/status...');
      const isAuth = await emailAPI.checkAuthStatus();
      console.log('📡 Auth status response:', isAuth);
      setAuthenticated(isAuth);
      if (isAuth) {
        console.log('✅ User is authenticated, loading data...');
        await Promise.all([
          loadEmails('INBOX', false),
          loadUserProfile(),
          loadMailboxStats(),
          loadTodayStats()
        ]);
      } else {
        console.log('❌ User is NOT authenticated');
      }
    } catch (error) {
      console.error('💥 Error checking authentication:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const authUrl = await emailAPI.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error getting auth URL:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await emailAPI.logout();
      setAuthenticated(false);
      setEmails([]);
      setSelectedEmail(null);
      setUserProfile(null);
      setMailboxStats({});
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleForceSync = async () => {
    setLoading(true);
    try {
      // Wyczyść cache w emailAPI
      emailAPI.invalidateLabelCache(selectedLabel);

      // Przeładuj z serwera
      await emailAPI.refreshEmails(selectedLabel);
      await loadEmails(selectedLabel, false);
      await loadMailboxStats();
      await loadTodayStats();

      console.log('✅ Force sync complete');
    } catch (error) {
      console.error('❌ Force sync failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailClick = async (email: EmailMessage) => {
    try {
      const fullEmail = await emailAPI.getEmail(email.id);
      
      // ✅ DEBUG: sprawdź szczegóły
      console.log('📧 Full email object:', fullEmail);
      console.log('📧 Body length:', fullEmail.body?.length || 0);
      console.log('📧 Body first 500 chars:', fullEmail.body?.substring(0, 500));
      console.log('📧 Has HTML tags:', fullEmail.body?.includes('<html>') || fullEmail.body?.includes('<body>'));
      console.log('📧 Snippet:', fullEmail.snippet);
      
      setSelectedEmail(fullEmail);

      if (email.unread) {
        await emailAPI.markEmail(email.id, true);
        setEmails(prev => prev.map(e =>
          e.id === email.id ? { ...e, unread: false } : e
        ));
        loadMailboxStats();
        loadTodayStats();
      }
    } catch (error) {
      console.error('Error loading email details:', error);
    }
  };

  const handleSendEmail = async () => {
    try {
      await emailAPI.sendEmail(composeData);
      setShowCompose(false);
      setComposeData({ to: '', subject: '', body: '' });

      loadEmails(selectedLabel, false);
      loadMailboxStats();
      loadTodayStats();
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Błąd wysyłania wiadomości');
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    try {
      await emailAPI.deleteEmail(emailId);
      setEmails(prev => prev.filter(e => e.id !== emailId));
      if (selectedEmail?.id === emailId) {
        setSelectedEmail(null);
      }
      loadMailboxStats();
      loadTodayStats();
    } catch (error) {
      console.error('Error deleting email:', error);
      alert('Błąd usuwania wiadomości');
    }
  };

 // ✅ Renderuj email body w iframe (z obsługą plain text)
  const renderEmailInIframe = (email: EmailMessage) => {
    const sanitizedBody = sanitizeEmailBody(email);
    const isPlainText = !email.body.includes('<') || email.body.trim().startsWith('Content-Type: text/plain');
    
    // Kompletny HTML dokument z własnymi stylami
    const iframeContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      box-sizing: border-box;
    }
    
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      background: transparent;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    /* ✅ Style dla plain text emaili */
    .plain-text-email {
      white-space: pre-wrap;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 13px;
    }
    
    /* Podstawowe style dla czytelności */
    a {
      color: #5b9dff;
      text-decoration: underline;
      word-break: break-word;
    }
    
    a:hover {
      color: #4a8ce6;
    }
    
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 0.5em 0;
    }
    
    table {
      border-collapse: collapse;
      max-width: 100%;
      width: auto;
    }
    
    table td, table th {
      padding: 8px;
      vertical-align: top;
    }
    
    p {
      margin: 0.75em 0;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin: 1em 0 0.5em 0;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
      line-height: 1.3;
    }
    
    h1 { font-size: 1.75em; }
    h2 { font-size: 1.5em; }
    h3 { font-size: 1.25em; }
    h4 { font-size: 1.1em; }
    h5 { font-size: 1em; }
    h6 { font-size: 0.9em; }
    
    ul, ol {
      margin: 0.75em 0;
      padding-left: 2em;
    }
    
    li {
      margin: 0.25em 0;
    }
    
    blockquote {
      margin: 1em 0;
      padding: 0.5em 0 0.5em 1em;
      border-left: 3px solid rgba(91, 157, 255, 0.5);
      color: rgba(255, 255, 255, 0.7);
      font-style: italic;
    }
    
    pre {
      background: rgba(0, 0, 0, 0.3);
      padding: 1em;
      border-radius: 0.5em;
      overflow-x: auto;
      margin: 1em 0;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    code {
      background: rgba(0, 0, 0, 0.3);
      padding: 0.2em 0.4em;
      border-radius: 0.3em;
      font-family: 'Courier New', Consolas, Monaco, monospace;
      font-size: 0.9em;
      color: #5b9dff;
    }
    
    pre code {
      background: transparent;
      padding: 0;
      color: rgba(255, 255, 255, 0.9);
    }
    
    hr {
      border: none;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      margin: 1.5em 0;
    }
    
    strong, b {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }
    
    em, i {
      font-style: italic;
    }
    
    /* Gmail-specific classes */
    .gmail_quote {
      color: rgba(255, 255, 255, 0.6);
      border-left: 2px solid rgba(91, 157, 255, 0.3);
      padding-left: 1em;
      margin: 1em 0;
    }
    
    .gmail_signature {
      color: rgba(255, 255, 255, 0.7);
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Zapobiegaj bardzo szerokim tabelom */
    div, span {
      max-width: 100%;
    }
  </style>
</head>
<body>
  ${isPlainText ? `<div class="plain-text-email">${sanitizedBody}</div>` : sanitizedBody}
</body>
</html>
    `.trim();
    
    return iframeContent;
  };

  // ✅ SANITIZE - obsługa plain text i HTML
  const sanitizeEmailBody = (email: EmailMessage): string => {
    let htmlContent = email.body || email.snippet;
    
    // ✅ Sprawdź czy to plain text
    const isPlainText = !htmlContent.includes('<') && !htmlContent.includes('</');
    
    if (isPlainText) {
      // Dla plain text: escape HTML i zamień URLs na linki
      htmlContent = htmlContent
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
      
      // Zamień URLs na klikalne linki
      htmlContent = htmlContent.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      );
      
      // Zamień email adresy na linki
      htmlContent = htmlContent.replace(
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g,
        '<a href="mailto:$1">$1</a>'
      );
      
      return htmlContent;
    }
    
    // Dla HTML: Replace inline images
    if (email.inlineImages && email.inlineImages.length > 0) {
      email.inlineImages.forEach(image => {
        if (image.contentId) {
          const cidPattern = new RegExp(`cid:${image.contentId}`, 'g');
          const attachmentUrl = emailAPI.getAttachmentUrl(email.id, image.id);
          htmlContent = htmlContent.replace(cidPattern, attachmentUrl);
        }
      });
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Usuń <script> tagi
    const scriptTags = doc.querySelectorAll('script');
    scriptTags.forEach(tag => tag.remove());
    
    // Usuń event handlery i sprawdź linki
    const allElements = doc.querySelectorAll('*');
    allElements.forEach(element => {
      Array.from(element.attributes).forEach(attr => {
        if (attr.name.startsWith('on')) {
          element.removeAttribute(attr.name);
        }
      });
      
      // Sprawdź linki - usuń javascript: i dodaj target="_blank"
      if (element.tagName === 'A') {
        const href = element.getAttribute('href');
        if (href && href.toLowerCase().startsWith('javascript:')) {
          element.removeAttribute('href');
        } else if (href) {
          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
        }
      }
    });
    
    return doc.body.innerHTML;
  };
  const getInitials = (email: string) => {
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Wczoraj';
    } else if (days < 7) {
      return `${days} dni temu`;
    } else {
      return date.toLocaleDateString('pl-PL');
    }
  };

  const getLabelDisplayName = (label: string) => {
    const names: Record<string, string> = {
      'INBOX': 'Odebrane',
      'SENT': 'Wysłane',
      'DRAFT': 'Robocze',
      'TRASH': 'Kosz',
      'SPAM': 'Spam',
      'STARRED': 'Oznaczone gwiazdką',
      'CATEGORY_SOCIAL': 'Społeczność',
      'CATEGORY_PROMOTIONS': 'Oferty',
      'CATEGORY_UPDATES': 'Aktualizacje',
      'CATEGORY_FORUMS': 'Fora',
      'CATEGORY_PERSONAL': 'Osobiste'
    };
    return names[label] || label;
  };

  if (loading && emails.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#15161b]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5b9dff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#15161b]">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[#5b9dff]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-[#5b9dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Zaloguj się do Gmail</h2>
          <p className="text-white/60 mb-6">
            Aby korzystać z funkcji email, zaloguj się na swoje konto Google
          </p>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-[#5b9dff] hover:bg-[#4a8ce6] rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Zaloguj się przez Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <EmailSidebar
        visible={sidebarVisible}
        userProfile={userProfile || undefined}
        selectedLabel={selectedLabel}
        onSelectLabel={setSelectedLabel}
        onLogout={handleLogout}
        mailboxStats={mailboxStats}
        todayStats={todayStats}
      />

      <main className="flex-1 overflow-hidden flex flex-col bg-[#15161b]">
        <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold">{getLabelDisplayName(selectedLabel)}</h2>
            <p className="text-sm text-white/40">{userProfile?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleForceSync}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              title="Wymuś pełną synchronizację"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={() => setShowCompose(true)}
              className="px-4 py-2 bg-[#5b9dff] hover:bg-[#4a8ce6] rounded-lg flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nowa wiadomość
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className={`${selectedEmail ? 'w-1/3' : 'flex-1'} overflow-y-auto custom-scrollbar border-r border-white/5`}>
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-[#5b9dff] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-white/60">Ładowanie wiadomości...</p>
                </div>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex items-center justify-center h-full text-white/40">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <p>Brak wiadomości</p>
                </div>
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/5">
                  {emails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${selectedEmail?.id === email.id ? 'bg-white/5' : ''
                        } ${email.unread ? 'bg-white/[0.02]' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#5b9dff] to-[#a87bc4] rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {getInitials(email.from)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h4 className={`font-medium truncate ${email.unread ? 'text-white' : 'text-white/80'}`}>
                              {email.from.split('<')[0].trim() || email.from}
                            </h4>
                            <span className="text-xs text-white/40 flex-shrink-0">{formatDate(email.date)}</span>
                          </div>
                          <h5 className={`text-sm mb-1 truncate ${email.unread ? 'font-medium' : 'text-white/60'}`}>
                            {email.subject || '(brak tematu)'}
                          </h5>
                          <p className="text-sm text-white/40 line-clamp-2 flex items-center gap-2">
                            {email.snippet}
                            {email.hasAttachment && <span title="Ma załącznik" className="flex-shrink-0">📎</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {nextPageToken && (
                  <div className="p-4 text-center border-t border-white/5">
                    {loadingMore ? (
                      <div className="flex items-center justify-center gap-3 py-2">
                        <div className="w-5 h-5 border-2 border-[#5b9dff] border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm text-white/60">Ładowanie kolejnych wiadomości...</span>
                      </div>
                    ) : (
                      <button
                        onClick={handleLoadMore}
                        disabled={!nextPageToken || loadingMore}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        Załaduj więcej
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {selectedEmail && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* ... reszta kodu email preview bez zmian ... */}
              <div className="p-6 border-b border-white/5">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold">{selectedEmail.subject || '(brak tematu)'}</h2>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-white/40 hover:text-white/60 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#5b9dff] to-[#a87bc4] rounded-full flex items-center justify-center font-semibold">
                    {getInitials(selectedEmail.from)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedEmail.from.split('<')[0].trim()}</div>
                    <div className="text-sm text-white/40">{selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from}</div>
                  </div>
                  <div className="text-sm text-white/40">{formatDate(selectedEmail.date)}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setComposeData({
                        to: selectedEmail.from.match(/<(.+)>/)?.[1] || selectedEmail.from,
                        subject: `Re: ${selectedEmail.subject}`,
                        body: `\n\n---\n${selectedEmail.body}`
                      });
                      setShowCompose(true);
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded text-sm transition-colors"
                  >
                    Odpowiedz
                  </button>
                  <button
                    onClick={() => handleDeleteEmail(selectedEmail.id)}
                    className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm transition-colors"
                  >
                    Usuń
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                {/* ✅ IFRAME dla email body - pełna izolacja CSS */}
                <iframe
                  ref={(iframe) => {
                    if (iframe && iframe.contentWindow) {
                      const doc = iframe.contentWindow.document;
                      doc.open();
                      doc.write(renderEmailInIframe(selectedEmail));
                      doc.close();
                      
                      // Dynamicznie ustaw wysokość iframe na podstawie zawartości
                      const resizeIframe = () => {
                        if (doc.body) {
                          iframe.style.height = doc.body.scrollHeight + 'px';
                        }
                      };
                      
                      // Resize po załadowaniu
                      iframe.contentWindow.addEventListener('load', resizeIframe);
                      // Resize po załadowaniu obrazków
                      const images = doc.querySelectorAll('img');
                      images.forEach(img => {
                        img.addEventListener('load', resizeIframe);
                      });
                      
                      // Initial resize
                      setTimeout(resizeIframe, 100);
                    }
                  }}
                  sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                  className="w-full border-0"
                  style={{
                    minHeight: '200px',
                    backgroundColor: 'transparent',
                  }}
                  title="Email content"
                />

                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t-2 border-[#5b9dff]/50">
                    <h4 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                      <svg className="w-6 h-6 text-[#5b9dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      📎 Załączniki ({selectedEmail.attachments.length})
                    </h4>
                    <div className="space-y-3">
                      {selectedEmail.attachments.map((attachment, index) => {
                        const attachmentId = attachment.id || `attachment-${index}`;
                        const downloadUrl = attachment.id
                          ? emailAPI.getAttachmentUrl(selectedEmail.id, attachment.id)
                          : '#';

                        return (
                          <a
                            key={attachmentId}
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-4 p-4 bg-[#5b9dff]/10 hover:bg-[#5b9dff]/20 border border-[#5b9dff]/30 rounded-lg transition-all group"
                            onClick={(e) => {
                              if (!attachment.id) {
                                e.preventDefault();
                                alert('Załącznik niedostępny');
                              }
                            }}
                          >
                            <div className="w-12 h-12 bg-[#5b9dff]/30 rounded-lg flex items-center justify-center flex-shrink-0">
                              <svg className="w-6 h-6 text-[#5b9dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-base font-semibold truncate text-white">{attachment.filename}</div>
                              <div className="text-sm text-white/60">
                                {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                              </div>
                            </div>
                            <svg className="w-6 h-6 text-[#5b9dff]/60 group-hover:text-[#5b9dff] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {showCompose && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1d24] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="text-lg font-semibold">Nowa wiadomość</h3>
              <button
                onClick={() => setShowCompose(false)}
                className="text-white/40 hover:text-white/60 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">Do</label>
                <input
                  type="email"
                  value={composeData.to}
                  onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                  className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors"
                  placeholder="odbiorca@example.com"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Temat</label>
                <input
                  type="text"
                  value={composeData.subject}
                  onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors"
                  placeholder="Temat wiadomości"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">Treść</label>
                <textarea
                  value={composeData.body}
                  onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                  className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors resize-none"
                  rows={10}
                  placeholder="Treść wiadomości..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-white/5">
              <button
                onClick={() => setShowCompose(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                Anuluj
              </button>
              <button
                onClick={handleSendEmail}
                disabled={!composeData.to || !composeData.body}
                className="px-4 py-2 bg-[#5b9dff] hover:bg-[#4a8ce6] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Wyślij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Email;