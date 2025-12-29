import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './App.css';
import Dashboard from './pages/Dashboard';
import Email from './pages/Email';
import Settings from './pages/Settings';
import SegmentedControl from './components/Segmentedcontrol';
import type { SegmentedControlOption } from './components/Segmentedcontrol';


type View = 'dashboard' | 'email' | 'settings';

const viewOptions: SegmentedControlOption<View>[] = [
  {
    value: 'dashboard',
    label: 'Dashboard',
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="3" width="8" height="8" rx="2" />
        <rect x="13" y="3" width="8" height="8" rx="2" />
        <rect x="3" y="13" width="8" height="8" rx="2" />
        <rect x="13" y="13" width="8" height="8" rx="2" />
      </svg>
    ),
  },
  {
    value: 'email',
    label: 'Email',
    icon: (
      <svg
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M4.5 8.5l7.5 5 7.5-5" />
      </svg>
    ),
  },
  {
    value: 'settings',
    label: 'Ustawienia',
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        strokeWidth="1.8"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
];

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
                <img src="../../src-tauri/icons/nexdeck_logo_full.png" alt="NexDeck" className="w-[130px]" />
                {/* <span className="text-sm font-extrabold text-[18px]">NexDeck</span> */}
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

          {/* Wyśrodkowany SegmentedControl */}
          <div className="absolute left-1/2 transform -translate-x-1/2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <SegmentedControl
              options={viewOptions}
              value={currentView}
              onChange={setCurrentView}
            />
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

      {/* Conditional View Rendering */}
      {currentView === 'dashboard' && <Dashboard sidebarVisible={sidebarVisible} />}
      {currentView === 'email' && <Email sidebarVisible={sidebarVisible} />}
      {currentView === 'settings' && <Settings sidebarVisible={sidebarVisible} />}

      {notification && (
        <div className="fixed bottom-6 right-6 bg-[#5b9dff] text-white px-6 py-4 rounded-lg shadow-2xl animate-slide-in z-50">
          {notification}
        </div>
      )}
    </div>
  );
}

export default App;