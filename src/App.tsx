import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './App.css';

type View = 'dashboard' | 'email' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [notification, setNotification] = useState('');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [showAppMenu, setShowAppMenu] = useState(false);
  const [isTauri, setIsTauri] = useState(true);

  useEffect(() => {
    const checkTauri = () => {
      if (typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__) {
        return true;
      }
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        return true;
      }
      try {
        const currentWindow = getCurrentWindow();
        if (currentWindow) return true;
      } catch (e) { }
      return false;
    };

    setIsTauri(checkTauri());
  }, []);

  const showNotification = (message: string) => {
    setNotification(message);
    setTimeout(() => setNotification(''), 3000);
  };

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Error minimizing:', error);
    }
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (error) {
      console.error('Error maximizing:', error);
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Error closing:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#15161b] text-white">
      {/* Titlebar */}
      {isTauri ? (
        <header className="flex items-center justify-between h-11 bg-[#1c1d24] border-b border-white/5 select-none" style={{ WebkitAppRegion: 'drag' } as any}>
          {/* Logo z menu + przycisk sidebaru */}
          <div className="flex items-center h-full gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="relative">
              <button
                onClick={() => setShowAppMenu(!showAppMenu)}
                className="px-3 h-11 flex items-center gap-2 hover:bg-white/5 transition-colors"
              >
                <img src="../../src-tauri/icons/nexdeck_logo.png" alt="NexDeck" className="w-6 h-6" />
                <span className="text-sm font-extrabold text-[18px]">NexDeck</span>
              </button>

              {showAppMenu && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-[#1c1d24] border border-white/10 rounded-lg shadow-2xl py-1 z-50">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between">
                    <span>Nowy projekt</span>
                    <span className="text-xs text-white/40">Ctrl+N</span>
                  </button>
                  <button
                    onClick={() => {
                      showNotification('Zapisano!');
                      setShowAppMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between"
                  >
                    <span>Zapisz</span>
                    <span className="text-xs text-white/40">Ctrl+S</span>
                  </button>
                  <div className="h-px bg-white/10 my-1"></div>
                  <button
                    onClick={() => {
                      showNotification('Cofnięto');
                      setShowAppMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-white/5 flex items-center justify-between"
                  >
                    <span>Cofnij</span>
                    <span className="text-xs text-white/40">Ctrl+Z</span>
                  </button>
                </div>
              )}
            </div>

            {/* Przycisk toggle sidebaru */}
            <button
              onClick={() => setSidebarVisible(!sidebarVisible)}
              className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded transition-colors"
              title={sidebarVisible ? "Ukryj panel boczny" : "Pokaż panel boczny"}
            >
              <svg className="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {sidebarVisible ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </button>
          </div>

          {/* Wyśrodkowane przyciski widoków */}
          <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 transition-colors ${currentView === 'dashboard'
                  ? 'bg-[#5b9dff] text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
            >
              {/* <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg> */}
              <svg
  className="w-5 h-5"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  strokeWidth="1.8"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <rect x="3" y="3" width="8" height="8" rx="3" />
  <rect x="13" y="3" width="8" height="8" rx="3" />
  <rect x="3" y="13" width="8" height="8" rx="3" />
  <rect x="13" y="13" width="8" height="8" rx="3" />
</svg>

              <span>Dashboard</span>
            </button>
            <button
              onClick={() => setCurrentView('email')}
              className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 transition-colors ${currentView === 'email'
                  ? 'bg-[#5b9dff] text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="6" width="18" height="12" rx="3" />
                <path d="M4.5 8.5l7.5 5 7.5-5" />
              </svg>
              <span>Email</span>
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 transition-colors ${currentView === 'settings'
                  ? 'bg-[#5b9dff] text-white'
                  : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>Ustawienia</span>
            </button>
          </div>

          {/* Przyciski okna */}
          <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
              onClick={handleMinimize}
              className="w-12 h-full flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                <rect x="0" y="6" width="12" height="1" />
              </svg>
            </button>
            <button
              onClick={handleMaximize}
              className="w-12 h-full flex items-center justify-center hover:bg-white/5 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor">
                <rect x="1.5" y="1.5" width="9" height="9" strokeWidth="1" />
              </svg>
            </button>
            <button
              onClick={handleClose}
              className="w-12 h-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1">
                <path d="M1 1L11 11M11 1L1 11" />
              </svg>
            </button>
          </div>
        </header>
      ) : (
        <header className="flex items-center h-16 px-6 bg-[#1c1d24] border-b border-white/5">
          <h1 className="text-2xl font-bold">NexDeck</h1>
        </header>
      )}

      {showAppMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowAppMenu(false)}
        ></div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-[#1c1d24] border-r border-white/5 p-4 overflow-y-auto custom-scrollbar transition-all duration-200 ease-out ${sidebarVisible ? 'w-80 opacity-100' : 'w-0 opacity-0 p-0 border-r-0'
            }`}
          style={{
            transform: sidebarVisible ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <div className={`transition-opacity duration-150 ${sidebarVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Stats Cards - 2x2 grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {/* Inbox - Blue */}
              <div className="stat-card bg-[#4a7ba7]/20 backdrop-blur-sm border border-[#4a7ba7]/30 rounded-xl p-4 cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#5b9dff] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60">Inbox</span>
                </div>
                <div className="text-2xl font-bold">8</div>
              </div>

              {/* Today - Green */}
              <div className="stat-card bg-[#4a9b5e]/20 backdrop-blur-sm border border-[#4a9b5e]/30 rounded-xl p-4 cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#5db36e] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60">Today</span>
                </div>
                <div className="text-2xl font-bold flex items-center gap-2">
                  3
                  <span className="w-2 h-2 bg-[#5db36e] rounded-full animate-pulse"></span>
                </div>
              </div>

              {/* Scheduled - Purple */}
              <div className="stat-card bg-[#8b5ba7]/20 backdrop-blur-sm border border-[#8b5ba7]/30 rounded-xl p-4 cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#a87bc4] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60">Scheduled</span>
                </div>
                <div className="text-2xl font-bold">12</div>
              </div>

              {/* Pinboard - Red */}
              <div className="stat-card bg-[#b85555]/20 backdrop-blur-sm border border-[#b85555]/30 rounded-xl p-4 cursor-pointer">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-[#e16b6b] rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <span className="text-sm text-white/60">Pinboard</span>
                </div>
                <div className="text-2xl font-bold">5</div>
              </div>
            </div>

            {/* Labels - Horizontal cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-[#a87557] rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Labels</span>
                </div>
                <div className="text-xl font-bold text-white/40">18</div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-[#d9944d] rounded-lg flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <div className="text-xl font-bold text-white/40">3</div>
              </div>
            </div>

            {/* Favorites */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider px-2">Favorites</h3>
              <div className="space-y-1">
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">Multiplica</span>
                  </div>
                  <span className="text-sm text-white/40 group-hover:text-white/60">8</span>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm">Planify</span>
                  </div>
                  <span className="text-sm text-white/40 group-hover:text-white/60">86</span>
                </button>
              </div>
            </div>

            {/* On This Computer */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3 px-2">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">On This Computer</h3>
                <button className="text-white/40 hover:text-white/60 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div className="space-y-1">
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="text-sm">NexDeck</span>
                  </div>
                  <span className="text-sm text-white/40 group-hover:text-white/60">24</span>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                    </svg>
                    <span className="text-sm">Design System</span>
                  </div>
                  <span className="text-sm text-white/40 group-hover:text-white/60">11</span>
                </button>
              </div>
            </div>

            {/* User Account Section */}
            <div className="border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-3 px-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">kamil@nexis.pl</span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-white/40 hover:text-white/60 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  <button className="text-white/40 hover:text-white/60 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#5b9dff] rounded-full"></div>
                    <span className="text-sm">Inbox</span>
                  </div>
                </button>
                <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left group">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-[#5bb9cf] rounded-full"></div>
                    <span className="text-sm">Me</span>
                  </div>
                  <span className="text-sm text-white/40 group-hover:text-white/60">16</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#15161b]">
          {currentView === 'dashboard' && (
            <div className="p-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
                <p className="text-white/40 mb-8">Przegląd Twoich zadań i projektów</p>

                <div className="text-center py-20">
                  <svg className="w-20 h-20 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Dashboard - Wkrótce</h3>
                  <p className="text-white/40">Tutaj pojawi się przegląd Twoich zadań</p>
                </div>
              </div>
            </div>
          )}

          {currentView === 'email' && (
            <div className="p-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl font-bold mb-2">Projekty</h2>
                <p className="text-white/40 mb-8">Zarządzaj swoimi projektami</p>

                <div className="text-center py-20">
                  <svg className="w-20 h-20 mx-auto mb-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                  <h3 className="text-xl font-semibold mb-2">Projekty - Wkrótce</h3>
                  <p className="text-white/40">Tutaj będziesz mógł zarządzać projektami</p>
                </div>
              </div>
            </div>
          )}

          {currentView === 'settings' && (
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-2">Ustawienia</h2>
                <p className="text-white/40 mb-8">Dostosuj aplikację do swoich potrzeb</p>

                <div className="space-y-6">
                  <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Wygląd</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Motyw</label>
                        <select className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff]">
                          <option>Ciemny</option>
                          <option>Jasny</option>
                          <option>Automatyczny</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Język</label>
                        <select className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff]">
                          <option>Polski</option>
                          <option>English</option>
                          <option>Deutsch</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Powiadomienia</h3>
                    <div className="space-y-3">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Powiadomienia dźwiękowe</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#5b9dff]" defaultChecked />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Powiadomienia systemowe</span>
                        <input type="checkbox" className="w-5 h-5 accent-[#5b9dff]" defaultChecked />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {notification && (
        <div className="fixed bottom-6 right-6 bg-[#5b9dff] text-white px-6 py-4 rounded-lg shadow-2xl animate-slide-in z-50">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;