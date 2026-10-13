import React from 'react';
import { Calendar, Users, AlertCircle, Trash2, Edit2 } from 'lucide-react';
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

  let badgeColor = 'bg-slate-800 text-slate-300';
  let badgeText = `${diffDays} kun qoldi`;

  if (diffDays === 0) {
    badgeColor = 'bg-rose-500/20 text-rose-400 border border-rose-500/30 font-semibold animate-pulse';
    badgeText = 'Bugun to\'lov!';
  } else if (diffDays <= 3 && diffDays > 0) {
    badgeColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium';
    badgeText = `${diffDays} kun qoldi`;
  } else if (diffDays < 0) {
    badgeColor = 'bg-slate-800 text-slate-500';
    badgeText = 'Muddati o\'tgan';
  }

  return (
    <div className="relative group bg-slate-900/80 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-4 transition-all duration-200 shadow-sm backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        {/* Chap qism: Icon va Nomi */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-2xl shadow-inner flex-shrink-0">
            {subscription.icon || '💳'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-100 text-base leading-tight">
                {subscription.name}
              </h3>
              {subscription.isShared && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Users className="w-2.5 h-2.5" /> Oilaviy
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {subscription.category} • {subscription.billingCycle === 'YEARLY' ? 'Yillik' : 'Oylik'}
            </p>
          </div>
        </div>

        {/* O'ng qism: Narxi */}
        <div className="text-right">
          <div className="font-bold text-slate-100 text-base">
            {subscription.price.toLocaleString()} {subscription.currency}
          </div>
          {subscription.currency !== 'UZS' && (
            <div className="text-xs font-medium text-indigo-400 mt-0.5">
              ~{Math.round(subscription.priceInUZS).toLocaleString()} UZS
            </div>
          )}
        </div>
      </div>

      {/* Faolsizlik ogohlantirishi (Smart Inactivity) */}
      {isInactive && (
        <div className="mt-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>30 kundan beri ishlatilmadi (bekor qilish tavsiya etiladi)</span>
        </div>
      )}

      {/* Pastki qism: Sana va Harakatlar */}
      <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400">
            {nextDate.toLocaleDateString('uz-UZ', { day: 'numeric', month: 'short' })}
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[11px] ${badgeColor}`}>
            {badgeText}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(subscription)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
            title="Tahrirlash"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(subscription.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
            title="O'chirish"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
