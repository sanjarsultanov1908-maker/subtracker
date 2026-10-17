import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  editData?: Subscription | null;
  rates: Record<string, number>;
}

const PRESETS = [
  { name: 'Netflix', icon: '🎬', category: 'Ko\'ngilochar', price: 9.99, currency: 'USD' },
  { name: 'Spotify', icon: '🎵', category: 'Musiqa', price: 4.99, currency: 'USD' },
  { name: 'YouTube', icon: '▶️', category: 'Ko\'ngilochar', price: 5.99, currency: 'USD' },
  { name: 'ChatGPT Plus', icon: '🤖', category: 'Ish va AI', price: 20, currency: 'USD' },
  { name: 'Telegram Premium', icon: '⭐️', category: 'Muloqot', price: 3.99, currency: 'USD' },
  { name: 'BeFit Sport', icon: '💪', category: 'Salomatlik', price: 350000, currency: 'UZS' },
  { name: 'iCloud 200GB', icon: '☁️', category: 'Bulutli xotira', price: 2.99, currency: 'USD' },
  { name: 'Uy ijarasi', icon: '🏠', category: 'Kommunal', price: 3000000, currency: 'UZS' },
];

const CATEGORIES = [
  'Ko\'ngilochar',
  'Musiqa',
  'Ish va AI',
  'Salomatlik',
  'Muloqot',
  'Bulutli xotira',
  'Kommunal',
  'Boshqa',
];

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editData,
  rates,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ko\'ngilochar');
  const [icon, setIcon] = useState('💳');
  const [price, setPrice] = useState<number | string>('');
  const [currency, setCurrency] = useState<'UZS' | 'USD' | 'EUR' | 'RUB'>('UZS');
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [firstBillDate, setFirstBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setCategory(editData.category);
      setIcon(editData.icon || '💳');
      setPrice(editData.price);
      setCurrency(editData.currency);
      setBillingCycle(editData.billingCycle);
      setFirstBillDate(new Date(editData.firstBillDate).toISOString().split('T')[0]);
    } else {
      setName('');
      setCategory('Ko\'ngilochar');
      setIcon('💳');
      setPrice('');
      setCurrency('UZS');
      setBillingCycle('MONTHLY');
      setFirstBillDate(new Date().toISOString().split('T')[0]);
    }
    setErrorMsg('');
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const currentRate = rates[currency] || 1;
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const calculatedUZS = currency === 'UZS' ? numPrice : Math.round(numPrice * currentRate);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    try {
      (window as any).Telegram?.WebApp?.HapticFeedback?.selectionChanged();
    } catch {
      // Ignored
    }
    setName(preset.name);
    setIcon(preset.icon);
    setCategory(preset.category);
    setPrice(preset.price);
    setCurrency(preset.currency as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Xizmat nomini kiriting');
      return;
    }
    if (!price || numPrice <= 0) {
      setErrorMsg('Iltimos, narxni to\'g\'ri kiriting');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSave({
        name: name.trim(),
        category,
        icon,
        price: numPrice,
        currency,
        billingCycle,
        firstBillDate: new Date(firstBillDate).toISOString(),
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md transition-all animate-fadeIn">
      <div className="w-full sm:max-w-lg bg-slate-950 border border-white/10 rounded-t-[32px] sm:rounded-3xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl relative">
        {/* Top Handle bar for mobile bottom-sheet feel */}
        <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.08]">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            {editData ? 'Obunani tahrirlash' : 'Yangi obuna qo\'shish'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Xatolik xabari */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tezkor presetlar */}
        {!editData && (
          <div className="mt-4">
            <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Ommabop xizmatlar (bir bosishda):
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-medium border whitespace-nowrap active:scale-95 transition-all ${
                    name === p.name
                      ? 'bg-indigo-600/30 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-white/[0.03] text-slate-300 border-white/[0.08] hover:bg-white/[0.07]'
                  }`}
                >
                  <span className="text-base">{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Nomi va Ikonka */}
          <div className="grid grid-cols-4 gap-2.5">
            <div className="col-span-1">
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Ikonka</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                className="w-full text-center py-2.5 bg-white/[0.04] border border-white/10 rounded-2xl text-xl text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Xizmat nomi</label>
              <input
                type="text"
                required
                placeholder="Netflix, Spotify, Fitnes..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-2xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Narxi va Valyutasi */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 block">Narxi va Valyutasi</label>
            <div className="grid grid-cols-5 gap-2">
              <div className="col-span-3">
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-2xl text-base text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div className="col-span-2">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as any)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-2xl text-sm text-white font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="UZS">UZS (so'm)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="RUB">RUB (₽)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Jonli Markaziy bank kursi ko'rsatgichi */}
          {currency !== 'UZS' && numPrice > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/40 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300 shadow-inner">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>CBU kursi (1 {currency} = {currentRate.toLocaleString()} UZS):</span>
              </div>
              <span className="font-extrabold text-white text-sm font-mono">
                ~{calculatedUZS.toLocaleString()} UZS
              </span>
            </div>
          )}

          {/* Kategoriya va Davr */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">Kategoriya</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 mb-1.5 block">To'lov davri</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MONTHLY">Oylik</option>
                <option value="YEARLY">Yillik</option>
              </select>
            </div>
          </div>

          {/* Ilk to'lov sanasi */}
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1.5 block">To'lov kuni (Sana)</label>
            <input
              type="date"
              value={firstBillDate}
              onChange={(e) => setFirstBillDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white/[0.04] border border-white/10 rounded-2xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Saqlash tugmasi */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="animate-pulse">Saqlanmoqda...</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{editData ? 'O\'zgarishlarni saqlash' : 'Obunani qo\'shish'}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
