import { CreditCard, Calendar, Users, BarChart3, Plus } from 'lucide-react';

interface NavbarProps {
  activeTab: 'subscriptions' | 'calendar' | 'groups' | 'analytics';
  setActiveTab: (tab: 'subscriptions' | 'calendar' | 'groups' | 'analytics') => void;
  onOpenAddModal: () => void;
  user: { firstName: string; username?: string };
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  user,
}) => {
  const triggerHaptic = () => {
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } catch {
      // Ignored
    }
  };

  const handleTabClick = (tab: typeof activeTab) => {
    triggerHaptic();
    setActiveTab(tab);
  };

  return (
    <>
      {/* Yuqori zamonaviy Header */}
      <header className="sticky top-0 z-40 bg-slate-950/70 backdrop-blur-2xl border-b border-white/[0.07] px-4 py-3.5 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/25">
                <div className="w-full h-full bg-slate-950/90 rounded-[14px] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-indigo-400" />
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-white text-base tracking-tight">
                  SubTracker
                </h1>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {user.firstName || 'Foydalanuvchi'}
                {user.username && <span className="text-slate-500 text-[11px] ml-1">@{user.username}</span>}
              </p>
            </div>
          </div>

          {/* Yangi obuna qo'shish neon tugmasi */}
          <button
            onClick={() => {
              triggerHaptic();
              onOpenAddModal();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Qo'shish</span>
          </button>
        </div>
      </header>

      {/* Pastki zamonaviy suzuvchi navigatsiya dock (Dock Navigation) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 px-3 pb-4 pt-1 pointer-events-none">
        <div className="max-w-md mx-auto pointer-events-auto">
          <div className="bg-slate-950/85 backdrop-blur-3xl border border-white/[0.08] rounded-3xl p-1.5 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.8)] grid grid-cols-4 gap-1">
            <button
              onClick={() => handleTabClick('subscriptions')}
              className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'subscriptions'
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 text-white font-bold border border-indigo-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <CreditCard className={`w-5 h-5 ${activeTab === 'subscriptions' ? 'text-indigo-400' : ''}`} />
              <span className="text-[10px]">Obunalar</span>
            </button>

            <button
              onClick={() => handleTabClick('calendar')}
              className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'calendar'
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 text-white font-bold border border-indigo-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Calendar className={`w-5 h-5 ${activeTab === 'calendar' ? 'text-indigo-400' : ''}`} />
              <span className="text-[10px]">Taqvim</span>
            </button>

            <button
              onClick={() => handleTabClick('groups')}
              className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'groups'
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 text-white font-bold border border-indigo-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <Users className={`w-5 h-5 ${activeTab === 'groups' ? 'text-indigo-400' : ''}`} />
              <span className="text-[10px]">Guruhlar</span>
            </button>

            <button
              onClick={() => handleTabClick('analytics')}
              className={`relative flex flex-col items-center gap-1 py-2 rounded-2xl transition-all duration-200 ${
                activeTab === 'analytics'
                  ? 'bg-gradient-to-b from-indigo-600/30 to-purple-600/20 text-white font-bold border border-indigo-500/30 shadow-inner'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.02]'
              }`}
            >
              <BarChart3 className={`w-5 h-5 ${activeTab === 'analytics' ? 'text-indigo-400' : ''}`} />
              <span className="text-[10px]">Tahlil</span>
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
