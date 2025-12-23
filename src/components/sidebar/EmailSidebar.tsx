interface EmailSidebarProps {
  visible: boolean;
}

function EmailSidebar({ visible }: EmailSidebarProps) {
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
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-[#5b9dff]/20 backdrop-blur-sm border border-[#5b9dff]/30 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">Nieprzeczytane</div>
            <div className="text-2xl font-bold">12</div>
          </div>
          <div className="bg-[#5db36e]/20 backdrop-blur-sm border border-[#5db36e]/30 rounded-xl p-4">
            <div className="text-sm text-white/60 mb-1">Wysłane</div>
            <div className="text-2xl font-bold">48</div>
          </div>
        </div>

        {/* Mailboxes */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider px-2">Skrzynki</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-[#5b9dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <span className="text-sm font-medium">Odebrane</span>
              </div>
              <span className="text-sm bg-[#5b9dff] px-2 py-0.5 rounded-full">12</span>
            </button>
            
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                <span className="text-sm">Wysłane</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">48</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                <span className="text-sm">Robocze</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">3</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-sm">Ważne</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">7</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-sm">Kosz</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">15</span>
            </button>
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

        {/* Filters */}
        <div className="mb-6">
          <h3 className="text-xs font-semibold text-white/40 mb-3 uppercase tracking-wider px-2">Filtry</h3>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="text-sm">Z załącznikami</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">18</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-sm">Grupowe</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">31</span>
            </button>

            <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left group">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">Dziś</span>
              </div>
              <span className="text-sm text-white/40 group-hover:text-white/60">5</span>
            </button>
          </div>
        </div>

        {/* Account Info */}
        <div className="border-t border-white/5 pt-4">
          <div className="px-2 mb-3">
            <div className="text-xs text-white/40 mb-1">Aktywne konto</div>
            <div className="text-sm font-medium">kamil@nexis.pl</div>
          </div>
          <div className="bg-white/5 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/60">Wykorzystane miejsce</span>
              <span className="text-xs font-medium">2.3 GB / 15 GB</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-1.5">
              <div className="bg-[#5b9dff] h-1.5 rounded-full" style={{ width: '15%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default EmailSidebar;