import { type UserProfile, type MailboxStats } from '../../services/emailAPI-rust';

interface EmailSidebarProps {
  visible: boolean;
  userProfile?: UserProfile;
  selectedLabel?: string;
  onSelectLabel?: (label: string) => void;
  onLogout?: () => void;
  mailboxStats?: MailboxStats;
  todayStats?: { totalToday: number; unreadToday: number };
}

function EmailSidebar({ 
  visible, 
  userProfile, 
  selectedLabel = 'INBOX',
  onSelectLabel = () => {},
  onLogout = () => {},
  mailboxStats = {},
  todayStats = { totalToday: 0, unreadToday: 0 }
}: EmailSidebarProps) {
  const mailboxes = [
    { id: 'INBOX', name: 'Odebrane', icon: 'inbox', color: '#5b9dff' },
    { id: 'SENT', name: 'Wysłane', icon: 'sent', color: '#5db36e' },
    { id: 'DRAFT', name: 'Robocze', icon: 'draft', color: '#a87bc4' },
    { id: 'STARRED', name: 'Ważne', icon: 'star', color: '#d9944d' },
    { id: 'TRASH', name: 'Kosz', icon: 'trash', color: '#e16b6b' },
  ];

  // Kategorie Gmail (jak w aplikacji Gmail)
  const categories = [
    { id: 'CATEGORY_SOCIAL', name: 'Społeczność', icon: 'users', color: '#3b82f6' },
    { id: 'CATEGORY_PROMOTIONS', name: 'Oferty', icon: 'tag', color: '#10b981' },
    { id: 'SPAM', name: 'Spam', icon: 'alert', color: '#ef4444' },
  ];

  // 🔥 FIX: Używaj todayStats zamiast INBOX
  const totalUnread = mailboxStats['INBOX']?.unread || 0;
  const inboxToday = todayStats.totalToday; // 🔥 Z API /stats/today

  const getMailboxStats = (mailboxId: string) => {
    const stats = mailboxStats[mailboxId] || { total: 0, unread: 0 };
    return stats;
  };

  // Debug log
  console.log('📊 Sidebar - Używam todayStats');
  console.log('📊 Total unread (INBOX):', totalUnread);
  console.log('📊 Today stats:', todayStats);

  return (
    <aside
      className={`bg-[#1c1d24] border-r border-white/5 p-4 overflow-y-auto custom-scrollbar transition-all duration-200 ease-out ${
        visible ? 'w-80 opacity-100' : 'w-0 opacity-0 p-0 border-r-0'
      }`}
      style={{
        transform: visible ? 'translateX(0)' : 'translateX(-100%)',
      }}
    >
      <div className={`transition-opacity duration-150 ${visible ? 'opacity-100' : 'opacity-0'}`}>
        {/* User Profile */}
        {userProfile && (
          <div className="mb-6 p-4 bg-white/5 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-[#5b9dff] to-[#a87bc4] rounded-full flex items-center justify-center font-semibold text-lg">
                {userProfile.email?.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{userProfile.name || 'Użytkownik'}</div>
                <div className="text-sm text-white/40 truncate">{userProfile.email}</div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Wyloguj się
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#5b9dff]/20 backdrop-blur-sm border border-[#5b9dff]/30 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">Nieprzeczytane</div>
            <div className="text-2xl font-bold">{totalUnread}</div>
          </div>
          <div className="bg-[#5db36e]/20 backdrop-blur-sm border border-[#5db36e]/30 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">Dzisiaj</div>
            <div className="text-2xl font-bold">{inboxToday}</div>
          </div>
        </div>

        {/* Mailboxes */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider px-2">Skrzynki</h3>
          <div className="space-y-1">
            {mailboxes.map((mailbox) => {
              const stats = getMailboxStats(mailbox.id);
              return (
                <button
                  key={mailbox.id}
                  onClick={() => onSelectLabel(mailbox.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group ${
                    selectedLabel === mailbox.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {mailbox.icon === 'inbox' && (
                      <svg className="w-5 h-5" style={{ color: mailbox.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    )}
                    {mailbox.icon === 'sent' && (
                      <svg className="w-5 h-5" style={{ color: mailbox.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                    {mailbox.icon === 'draft' && (
                      <svg className="w-5 h-5" style={{ color: mailbox.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                    )}
                    {mailbox.icon === 'star' && (
                      <svg className="w-5 h-5" style={{ color: mailbox.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    )}
                    {mailbox.icon === 'trash' && (
                      <svg className="w-5 h-5" style={{ color: mailbox.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                    <span className={`text-sm ${selectedLabel === mailbox.id ? 'font-medium' : ''}`}>
                      {mailbox.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.unread > 0 && (
                      <span className="px-2 py-0.5 bg-[#5b9dff] text-xs font-semibold rounded">
                        {stats.unread}
                      </span>
                    )}
                    {stats.total > 0 && (
                      <span className={`text-xs ${selectedLabel === mailbox.id ? 'text-white/60' : 'text-white/40'}`}>
                        {stats.total}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kategorie Gmail */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider px-2">Kategorie</h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const stats = getMailboxStats(category.id);
              return (
                <button
                  key={category.id}
                  onClick={() => onSelectLabel(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left group ${
                    selectedLabel === category.id ? 'bg-white/10' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {category.icon === 'users' && (
                      <svg className="w-5 h-5" style={{ color: category.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    )}
                    {category.icon === 'tag' && (
                      <svg className="w-5 h-5" style={{ color: category.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    )}
                    {category.icon === 'alert' && (
                      <svg className="w-5 h-5" style={{ color: category.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    <span className={`text-sm ${selectedLabel === category.id ? 'font-medium' : ''}`}>
                      {category.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.unread > 0 && (
                      <span className="px-2 py-0.5 bg-white/10 text-xs font-semibold rounded">
                        {stats.unread}
                      </span>
                    )}
                    {stats.total > 0 && (
                      <span className={`text-xs ${selectedLabel === category.id ? 'text-white/60' : 'text-white/40'}`}>
                        {stats.total}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 px-2">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Etykiety</h3>
            <button className="text-white/40 hover:text-white/60 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#5b9dff] rounded-full"></div>
                <span className="text-sm">Praca</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">23</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#5db36e] rounded-full"></div>
                <span className="text-sm">Osobiste</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">8</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#a87bc4] rounded-full"></div>
                <span className="text-sm">Raporty</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">12</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#e16b6b] rounded-full"></div>
                <span className="text-sm">Pilne</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">5</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-[#d9944d] rounded-full"></div>
                <span className="text-sm">Szkolenia</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">4</span>
            </button>
          </div>
        </div>

        {/* Storage Info */}
        {userProfile && (
          <div className="border-t border-white/5 pt-4">
            <div className="px-2 mb-3">
              <div className="text-xs text-white/40 mb-1">Wykorzystane miejsce</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/60">Gmail</span>
                <span className="text-xs font-medium">2.3 GB / 15 GB</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-1.5">
                <div className="bg-[#5b9dff] h-1.5 rounded-full" style={{ width: '15%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

export default EmailSidebar;