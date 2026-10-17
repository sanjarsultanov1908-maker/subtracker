import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { CbuService } from '../services/cbu.service.js';
import { ReminderService } from '../services/reminder.service.js';

export class SubscriptionController {
  /**
   * Foydalanuvchining barcha obunalarini olish
   */
  static async list(req: Request, res: Response) {
    try {
      const { telegramId } = req.query;
      if (!telegramId) {
        return res.status(400).json({ error: 'telegramId talab qilinadi' });
      }

      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (!user) {
        return res.json([]);
      }

      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id },
        include: {
          shares: {
            include: {
              member: {
                include: { user: true },
              },
            },
          },
        },
        orderBy: { nextBillingDate: 'asc' },
      });

      res.json(subscriptions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Yangi obuna qo'shish
   */
  static async create(req: Request, res: Response) {
    try {
      const {
        telegramId,
        name,
        category,
        icon,
        price,
        currency,
        billingCycle,
        firstBillDate,
        lastUsedDate,
      } = req.body;

      if (!telegramId || !name || price === undefined) {
        return res.status(400).json({ error: 'Barcha asosiy maydonlarni to\'ldiring' });
      }

      // Foydalanuvchini topish yoki yaratish
      let user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId: String(telegramId),
            firstName: req.body.firstName || 'User',
          },
        });
      }

      // Markaziy bank kursi bo'yicha UZS da hisoblash
      const priceNum = parseFloat(price);
      const curr = currency || 'UZS';
      const priceInUZS = await CbuService.convertToUZS(priceNum, curr);

      // Obuna sanasi bugundan boshlanadi
      const today = new Date();

      // Foydalanuvchi belgilagan to'lov sanasi
      const rawDate = req.body.nextBillingDate || req.body.firstBillDate;
      const targetBillingDate = rawDate ? new Date(rawDate) : new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          name,
          category: category || 'Boshqa',
          icon: icon || '💳',
          price: priceNum,
          currency: curr,
          priceInUZS,
          billingCycle: billingCycle || 'MONTHLY',
          firstBillDate: today,
          nextBillingDate: targetBillingDate,
          lastUsedDate: lastUsedDate ? new Date(lastUsedDate) : today,
        },
      });

      // Limit tekshiruvi: Oylik limitdan oshib ketmadimi?
      let limitWarning = null;
      if (user.monthlyBudget && user.monthlyBudget > 0) {
        const allSubs = await prisma.subscription.findMany({
          where: { userId: user.id, isActive: true },
        });

        const totalMonthly = allSubs.reduce((acc, sub) => {
          const monthlyAmount = sub.billingCycle === 'YEARLY' ? sub.priceInUZS / 12 : sub.priceInUZS;
          return acc + monthlyAmount;
        }, 0);

        if (totalMonthly > user.monthlyBudget) {
          limitWarning = {
            totalMonthly,
            budget: user.monthlyBudget,
            exceededBy: totalMonthly - user.monthlyBudget,
            message: `⚠️ Oylik xarajat (${Math.round(totalMonthly).toLocaleString()} UZS) belgilangan limitdan (${Math.round(user.monthlyBudget).toLocaleString()} UZS) oshib ketdi!`,
          };
        }
      }

      // Foydalanuvchiga Telegram bot orqali darhol xabarnoma yuborish
      ReminderService.sendInstantAlert(subscription, user.telegramId).catch((err) => {
        console.error('Instant notification yuborishda xatolik:', err);
      });

      res.status(201).json({ subscription, limitWarning });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Obunani yangilash
   */
  static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, category, icon, price, currency, billingCycle, nextBillingDate, lastUsedDate, isActive } = req.body;

      let updateData: any = {};
      if (name) updateData.name = name;
      if (category) updateData.category = category;
      if (icon) updateData.icon = icon;
      if (billingCycle) updateData.billingCycle = billingCycle;
      if (nextBillingDate || req.body.firstBillDate) {
        updateData.nextBillingDate = new Date(nextBillingDate || req.body.firstBillDate);
      }
      if (lastUsedDate) updateData.lastUsedDate = new Date(lastUsedDate);
      if (isActive !== undefined) updateData.isActive = isActive;

      if (price !== undefined || currency) {
        const sub = await prisma.subscription.findUnique({ where: { id } });
        if (sub) {
          const newPrice = price !== undefined ? parseFloat(price) : sub.price;
          const newCurrency = currency || sub.currency;
          updateData.price = newPrice;
          updateData.currency = newCurrency;
          updateData.priceInUZS = await CbuService.convertToUZS(newPrice, newCurrency);
        }
      }

      const updated = await prisma.subscription.update({
        where: { id },
        data: updateData,
        include: { user: true },
      });

      // Agar to'lov sanasi o'zgartirilgan bo'lsa, foydalanuvchiga yangi sana haqida darhol xabar berish
      if (updateData.nextBillingDate) {
        ReminderService.sendInstantAlert(updated, updated.user.telegramId).catch((err) => {
          console.error('Instant notification yuborishda xatolik:', err);
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Obunani o'chirish
   */
  static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await prisma.subscription.delete({ where: { id } });
      res.json({ success: true, message: 'Obuna muvaffaqiyatli o\'chirildi' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Vizual taqvim (Calendar) uchun to'lov kunlarini hisoblash
   */
  static async getCalendar(req: Request, res: Response) {
    try {
      const { telegramId, year, month } = req.query;
      if (!telegramId) return res.status(400).json({ error: 'telegramId kerak' });

      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (!user) return res.json([]);

      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id, isActive: true },
      });

      // Ma'lum oy bo'yicha to'lov kunlarini guruhlash
      const targetYear = year ? parseInt(String(year)) : new Date().getFullYear();
      const targetMonth = month ? parseInt(String(month)) : new Date().getMonth(); // 0-indexed

      const calendarDays: Record<number, { day: number; totalUZS: number; items: any[] }> = {};

      for (const sub of subscriptions) {
        const billDate = new Date(sub.nextBillingDate);
        if (billDate.getFullYear() === targetYear && billDate.getMonth() === targetMonth) {
          const day = billDate.getDate();
          if (!calendarDays[day]) {
            calendarDays[day] = { day, totalUZS: 0, items: [] };
          }
          calendarDays[day].totalUZS += sub.priceInUZS;
          calendarDays[day].items.push({
            id: sub.id,
            name: sub.name,
            icon: sub.icon,
            price: sub.price,
            currency: sub.currency,
            priceInUZS: sub.priceInUZS,
          });
        }
      }

      res.json(Object.values(calendarDays));
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Statistika va Smart Analytics
   */
  static async getAnalytics(req: Request, res: Response) {
    try {
      const { telegramId } = req.query;
      if (!telegramId) return res.status(400).json({ error: 'telegramId kerak' });

      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (!user) {
        return res.json({
          totalMonthlyUZS: 0,
          totalYearlyUZS: 0,
          count: 0,
          monthlyBudget: 0,
          budgetPercent: 0,
          categoryBreakdown: {},
          unusedSavings: 0,
        });
      }

      const subscriptions = await prisma.subscription.findMany({
        where: { userId: user.id, isActive: true },
      });

      let totalMonthlyUZS = 0;
      let totalYearlyUZS = 0;
      const categoryBreakdown: Record<string, number> = {};
      let unusedSavings = 0;

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      for (const sub of subscriptions) {
        const monthly = sub.billingCycle === 'YEARLY' ? sub.priceInUZS / 12 : sub.priceInUZS;
        const yearly = sub.billingCycle === 'YEARLY' ? sub.priceInUZS : sub.priceInUZS * 12;

        totalMonthlyUZS += monthly;
        totalYearlyUZS += yearly;

        categoryBreakdown[sub.category] = (categoryBreakdown[sub.category] || 0) + monthly;

        // Inactivity savings
        if (sub.lastUsedDate && new Date(sub.lastUsedDate) < thirtyDaysAgo) {
          unusedSavings += monthly;
        }
      }

      const budget = user.monthlyBudget || 0;
      const budgetPercent = budget > 0 ? Math.min(100, Math.round((totalMonthlyUZS / budget) * 100)) : 0;

      res.json({
        totalMonthlyUZS: Math.round(totalMonthlyUZS),
        totalYearlyUZS: Math.round(totalYearlyUZS),
        count: subscriptions.length,
        monthlyBudget: budget,
        budgetPercent,
        categoryBreakdown,
        unusedSavings: Math.round(unusedSavings),
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
