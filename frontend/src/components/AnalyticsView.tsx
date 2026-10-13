import React, { useState } from 'react';
import { PieChart, TrendingUp, AlertTriangle, Lightbulb, Wallet, ArrowUpRight } from 'lucide-react';
import { AnalyticsData } from '../types';
import { api } from '../services/api';

interface AnalyticsViewProps {
  analytics: AnalyticsData;
  telegramId: string;
  onRefresh: () => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  analytics,
  telegramId,
  onRefresh,
}) => {
  const [budgetInput, setBudgetInput] = useState(analytics.monthlyBudget?.toString() || '');
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  const handleSaveBudget = async () => {
    try {
      await api.updateBudget(telegramId, parseFloat(budgetInput) || 0);
      setIsEditingBudget(false);
      onRefresh();
    } catch (err) {
      console.error('Byudjetni saqlashda xatolik:', err);
    }
  };

  const isExceeded = analytics.monthlyBudget > 0 && analytics.totalMonthlyUZS > analytics.monthlyBudget;
  const progressWidth = Math.min(100, analytics.budgetPercent || 0);

  return (
    <div className="space-y-4">
      {/* Oylik va Yillik Kartochkalar */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Oylik jami</span>
            <TrendingUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {analytics.totalMonthlyUZS.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">so'm / oyiga</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Yillik prognoz</span>
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-slate-100 font-mono">
            {analytics.totalYearlyUZS.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">so'm / yiliga</div>
        </div>
      </div>

      {/* Oylik Byudjet va Limit Indikatori */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-semibold text-slate-200">Oylik Limit (Budget)</h3>
          </div>
          <button
            onClick={() => setIsEditingBudget(!isEditingBudget)}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
          >
            {isEditingBudget ? 'Bekor qilish' : 'O\'zgartirish'}
          </button>
        </div>

        {isEditingBudget ? (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              placeholder="Masalan: 500000"
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={handleSaveBudget}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
            >
              Saqlash
            </button>
          </div>
        ) : (
          <div className="flex items-baseline justify-between text-xs mb-1.5">
            <span className="text-slate-400">
              Ishlatildi: <b className="text-white">{analytics.totalMonthlyUZS.toLocaleString()} UZS</b>
            </span>
            <span className="text-slate-400">
              Limit: <b className="text-white">{(analytics.monthlyBudget || 0).toLocaleString()} UZS</b>
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isExceeded
                ? 'bg-rose-500'
                : progressWidth > 80
                ? 'bg-amber-500'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${progressWidth}%` }}
          />
        </div>

        {isExceeded && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>
              Diqqat! Oylik obuna xarajatlaringiz limitdan{' '}
              <b>{(analytics.totalMonthlyUZS - analytics.monthlyBudget).toLocaleString()} UZS</b> ga
              oshib ketdi!
            </span>
          </div>
        )}
      </div>

      {/* Smart Inactivity Tejamkorlik Taklifi */}
      {analytics.unusedSavings > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Aqlli Tejamkorlik (Smart Savings)</h4>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Oxirgi 30 kunda ishlatilmagan obunalarni bekor qilish orqali har oy{' '}
                <b className="text-amber-300 font-mono">
                  ~{analytics.unusedSavings.toLocaleString()} UZS
                </b>{' '}
                tejashingiz mumkin!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Kategoriyalar bo'yicha taqsimot */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2 mb-3">
          <PieChart className="w-4 h-4 text-indigo-400" /> Kategoriyalar tahlili
        </h3>

        {Object.keys(analytics.categoryBreakdown || {}).length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-4">Ma'lumotlar yo'q</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(analytics.categoryBreakdown).map(([category, amount]) => {
              const percent = analytics.totalMonthlyUZS > 0
                ? Math.round((amount / analytics.totalMonthlyUZS) * 100)
                : 0;

              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{category}</span>
                    <span className="text-slate-400 font-mono">
                      {Math.round(amount).toLocaleString()} UZS ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
