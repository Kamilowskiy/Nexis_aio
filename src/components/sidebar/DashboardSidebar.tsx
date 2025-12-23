interface DashboardSidebarProps {
  visible: boolean;
}

function DashboardSidebar({ visible }: DashboardSidebarProps) {
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
  );
}

export default DashboardSidebar;