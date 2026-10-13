export interface Subscription {
  id: string;
  userId: string;
  name: string;
  category: string;
  icon: string | null;
  price: number;
  currency: 'UZS' | 'USD' | 'EUR' | 'RUB';
  priceInUZS: number;
  billingCycle: 'MONTHLY' | 'YEARLY';
  firstBillDate: string;
  nextBillingDate: string;
  isShared: boolean;
  groupId?: string | null;
  lastUsedDate?: string | null;
  isActive: boolean;
  shares?: SubscriptionShare[];
}

export interface SubscriptionShare {
  id: string;
  subscriptionId: string;
  memberId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CONFIRMED';
  dueBillingDate: string;
  paidAt?: string | null;
  confirmedAt?: string | null;
  member?: {
    id: string;
    role: string;
    user: {
      id: string;
      firstName: string;
      username?: string;
      telegramId: string;
    };
  };
}

export interface SubscriptionGroup {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
  members: {
    id: string;
    role: 'LEADER' | 'MEMBER';
    user: {
      id: string;
      firstName: string;
      username?: string;
      telegramId: string;
    };
  }[];
  subscriptions?: Subscription[];
}

export interface AnalyticsData {
  totalMonthlyUZS: number;
  totalYearlyUZS: number;
  count: number;
  monthlyBudget: number;
  budgetPercent: number;
  categoryBreakdown: Record<string, number>;
  unusedSavings: number;
}

export interface CalendarDayData {
  day: number;
  totalUZS: number;
  items: {
    id: string;
    name: string;
    icon: string;
    price: number;
    currency: string;
    priceInUZS: number;
  }[];
}
