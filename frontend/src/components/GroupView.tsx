import React, { useState } from 'react';
import { Users, Plus, CheckCircle, Clock, ShieldCheck, UserPlus, Share2 } from 'lucide-react';
import { SubscriptionGroup, Subscription } from '../types';
import { api } from '../services/api';

interface GroupViewProps {
  groups: SubscriptionGroup[];
  subscriptions: Subscription[];
  currentUserTelegramId: string;
  onRefresh: () => void;
}

export const GroupView: React.FC<GroupViewProps> = ({
  groups,
  subscriptions,
  currentUserTelegramId,
  onRefresh,
}) => {
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberInputs, setMemberInputs] = useState<{ telegramId: string; firstName: string }[]>([
    { telegramId: '', firstName: '' },
  ]);

  const [selectedGroupToSplit, setSelectedGroupToSplit] = useState<string | null>(null);
  const [selectedSubToSplit, setSelectedSubToSplit] = useState<string>('');

  const handleAddMemberRow = () => {
    setMemberInputs([...memberInputs, { telegramId: '', firstName: '' }]);
  };

  const handleMemberChange = (index: number, field: 'telegramId' | 'firstName', value: string) => {
    const updated = [...memberInputs];
    updated[index][field] = value;
    setMemberInputs(updated);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName) return;

    try {
      await api.createGroup({
        name: groupName,
        creatorTelegramId: currentUserTelegramId,
        members: memberInputs.filter((m) => m.telegramId.trim() !== ''),
      });
      setGroupName('');
      setMemberInputs([{ telegramId: '', firstName: '' }]);
      setIsCreatingGroup(false);
      onRefresh();
    } catch (err) {
      console.error('Guruh yaratishda xatolik:', err);
    }
  };

  const handleSplitSubmit = async (groupId: string) => {
    if (!selectedSubToSplit) return;
    try {
      await api.splitSubscription(selectedSubToSplit, groupId);
      setSelectedGroupToSplit(null);
      setSelectedSubToSplit('');
      onRefresh();
    } catch (err) {
      console.error('Obunani bo\'lishda xatolik:', err);
    }
  };

  const handleUpdateStatus = async (shareId: string, status: string) => {
    try {
      await api.updateShareStatus(shareId, status);
      onRefresh();
    } catch (err) {
      console.error('Status yangilashda xatolik:', err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Yuqori qism: Guruh yaratish tugmasi */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" /> Oilaviy va Jamoaviy
          </h2>
          <p className="text-xs text-slate-400">
            Obunalarni bo'lib to'lash va ulushlarni avtomatlashtirish
          </p>
        </div>

        <button
          onClick={() => setIsCreatingGroup(!isCreatingGroup)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Guruh ochish
        </button>
      </div>

      {/* Guruh ochish formasi */}
      {isCreatingGroup && (
        <form
          onSubmit={handleCreateGroup}
          className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 animate-fadeIn"
        >
          <h3 className="text-sm font-semibold text-slate-200">Yangi guruh ochish</h3>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Guruh nomi</label>
            <input
              type="text"
              required
              placeholder="Masalan: Spotify Family yoki Netflix 4K"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-400 flex items-center justify-between">
              <span>Guruh a'zolari (Telegram ID yoki Ismi):</span>
              <button
                type="button"
                onClick={handleAddMemberRow}
                className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 text-[11px]"
              >
                <UserPlus className="w-3 h-3" /> A'zo qo'shish
              </button>
            </label>

            {memberInputs.map((member, index) => (
              <div key={index} className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Ismi (masalan: Ali)"
                  value={member.firstName}
                  onChange={(e) => handleMemberChange(index, 'firstName', e.target.value)}
                  className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Telegram ID"
                  value={member.telegramId}
                  onChange={(e) => handleMemberChange(index, 'telegramId', e.target.value)}
                  className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreatingGroup(false)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-300"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Yaratish
            </button>
          </div>
        </form>
      )}

      {/* Guruhlar ro'yxati */}
      {groups.length === 0 ? (
        <div className="text-center py-10 bg-slate-900/50 border border-slate-800/60 rounded-2xl">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400 font-medium">Hozircha guruhlar mavjud emas</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Do'stlaringiz yoki oilangiz bilan umumiy obuna ochib, xarajatlarni avtomatik bo'lib to'lang
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => {
            const isLeader = group.creatorId === currentUserTelegramId;

            return (
              <div
                key={group.id}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-md"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-slate-100 text-base">{group.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {group.members.length} nafar a'zo • {isLeader ? 'Siz sardorsiz' : 'A\'zo'}
                    </p>
                  </div>

                  {isLeader && (
                    <button
                      onClick={() =>
                        setSelectedGroupToSplit(
                          selectedGroupToSplit === group.id ? null : group.id
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Obunani biriktirish
                    </button>
                  )}
                </div>

                {/* Obuna biriktirish dropdown */}
                {selectedGroupToSplit === group.id && (
                  <div className="my-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center gap-2">
                    <select
                      value={selectedSubToSplit}
                      onChange={(e) => setSelectedSubToSplit(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                    >
                      <option value="">Obunani tanlang...</option>
                      {subscriptions.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({Math.round(s.priceInUZS).toLocaleString()} UZS)
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleSplitSubmit(group.id)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                    >
                      Bo'lish
                    </button>
                  </div>
                )}

                {/* Biriktirilgan obunalar va a'zolar holati */}
                <div className="mt-3 space-y-3">
                  {group.subscriptions && group.subscriptions.length > 0 ? (
                    group.subscriptions.map((sub) => (
                      <div key={sub.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                            <span>{sub.icon || '💳'}</span> {sub.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-indigo-400">
                            Jami: {Math.round(sub.priceInUZS).toLocaleString()} UZS
                          </span>
                        </div>

                        {/* Ulushlar ro'yxati */}
                        <div className="space-y-1.5">
                          {sub.shares?.map((share) => {
                            const isMe = share.member?.user.telegramId === currentUserTelegramId;

                            return (
                              <div
                                key={share.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 text-xs"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-slate-300">
                                    {share.member?.user.firstName} {isMe && '(Siz)'}
                                  </span>
                                  <span className="text-slate-400 font-mono">
                                    {Math.round(share.amount).toLocaleString()} UZS
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {share.status === 'CONFIRMED' ? (
                                    <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      <ShieldCheck className="w-3 h-3" /> Tasdiqlangan
                                    </span>
                                  ) : share.status === 'PAID' ? (
                                    <div className="flex items-center gap-1">
                                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                        <Clock className="w-3 h-3" /> To'landi
                                      </span>
                                      {isLeader && (
                                        <button
                                          onClick={() => handleUpdateStatus(share.id, 'CONFIRMED')}
                                          className="text-[11px] font-semibold text-emerald-400 hover:underline ml-1"
                                        >
                                          [Tasdiqlash]
                                        </button>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[11px] text-slate-400">Kutilmoqda</span>
                                      {isMe && (
                                        <button
                                          onClick={() => handleUpdateStatus(share.id, 'PAID')}
                                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium"
                                        >
                                          <CheckCircle className="w-3 h-3" /> To'ladim
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-2">
                      Ushbu guruhga hali birorta obuna biriktirilmagan
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
