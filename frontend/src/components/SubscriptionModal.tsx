import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
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
  { name: 'YouTube Premium', icon: '▶️', category: 'Ko\'ngilochar', price: 5.99, currency: 'USD' },
  { name: 'ChatGPT Plus', icon: '🤖', category: 'Ish va AI', price: 20, currency: 'USD' },
  { name: 'Telegram Premium', icon: '⭐️', category: 'Muloqot', price: 3.99, currency: 'USD' },
  { name: 'Fitnes Klub', icon: '💪', category: 'Salomatlik', price: 350000, currency: 'UZS' },
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
  }, [editData, isOpen]);

  if (!isOpen) return null;

  const currentRate = rates[currency] || 1;
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  const calculatedUZS = currency === 'UZS' ? numPrice : Math.round(numPrice * currentRate);

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setName(preset.name);
    setIcon(preset.icon);
    setCategory(preset.category);
    setPrice(preset.price);
    setCurrency(preset.currency as any);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;

    setIsSubmitting(true);
    try {
      await onSave({
        name,
        category,
        icon,
        price: numPrice,
        currency,
        billingCycle,
        firstBillDate: new Date(firstBillDate).toISOString(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            {editData ? 'Obunani tahrirlash' : 'Yangi obuna qo\'shish'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tezkor presetlar */}
        {!editData && (
          <div className="mt-4">
            <label className="text-xs font-medium text-slate-400 flex items-center gap-1 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Tezkor tanlash:
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handlePresetSelect(p)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs text-slate-200 border border-slate-700/60 whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>{p.icon}</span>
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Nomi va Ikonka */}
          <div className="grid grid-cols-4 gap-2">
            <div className="col-span-1">
              <label className="text-xs text-slate-400 mb-1 block">Ikonka</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={2}
                className="w-full text-center py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-lg text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="col-span-3">
              <label className="text-xs text-slate-400 mb-1 block">Xizmat nomi</label>
              <input
                type="text"
                required
                placeholder="Masalan: Netflix"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Narxi va Valyutasi */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-slate-400 mb-1 block">Narxi</label>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Valyuta</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="UZS">UZS (so'm)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="RUB">RUB (₽)</option>
              </select>
            </div>
          </div>

          {/* CBU Valyuta Konvertatsiya axboroti */}
          {currency !== 'UZS' && numPrice > 0 && (
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
              <span>Markaziy bank kursi (~{currentRate.toLocaleString()} UZS):</span>
              <span className="font-bold text-white text-sm">~{calculatedUZS.toLocaleString()} UZS</span>
            </div>
          )}

          {/* Kategoriya va Davr */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Kategoriya</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">To'lov davri</label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as any)}
                className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MONTHLY">Oylik</option>
                <option value="YEARLY">Yillik</option>
              </select>
            </div>
          </div>

          {/* Ilk to'lov sanasi */}
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Birinchi to'lov sanasi</label>
            <input
              type="date"
              value={firstBillDate}
              onChange={(e) => setFirstBillDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Saqlash tugmasi */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {isSubmitting ? 'Saqlanmoqda...' : editData ? 'O\'zgarishlarni saqlash' : 'Obunani saqlash'}
          </button>
        </form>
      </div>
    </div>
  );
};
