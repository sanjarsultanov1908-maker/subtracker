import cron from 'node-cron';
import { prisma } from '../prisma.js';
import { BotService } from './bot.service.js';
import { CbuService } from './cbu.service.js';
import { InlineKeyboard } from 'grammy';

export class ReminderService {
  static init() {
    // Har kuni soat 00:05 da Markaziy bank kurslarini yangilash
    cron.schedule('5 0 * * *', async () => {
      console.log('🔄 CBU valyuta kurslarini avtomatik yangilash...');
      await CbuService.syncRates();
    });

    // Har kuni soat 09:00 da obuna to'lov eslatmalarini yuborish
    cron.schedule('0 9 * * *', async () => {
      console.log('⏰ To\'lov eslatmalarini tekshirish...');
      await this.checkAndSendReminders();
    });

    console.log('⏱️ Eslatmalar rejalashtiruvchisi (Cron Scheduler) faollashtirildi.');
  }

  /**
   * Eslatmalarni tekshirish va yuborish:
   * - 3 kun oldin
   * - 1 kun oldin
   * - To'lov kuni ertalab
   */
  static async checkAndSendReminders() {
    try {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const subscriptions = await prisma.subscription.findMany({
        where: { isActive: true },
        include: { user: true, shares: { include: { member: { include: { user: true } } } } },
      });

      for (const sub of subscriptions) {
        const nextDate = new Date(sub.nextBillingDate);
        nextDate.setHours(0, 0, 0, 0);

        const diffTime = nextDate.getTime() - now.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        const formattedPrice = `${sub.price} ${sub.currency}`;
        const uzsEquivalent = sub.currency !== 'UZS' ? ` (~${Math.round(sub.priceInUZS).toLocaleString()} UZS)` : '';

        // 1. To'lov kuni
        if (diffDays === 0) {
          const text = 
            `💳 <b>Bugun to'lov kuni!</b>\n\n` +
            `Xizmat: <b>${sub.name}</b>\n` +
            `Narxi: <b>${formattedPrice}</b>${uzsEquivalent}\n` +
            `Kategoriya: ${sub.category}\n\n` +
            `Balansingiz yetarli ekanligini tekshirib qo'ying.`;
          
          await BotService.sendMessage(sub.user.telegramId, text);

          // Guruh a'zolariga ham eslatma
          if (sub.isShared && sub.shares.length > 0) {
            for (const share of sub.shares) {
              if (share.status === 'PENDING') {
                const shareText = 
                  `👥 <b>Guruh to'lovi (Bugun to'lov kuni):</b>\n\n` +
                  `Xizmat: <b>${sub.name}</b>\n` +
                  `Sizning ulushingiz: <b>${Math.round(share.amount).toLocaleString()} UZS</b>\n` +
                  `Guruh sardori: ${sub.user.firstName}\n\n` +
                  `To'lovni amalga oshirgach, quyidagi tugmani bosing:`;
                
                const keyboard = new InlineKeyboard().text('✅ To\'ladim', `pay_share:${share.id}`);
                await BotService.sendMessage(share.member.user.telegramId, shareText, keyboard);
              }
            }
          }
        } 
        // 2. 1 kun oldin
        else if (diffDays === 1) {
          const text = 
            `⚠️ <b>Ertaga to'lov kuni!</b>\n\n` +
            `Ertaga <b>${sub.name}</b> obunasi uchun <b>${formattedPrice}</b>${uzsEquivalent} yechiladi.`;
          
          await BotService.sendMessage(sub.user.telegramId, text);
        }
        // 3. 3 kun oldin
        else if (diffDays === 3) {
          const text = 
            `🔔 <b>SubTracker Eslatma (3 kun qoldi):</b>\n\n` +
            `<b>${sub.name}</b> obunasi bo'yicha keyingi to'lov: <b>${nextDate.toLocaleDateString('uz-UZ')}</b>\n` +
            `Summa: <b>${formattedPrice}</b>${uzsEquivalent}`;
          
          await BotService.sendMessage(sub.user.telegramId, text);
        }
      }

      // Inactivity tracker tekshiruvi
      await this.checkInactivity(subscriptions);
    } catch (err) {
      console.error('Eslatmalarni tekshirishda xatolik:', err);
    }
  }

  /**
   * Ishlatilmayotgan (Inactivity) obunalarni tahlil qilish
   */
  static async checkInactivity(subscriptions: any[]) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (const sub of subscriptions) {
      if (sub.lastUsedDate && new Date(sub.lastUsedDate) < thirtyDaysAgo) {
        const unusedDays = Math.round((now.getTime() - new Date(sub.lastUsedDate).getTime()) / (1000 * 60 * 60 * 24));
        const text =
          `💡 <b>Tejamkorlik taklifi (Smart Inactivity):</b>\n\n` +
          `Siz <b>${sub.name}</b> obunasidan oxirgi <b>${unusedDays} kundan beri</b> foydalanmadingiz.\n` +
          `Agar bu obuna sizga kerak bo'lmasa, uni to'xtatib oyiga <b>${Math.round(sub.priceInUZS).toLocaleString()} UZS</b> tejashingiz mumkin!`;

        await BotService.sendMessage(sub.user.telegramId, text);
      }
    }
  }
}
