import { useState, useEffect } from 'react';
import { api, getTelegramUser } from './services/api';
import { Subscription, AnalyticsData, SubscriptionGroup } from './types';
import { Navbar } from './components/Navbar';
import { SubscriptionCard } from './components/SubscriptionCard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { CalendarView } from './components/CalendarView';
import { GroupView } from './components/GroupView';
import { AnalyticsView } from './components/AnalyticsView';
import { AlertCircle, Plus, Search, Sparkles, Wallet, CheckCircle2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'calendar' | 'groups' | 'analytics'>('subscriptions');
  const [user] = useState(getTelegramUser());
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [groups, setGroups] = useState<SubscriptionGroup[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalMonthlyUZS: 0,
    totalYearlyUZS: 0,
    count: 0,
    monthlyBudget: 0,
    budgetPercent: 0,
    categoryBreakdown: {},
    unusedSavings: 0,
  });
  const [rates, setRates] = useState<Record<string, number>>({ USD: 12850, EUR: 13950, RUB: 135, UZS: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
    try {
      const haptic = (window as any).Telegram?.WebApp?.HapticFeedback;
      if (type === 'success') haptic?.notificationOccurred('success');
      else if (type === 'error') haptic?.notificationOccurred('error');
      else haptic?.notificationOccurred('warning');
    } catch {
      // Ignored
    }
    setTimeout(() => setToast(null), 4500);
  };

  // Telegram WebApp initial expansion
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      if (tg.setHeaderColor) tg.setHeaderColor('#080c16');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#080c16');
    }
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedRates, fetchedSubs, fetchedAnalytics, fetchedGroups] = await Promise.all([
        api.getRates().catch(() => ({ USD: 12850, EUR: 13950, RUB: 135, UZS: 1 })),
        api.getSubscriptions(user.telegramId).catch(() => []),
        api.getAnalytics(user.telegramId).catch(() => ({
          totalMonthlyUZS: 0,
          totalYearlyUZS: 0,
          count: 0,
          monthlyBudget: 0,
          budgetPercent: 0,
          categoryBreakdown: {},
          unusedSavings: 0,
        })),
        api.getGroups(user.telegramId).catch(() => []),
      ]);

      setRates(fetchedRates);
      setSubscriptions(fetchedSubs);
      setAnalytics(fetchedAnalytics);
      setGroups(fetchedGroups);
    } catch (err) {
      console.error('Ma\'lumotlarni yuklashda xatolik:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSubscription = async (formData: any) => {
    try {
      if (editingSub) {
        await api.updateSubscription(editingSub.id, formData);
        showToast('✅ Obuna o\'zgarishlari saqlandi!', 'success');
      } else {
        const res = await api.createSubscription({
          ...formData,
          telegramId: user.telegramId,
          firstName: user.firstName,
        });

        if (res.limitWarning) {
          showToast(res.limitWarning.message, 'warning');
        } else {
          showToast('🎉 Yangi obuna muvaffaqiyatli qo\'shildi!', 'success');
        }
      }
      setEditingSub(null);
      await loadData();
    } catch (err: any) {
      console.error('Saqlashda xatolik:', err);
      showToast('⚠️ Obunani saqlashda xatolik yuz berdi: ' + (err.response?.data?.error || err.message), 'error');
      throw err;
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Haqiqatdan ham ushbu obunani o\'chirmoqchimisiz?')) return;
    try {
      await api.deleteSubscription(id);
      showToast('🗑 Obuna o\'chirildi', 'success');
      await loadData();
    } catch (err) {
      console.error('O\'chirishda xatolik:', err);
      showToast('O\'chirishda xatolik', 'error');
    }
  };

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleQuickAdd = (preset: { name: string; icon: string; category: string; price: number; currency: 'USD' | 'UZS' }) => {
    setEditingSub({
      id: '',
      userId: '',
      name: preset.name,
      category: preset.category,
      icon: preset.icon,
      price: preset.price,
      currency: preset.currency,
      priceInUZS: preset.price * (rates[preset.currency] || 1),
      billingCycle: 'MONTHLY',
      firstBillDate: new Date().toISOString(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isShared: false,
      isActive: true,
    });
    setIsModalOpen(true);
  };

  // Filtrlar
  const filteredSubs = subscriptions.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === 'ALL' || s.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#080c16] text-slate-100 pb-28 selection:bg-indigo-500 selection:text-white">
      {/* Yuqori Header & Navigatsiya */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingSub(null);
          setIsModalOpen(true);
        }}
        user={user}
      />

      <main className="max-w-md mx-auto px-4 pt-3.5 space-y-4">
        {/* Toast bildirishnoma */}
        {toast && (
          <div
            className={`fixed top-16 left-4 right-4 z-50 p-3.5 rounded-2xl border shadow-2xl flex items-center gap-2.5 text-xs font-semibold backdrop-blur-xl animate-fadeIn ${
              toast.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                : toast.type === 'warning'
                ? 'bg-amber-950/80 border-amber-500/40 text-amber-200 shadow-amber-950/50'
                : 'bg-rose-950/80 border-rose-500/40 text-rose-200 shadow-rose-950/50'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            )}
            <span className="leading-tight">{toast.message}</span>
          </div>
        )}

        {/* 1. OBUNALAR TABI */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {/* Asosiy Premium Hero Balans Kartochkasi */}
            <div className="relative overflow-hidden rounded-[30px] p-5 border border-white/[0.09] bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900/60 shadow-[0_10px_40px_-10px_rgba(79,70,229,0.25)] backdrop-blur-2xl">
              <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between text-xs text-indigo-200/80 mb-1">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-indigo-400" /> Oylik jami xarajat
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.08] text-[10px] font-bold text-slate-300">
                    {subscriptions.length} ta obuna
                  </span>
                </div>

                <div className="text-3xl font-black text-white font-mono tracking-tight mt-1 flex items-baseline gap-2">
                  <span>{analytics.totalMonthlyUZS.toLocaleString()}</span>
                  <span className="text-sm font-bold text-indigo-300 font-sans">UZS</span>
                </div>

                {/* Progress va Byudjet */}
                {analytics.monthlyBudget > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Limit: {analytics.monthlyBudget.toLocaleString()} UZS</span>
                      <span className={analytics.totalMonthlyUZS > analytics.monthlyBudget ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                        {analytics.budgetPercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          analytics.totalMonthlyUZS > analytics.monthlyBudget
                            ? 'bg-rose-500'
                            : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${Math.min(100, analytics.budgetPercent)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tezkor CBU Valyuta kursi */}
                <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-medium">CBU kursi: 1 USD ≈ {rates['USD']?.toLocaleString() || '12,850'} UZS</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-300">Jonli</span>
                </div>
              </div>
            </div>

            {/* Qidiruv va Filtrlar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Obuna nomi bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/[0.035] border border-white/[0.08] rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 backdrop-blur-xl transition-all"
                />
              </div>

              {/* Kategoriya pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['ALL', 'Ko\'ngilochar', 'Musiqa', 'Ish va AI', 'Salomatlik', 'Kommunal'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1.5 rounded-2xl whitespace-nowrap text-xs font-semibold transition-all ${
                      filterCategory === cat
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white/[0.03] text-slate-400 hover:text-slate-200 border border-white/[0.07]'
                    }`}
                  >
                    {cat === 'ALL' ? 'Barchasi' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Obunalar ro'yxati */}
            {isLoading ? (
              <div className="text-center py-14 text-slate-500 text-xs font-medium animate-pulse flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" /> Obunalar yuklanmoqda...
              </div>
            ) : filteredSubs.length === 0 ? (
              /* Yangi chiroyli tezkor boshlash bloki (Quick Start) */
              <div className="rounded-[30px] p-6 border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] backdrop-blur-2xl text-center space-y-4">
                <div className="w-14 h-14 rounded-3xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-center text-3xl mx-auto shadow-inner">
                  ✨
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Hozircha obuna qo'shilmagan</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Xarajatlaringizni nazorat qilish va to'lov kunlarini eslatib turish uchun obunangizni qo'shing:
                  </p>
                </div>

                {/* 1 bosishda tezkor qo'shish tugmalari */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-left">
                  <button
                    onClick={() => handleQuickAdd({ name: 'Netflix', icon: '🎬', category: 'Ko\'ngilochar', price: 9.99, currency: 'USD' })}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-2.5 transition-all active:scale-95"
                  >
                    <span className="text-2xl">🎬</span>
                    <div>
                      <div className="text-xs font-bold text-white">Netflix</div>
                      <div className="text-[10px] text-indigo-400 font-mono">$9.99 / oy</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAdd({ name: 'Spotify', icon: '🎵', category: 'Musiqa', price: 4.99, currency: 'USD' })}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-2.5 transition-all active:scale-95"
                  >
                    <span className="text-2xl">🎵</span>
                    <div>
                      <div className="text-xs font-bold text-white">Spotify</div>
                      <div className="text-[10px] text-indigo-400 font-mono">$4.99 / oy</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAdd({ name: 'ChatGPT Plus', icon: '🤖', category: 'Ish va AI', price: 20, currency: 'USD' })}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-2.5 transition-all active:scale-95"
                  >
                    <span className="text-2xl">🤖</span>
                    <div>
                      <div className="text-xs font-bold text-white">ChatGPT Plus</div>
                      <div className="text-[10px] text-indigo-400 font-mono">$20.00 / oy</div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleQuickAdd({ name: 'Fitnes Klub', icon: '💪', category: 'Salomatlik', price: 350000, currency: 'UZS' })}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] flex items-center gap-2.5 transition-all active:scale-95"
                  >
                    <span className="text-2xl">💪</span>
                    <div>
                      <div className="text-xs font-bold text-white">Fitnes</div>
                      <div className="text-[10px] text-emerald-400 font-mono">350,000 UZS</div>
                    </div>
                  </button>
                </div>

                <button
                  onClick={() => {
                    setEditingSub(null);
                    setIsModalOpen(true);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Boshqa yangi obuna kiritish</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubs.map((sub) => (
                  <SubscriptionCard
                    key={sub.id}
                    subscription={sub}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteSubscription}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. TAQVIM TABI */}
        {activeTab === 'calendar' && <CalendarView telegramId={user.telegramId} />}

        {/* 3. GURUHLAR VA FAMILY SHARING TABI */}
        {activeTab === 'groups' && (
          <GroupView
            groups={groups}
            subscriptions={subscriptions}
            currentUserTelegramId={user.telegramId}
            onRefresh={loadData}
          />
        )}

        {/* 4. SMART ANALYTICS TABI */}
        {activeTab === 'analytics' && (
          <AnalyticsView
            analytics={analytics}
            telegramId={user.telegramId}
            onRefresh={loadData}
          />
        )}
      </main>

      {/* Obuna qo'shish / tahrirlash modal oynasi */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveSubscription}
        editData={editingSub}
        rates={rates}
      />
    </div>
  );
}

export default App;
