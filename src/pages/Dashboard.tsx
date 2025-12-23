import DashboardSidebar from '../components/sidebar/DashboardSidebar';

interface DashboardProps {
  sidebarVisible: boolean;
}

function Dashboard({ sidebarVisible }: DashboardProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <DashboardSidebar visible={sidebarVisible} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#15161b]">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
            <p className="text-white/40 mb-8">Przegląd Twoich zadań i projektów</p>

            {/* Today's Tasks */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Dzisiejsze zadania</h3>
              <div className="space-y-3">
                <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="w-5 h-5 mt-0.5 accent-[#5b9dff] rounded" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Spotkanie z zespołem</h4>
                      <p className="text-sm text-white/40">10:00 - 11:00</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-[#5db36e]/20 text-[#5db36e] rounded">Pilne</span>
                  </div>
                </div>
                
                <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="w-5 h-5 mt-0.5 accent-[#5b9dff] rounded" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Przegląd kodu</h4>
                      <p className="text-sm text-white/40">14:00 - 15:00</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-[#a87bc4]/20 text-[#a87bc4] rounded">Średnie</span>
                  </div>
                </div>

                <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" className="w-5 h-5 mt-0.5 accent-[#5b9dff] rounded" />
                    <div className="flex-1">
                      <h4 className="font-medium mb-1">Dokumentacja projektu</h4>
                      <p className="text-sm text-white/40">16:00 - 17:30</p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-[#5b9dff]/20 text-[#5b9dff] rounded">Normalne</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Ostatnie projekty</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#5b9dff]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5b9dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">NexDeck</h4>
                      <p className="text-xs text-white/40">24 zadania</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                    <div className="bg-[#5b9dff] h-2 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <p className="text-xs text-white/40">65% ukończone</p>
                </div>

                <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#5db36e]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#5db36e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">Design System</h4>
                      <p className="text-xs text-white/40">11 zadań</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                    <div className="bg-[#5db36e] h-2 rounded-full" style={{ width: '45%' }}></div>
                  </div>
                  <p className="text-xs text-white/40">45% ukończone</p>
                </div>

                <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-[#a87bc4]/20 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#a87bc4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold">Multiplica</h4>
                      <p className="text-xs text-white/40">8 zadań</p>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                    <div className="bg-[#a87bc4] h-2 rounded-full" style={{ width: '80%' }}></div>
                  </div>
                  <p className="text-xs text-white/40">80% ukończone</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;