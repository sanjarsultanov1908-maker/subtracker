import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { api } from '../services/api';
import { CalendarDayData } from '../types';

interface CalendarViewProps {
  telegramId: string;
}

const MONTH_NAMES = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentyabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEK_DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export const CalendarView: React.FC<CalendarViewProps> = ({ telegramId }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState<Record<number, CalendarDayData>>({});
  const [selectedDay, setSelectedDay] = useState<CalendarDayData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    loadMonthData();
  }, [month, year, telegramId]);

  const loadMonthData = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCalendar(telegramId, month, year);
      const mapped: Record<number, CalendarDayData> = {};
      data.forEach((item) => {
        mapped[item.day] = item;
      });
      setCalendarData(mapped);
      setSelectedDay(null);
    } catch (err) {
      console.error('Taqvim ma\'lumotlarini yuklashda xatolik:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Oyning birinchi kuni va jami kunlar soni
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  // O'zbekiston/ISO haftasi: Dushanba (1) dan boshlanadi
  const startOffset = (firstDayOfMonth + 6) % 7;

  // Jami oy xarajati
  const totalMonthExpense = Object.values(calendarData).reduce((sum, d) => sum + d.totalUZS, 0);

  return (
    <div className="space-y-4">
      {/* Yuqori qism: Oy va Navigatsiya */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between backdrop-blur-md">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            {MONTH_NAMES[month]} {year}
            {isLoading && <span className="text-[10px] font-normal text-indigo-400 animate-pulse">(Yuklanmoqda...)</span>}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Oylik jami: <span className="font-semibold text-indigo-300">~{Math.round(totalMonthExpense).toLocaleString()} UZS</span>
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Taqvim Jadvali */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md">
        {/* Hafta kunlari sarlavhasi */}
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
          {WEEK_DAYS.map((wd) => (
            <div key={wd} className="text-xs font-semibold text-slate-400 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Kunlar kataklari */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Bo'sh kataklar */}
          {Array.from({ length: startOffset }).map((_, idx) => (
            <div key={`empty-${idx}`} className="h-12 rounded-xl bg-slate-950/30" />
          ))}

          {/* Oydagi kunlar */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dayInfo = calendarData[dayNum];
            const isToday =
              new Date().getDate() === dayNum &&
              new Date().getMonth() === month &&
              new Date().getFullYear() === year;

            const isSelected = selectedDay?.day === dayNum;

            return (
              <button
                key={dayNum}
                onClick={() => setSelectedDay(dayInfo || { day: dayNum, totalUZS: 0, items: [] })}
                className={`h-12 rounded-xl p-1 flex flex-col items-center justify-between transition-all relative ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 bg-indigo-500/20'
                    : isToday
                    ? 'bg-slate-800 border border-indigo-500/50'
                    : dayInfo
                    ? 'bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/40'
                    : 'bg-slate-800/40 hover:bg-slate-800/70 border border-slate-800/50'
                }`}
              >
                <span
                  className={`text-xs font-medium ${
                    isToday ? 'text-indigo-400 font-bold' : 'text-slate-300'
                  }`}
                >
                  {dayNum}
                </span>

                {dayInfo && (
                  <div className="w-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mx-auto" />
                    <span className="text-[9px] font-mono font-semibold text-indigo-300 hidden sm:block truncate w-full text-center">
                      {Math.round(dayInfo.totalUZS / 1000)}k
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tanlangan kun tafsiloti */}
      {selectedDay && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 animate-fadeIn">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200 text-sm">
              {selectedDay.day}-{MONTH_NAMES[month]} to'lovlari
            </h3>
            <span className="text-xs font-bold text-indigo-400 font-mono">
              Jami: {Math.round(selectedDay.totalUZS).toLocaleString()} UZS
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {selectedDay.items.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">
                Bu kunda to'lovlar mavjud emas
              </p>
            ) : (
              selectedDay.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-800/60 border border-slate-750"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{item.icon || '💳'}</span>
                    <span className="text-xs font-medium text-slate-200">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-semibold text-white">
                      {item.price.toLocaleString()} {item.currency}
                    </div>
                    {item.currency !== 'UZS' && (
                      <div className="text-[10px] text-indigo-400 font-mono">
                        ~{Math.round(item.priceInUZS).toLocaleString()} UZS
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
