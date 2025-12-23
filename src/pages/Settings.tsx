import SettingsSidebar from '../components/sidebar/SettingsSidebar';

interface SettingsProps {
  sidebarVisible: boolean;
}

function Settings({ sidebarVisible }: SettingsProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <SettingsSidebar visible={sidebarVisible} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#15161b]">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-2">Ustawienia</h2>
            <p className="text-white/40 mb-8">Dostosuj aplikację do swoich potrzeb</p>

            <div className="space-y-6">
              {/* Wygląd */}
              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Wygląd
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Motyw</label>
                    <select className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors">
                      <option>Ciemny</option>
                      <option>Jasny</option>
                      <option>Automatyczny</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Język</label>
                    <select className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors">
                      <option>Polski</option>
                      <option>English</option>
                      <option>Deutsch</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Rozmiar czcionki</label>
                    <select className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors">
                      <option>Mała</option>
                      <option>Średnia</option>
                      <option>Duża</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Powiadomienia */}
              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Powiadomienia
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Powiadomienia dźwiękowe</span>
                    <input type="checkbox" className="w-5 h-5 accent-[#5b9dff]" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Powiadomienia systemowe</span>
                    <input type="checkbox" className="w-5 h-5 accent-[#5b9dff]" defaultChecked />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Powiadomienia email</span>
                    <input type="checkbox" className="w-5 h-5 accent-[#5b9dff]" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors">
                    <span>Przypomnienia o zadaniach</span>
                    <input type="checkbox" className="w-5 h-5 accent-[#5b9dff]" defaultChecked />
                  </label>
                </div>
              </div>

              {/* Konto */}
              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Konto
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Email</label>
                    <input 
                      type="email" 
                      value="kamil@nexis.pl" 
                      disabled
                      className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg text-white/40 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Nazwa użytkownika</label>
                    <input 
                      type="text" 
                      defaultValue="Kamil"
                      className="w-full px-4 py-2 bg-[#15161b] border border-white/10 rounded-lg focus:outline-none focus:border-[#5b9dff] transition-colors"
                    />
                  </div>
                  <button className="w-full px-4 py-2 bg-[#5b9dff] hover:bg-[#4a8ce6] rounded-lg transition-colors">
                    Zapisz zmiany
                  </button>
                </div>
              </div>

              {/* Zaawansowane */}
              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Zaawansowane
                </h3>
                <div className="space-y-3">
                  <button className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left">
                    Wyczyść pamięć podręczną
                  </button>
                  <button className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left">
                    Eksportuj dane
                  </button>
                  <button className="w-full px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-left">
                    Usuń konto
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Settings;