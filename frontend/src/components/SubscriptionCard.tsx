import React from 'react';
import { Calendar, Users, AlertCircle, Trash2, Edit2, Clock } from 'lucide-react';
import { Subscription } from '../types';

interface SubscriptionCardProps {
  subscription: Subscription;
  onEdit: (sub: Subscription) => void;
  onDelete: (id: string) => void;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({
  subscription,
  onEdit,
  onDelete,
}) => {
  const nextDate = new Date(subscription.nextBillingDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  nextDate.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((nextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Inactivity check (> 30 days)
  const isInactive = subscription.lastUsedDate && 
    (now.getTime() - new Date(subscription.lastUsedDate).getTime()) / (1000 * 60 * 60 * 24) >= 30;

  let badgeColor = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let badgeText = `${diffDays} kun qoldi`;

  if (diffDays === 0) {
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse font-bold';
    badgeText = '⚡️ Bugun to\'lov!';
  } else if (diffDays === 1) {
    badgeColor = 'bg-orange-500/20 text-orange-300 border-orange-500/40 font-bold';
    badgeText = '🔥 Ertaga to\'lov';
  } else if (diffDays <= 3 && diffDays > 1) {
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold';
    badgeText = `⏳ ${diffDays} kun qoldi`;
  } else if (diffDays < 0) {
    badgeColor = 'bg-slate-800/60 text-slate-500 border-slate-800';
    badgeText = 'Muddati o\'tgan';
  }

  return (
    <div className="relative group overflow-hidden bg-gradient-to-b from-white/[0.06] to-white/[0.02] hover:from-white/[0.09] hover:to-white/[0.03] border border-white/[0.09] hover:border-indigo-500/40 rounded-3xl p-4 transition-all duration-300 shadow-[0_8px_25px_-5px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
      {/* Orqa fon nur effekti */}
      <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all" />

      <div className="flex items-start justify-between gap-3 relative z-10">
        {/* Chap qism: Icon va Nomi */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500/20 via-purple-500/15 to-white/5 border border-white/10 flex items-center justify-center text-2xl shadow-inner flex-shrink-0 group-hover:scale-105 transition-transform">
            {subscription.icon || '💳'}
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-white text-[15px] leading-tight">
                {subscription.name}
              </h3>
              {subscription.isShared && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm">
                  <Users className="w-2.5 h-2.5" /> Oilaviy
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5 flex items-center gap-1.5">
              <span>{subscription.category}</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>{subscription.billingCycle === 'YEARLY' ? 'Yillik' : 'Oylik'}</span>
            </p>
          </div>
        </div>

        {/* O'ng qism: Narxi */}
        <div className="text-right flex-shrink-0">
          <div className="font-extrabold text-white text-base tracking-tight font-mono">
            {subscription.price.toLocaleString()} <span className="text-indigo-400 text-xs font-sans font-semibold">{subscription.currency}</span>
          </div>
          {subscription.currency !== 'UZS' && (
            <div className="text-[11px] font-semibold text-emerald-400 mt-0.5 font-mono">
              ~{Math.round(subscription.priceInUZS).toLocaleString()} UZS
            </div>
          )}
        </div>
      </div>

      {/* Faolsizlik ogohlantirishi (Smart Inactivity) */}
      {isInactive && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-300 text-xs shadow-inner">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
          <span className="text-[11px] leading-tight">
            30 kundan beri ishlatilmadi (bekor qilish tavsiya etiladi)
          </span>
        </div>
      )}

      {/* Pastki qism: Sana va Harakatlar */}
      <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-indigo-400/80" />
            <span className="font-medium text-slate-300">
              {nextDate.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
            </span>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 ${badgeColor}`}>
            <Clock className="w-2.5 h-2.5" />
            {badgeText}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(subscription)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-white/[0.08] transition-colors"
            title="Tahrirlash"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/[0.08] transition-colors"
            title="O'chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
