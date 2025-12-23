import EmailSidebar from '../components/sidebar/EmailSidebar';

interface EmailProps {
  sidebarVisible: boolean;
}

function Email({ sidebarVisible }: EmailProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <EmailSidebar visible={sidebarVisible} />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#15161b]">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Email</h2>
                <p className="text-white/40">Zarządzaj swoimi wiadomościami</p>
              </div>
              <button className="px-4 py-2 bg-[#5b9dff] hover:bg-[#4a8ce6] rounded-lg flex items-center gap-2 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Nowa wiadomość
              </button>
            </div>

            {/* Email List */}
            <div className="space-y-3">
              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5b9dff] rounded-full flex items-center justify-center text-sm font-semibold">
                      JK
                    </div>
                    <div>
                      <h4 className="font-semibold">Jan Kowalski</h4>
                      <p className="text-sm text-white/40">jan.kowalski@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">10:30</span>
                </div>
                <h5 className="font-medium mb-2">Spotkanie w sprawie projektu NexDeck</h5>
                <p className="text-sm text-white/60 line-clamp-2">
                  Cześć! Chciałbym umówić się na spotkanie w sprawie omówienia dalszych kroków w projekcie NexDeck...
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 text-xs bg-[#5b9dff]/20 text-[#5b9dff] rounded">Praca</span>
                  <span className="px-2 py-1 text-xs bg-[#e16b6b]/20 text-[#e16b6b] rounded">Ważne</span>
                </div>
              </div>

              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer opacity-60">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#5db36e] rounded-full flex items-center justify-center text-sm font-semibold">
                      AN
                    </div>
                    <div>
                      <h4 className="font-semibold">Anna Nowak</h4>
                      <p className="text-sm text-white/40">anna.nowak@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">Wczoraj</span>
                </div>
                <h5 className="font-medium mb-2">Raport miesięczny</h5>
                <p className="text-sm text-white/60 line-clamp-2">
                  Załączam raport z ostatniego miesiąca. Proszę o przejrzenie i feedback do końca tygodnia.
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 text-xs bg-[#a87bc4]/20 text-[#a87bc4] rounded">Raporty</span>
                </div>
              </div>

              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer opacity-60">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#d9944d] rounded-full flex items-center justify-center text-sm font-semibold">
                      PW
                    </div>
                    <div>
                      <h4 className="font-semibold">Piotr Wiśniewski</h4>
                      <p className="text-sm text-white/40">piotr.w@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">2 dni temu</span>
                </div>
                <h5 className="font-medium mb-2">Aktualizacja systemu</h5>
                <p className="text-sm text-white/60 line-clamp-2">
                  Informuję, że planowana jest aktualizacja systemu w najbliższy weekend. Proszę o zapisanie pracy...
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 text-xs bg-[#5b9dff]/20 text-[#5b9dff] rounded">IT</span>
                </div>
              </div>

              <div className="bg-[#1c1d24] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors cursor-pointer opacity-60">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#a87557] rounded-full flex items-center justify-center text-sm font-semibold">
                      MK
                    </div>
                    <div>
                      <h4 className="font-semibold">Marta Kowalczyk</h4>
                      <p className="text-sm text-white/40">marta.k@example.com</p>
                    </div>
                  </div>
                  <span className="text-xs text-white/40">3 dni temu</span>
                </div>
                <h5 className="font-medium mb-2">Zaproszenie na webinar</h5>
                <p className="text-sm text-white/60 line-clamp-2">
                  Zapraszam na webinar dotyczący najnowszych trendów w rozwoju aplikacji. Odbędzie się w przyszły czwartek...
                </p>
                <div className="flex gap-2 mt-3">
                  <span className="px-2 py-1 text-xs bg-[#5db36e]/20 text-[#5db36e] rounded">Szkolenia</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default Email;