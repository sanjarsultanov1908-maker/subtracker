import axios from 'axios';
import { Subscription, AnalyticsData, CalendarDayData, SubscriptionGroup } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

// Telegram WebApp orqali foydalanuvchini aniqlash
export const getTelegramUser = () => {
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    const u = tg.initDataUnsafe.user;
    return {
      telegramId: String(u.id),
      firstName: u.first_name || 'Foydalanuvchi',
      lastName: u.last_name || '',
      username: u.username || '',
    };
  }

  // Telegramdan tashqarida (Web brauzerda) test rejimi
  return {
    telegramId: '998901234567',
    firstName: 'Azizbek',
    lastName: 'Dev',
    username: 'aziz_dev',
  };
};

export const api = {
  // Rates
  getRates: async (): Promise<Record<string, number>> => {
    const res = await axios.get(`${API_BASE}/rates`);
    return res.data;
  },

  // Subscriptions
  getSubscriptions: async (telegramId: string): Promise<Subscription[]> => {
    const res = await axios.get(`${API_BASE}/subscriptions`, { params: { telegramId } });
    return res.data;
  },

  createSubscription: async (data: any): Promise<{ subscription: Subscription; limitWarning: any }> => {
    const res = await axios.post(`${API_BASE}/subscriptions`, data);
    return res.data;
  },

  updateSubscription: async (id: string, data: any): Promise<Subscription> => {
    const res = await axios.put(`${API_BASE}/subscriptions/${id}`, data);
    return res.data;
  },

  deleteSubscription: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE}/subscriptions/${id}`);
  },

  // Calendar & Analytics
  getCalendar: async (telegramId: string, month: number, year: number): Promise<CalendarDayData[]> => {
    const res = await axios.get(`${API_BASE}/subscriptions/calendar`, {
      params: { telegramId, month, year },
    });
    return res.data;
  },

  getAnalytics: async (telegramId: string): Promise<AnalyticsData> => {
    const res = await axios.get(`${API_BASE}/subscriptions/analytics`, {
      params: { telegramId },
    });
    return res.data;
  },

  // Budget
  updateBudget: async (telegramId: string, monthlyBudget: number) => {
    const res = await axios.post(`${API_BASE}/user/budget`, { telegramId, monthlyBudget });
    return res.data;
  },

  // Groups
  getGroups: async (telegramId: string): Promise<SubscriptionGroup[]> => {
    const res = await axios.get(`${API_BASE}/groups`, { params: { telegramId } });
    return res.data;
  },

  createGroup: async (data: any): Promise<SubscriptionGroup> => {
    const res = await axios.post(`${API_BASE}/groups`, data);
    return res.data;
  },

  splitSubscription: async (subscriptionId: string, groupId: string) => {
    const res = await axios.post(`${API_BASE}/groups/split`, { subscriptionId, groupId });
    return res.data;
  },

  updateShareStatus: async (shareId: string, status: string) => {
    const res = await axios.patch(`${API_BASE}/groups/shares/${shareId}`, { status });
    return res.data;
  },
};
