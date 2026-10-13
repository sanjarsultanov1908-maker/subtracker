import { useState, useEffect } from 'react';
import { api, getTelegramUser } from './services/api';
import { Subscription, AnalyticsData, SubscriptionGroup } from './types';
import { Navbar } from './components/Navbar';
import { SubscriptionCard } from './components/SubscriptionCard';
import { SubscriptionModal } from './components/SubscriptionModal';
import { CalendarView } from './components/CalendarView';
import { GroupView } from './components/GroupView';
import { AnalyticsView } from './components/AnalyticsView';
import { AlertCircle, Plus, Search } from 'lucide-react';

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
  const [limitAlert, setLimitAlert] = useState<string | null>(null);

  // Telegram WebApp initial expansion
  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      // Mavzu ranglarini moslash
      if (tg.setHeaderColor) tg.setHeaderColor('#0b0f19');
      if (tg.setBackgroundColor) tg.setBackgroundColor('#0b0f19');
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
      } else {
        const res = await api.createSubscription({
          ...formData,
          telegramId: user.telegramId,
          firstName: user.firstName,
        });

        if (res.limitWarning) {
          setLimitAlert(res.limitWarning.message);
          setTimeout(() => setLimitAlert(null), 7000);
        }
      }
      setEditingSub(null);
      await loadData();
    } catch (err) {
      console.error('Saqlashda xatolik:', err);
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    if (!confirm('Haqiqatdan ham ushbu obunani o\'chirmoqchimisiz?')) return;
    try {
      await api.deleteSubscription(id);
      await loadData();
    } catch (err) {
      console.error('O\'chirishda xatolik:', err);
    }
  };

  const handleEditClick = (sub: Subscription) => {
    setEditingSub(sub);
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
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 selection:bg-indigo-500 selection:text-white">
      {/* Yuqori qism & Navigatsiya */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          setEditingSub(null);
          setIsModalOpen(true);
        }}
        user={user}
      />

      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Limit oshib ketgandagi xabarnoma */}
        {limitAlert && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs shadow-lg animate-bounce">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{limitAlert}</span>
          </div>
        )}

        {/* 1. OBUNALAR TABI */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {/* Tezkor statistik vidjet */}
            <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/60 border border-indigo-800/40 rounded-3xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs text-indigo-300/80 font-medium">Oylik jami to'lov</span>
                  <div className="text-2xl font-black text-white mt-0.5 font-mono tracking-tight">
                    {analytics.totalMonthlyUZS.toLocaleString()}{' '}
                    <span className="text-sm font-semibold text-indigo-300">UZS</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                    <span>Faol: <b className="text-slate-200">{subscriptions.length} ta</b></span>
                    <span>•</span>
                    <span>Yillik: <b className="text-slate-200">{analytics.totalYearlyUZS.toLocaleString()} UZS</b></span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-lg shadow-inner">
                  💰
                </div>
              </div>

              {/* Markaziy bank kursi ko'rsatgichi */}
              <div className="mt-3 pt-3 border-t border-indigo-800/30 flex items-center justify-between text-[11px] text-indigo-200/80">
                <span>CBU kursi: 1 USD = {rates['USD']?.toLocaleString() || '12,850'} UZS</span>
                <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full">Jonli</span>
              </div>
            </div>

            {/* Qidiruv va Filtr */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Obunalar bo'yicha qidirish..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 backdrop-blur-md"
                />
              </div>

              {/* Kategoriya pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['ALL', 'Ko\'ngilochar', 'Musiqa', 'Ish va AI', 'Salomatlik', 'Kommunal'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-3 py-1 rounded-xl whitespace-nowrap transition-all ${
                      filterCategory === cat
                        ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                    }`}
                  >
                    {cat === 'ALL' ? 'Barchasi' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Obunalar ro'yxati */}
            {isLoading ? (
              <div className="text-center py-12 text-slate-500 text-xs animate-pulse">
                Ma'lumotlar yuklanmoqda...
              </div>
            ) : filteredSubs.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-2xl mx-auto mb-3">
                  ✨
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Obunalar topilmadi</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Raqamli yoki kundalik xarajatlaringizni nazorat qilish uchun yangi obuna qo'shing
                </p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" /> Yangi obuna qo'shish
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
