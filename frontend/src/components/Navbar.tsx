import React from 'react';
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
  return (
    <>
      {/* Yuqori Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-lg border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-slate-100 text-sm tracking-tight flex items-center gap-1.5">
                SubTracker
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-medium">
                  TMA
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Salom, {user.firstName || 'Foydalanuvchi'} 👋
              </p>
            </div>
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </button>
        </div>
      </header>

      {/* Pastki Navigatsiya Bar (Telegram Mini App uslubida) */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 pb-safe">
        <div className="max-w-md mx-auto grid grid-cols-4 px-2 py-2">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'subscriptions'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="text-[10px]">Obunalar</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'calendar'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px]">Taqvim</span>
          </button>

          <button
            onClick={() => setActiveTab('groups')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'groups'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px]">Guruhlar</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'text-indigo-400 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px]">Tahlil</span>
          </button>
        </div>
      </nav>
    </>
  );
};
