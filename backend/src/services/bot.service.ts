import { Bot, InlineKeyboard } from 'grammy';
import dotenv from 'dotenv';
import { prisma } from '../prisma.js';

dotenv.config();

const token = process.env.BOT_TOKEN || '';
export const bot = token && token !== 'YOUR_TELEGRAM_BOT_TOKEN' && token !== 'demo_token' 
  ? new Bot(token) 
  : null;

export class BotService {
  static init() {
    if (!bot) {
      console.log('ℹ️ Bot tokeni kiritilmagan yoki demo rejimda. Bot tinglash boshlanmadi.');
      return;
    }

    // /start komandasi
    bot.command('start', async (ctx) => {
      const from = ctx.from;
      if (!from) return;

      const telegramId = from.id.toString();
      const firstName = from.first_name || 'Foydalanuvchi';
      const lastName = from.last_name || '';
      const username = from.username || '';

      // Foydalanuvchini bazada saqlash yoki yangilash
      try {
        await prisma.user.upsert({
          where: { telegramId },
          update: { firstName, lastName, username },
          create: { telegramId, firstName, lastName, username },
        });
      } catch (dbErr) {
        console.error('Bazada foydalanuvchini saqlashda xatolik:', dbErr);
      }

      const webAppUrl = process.env.FRONTEND_URL || process.env.RENDER_EXTERNAL_URL || 'https://subtracker-rxu8.onrender.com';
      const isHttps = webAppUrl.startsWith('https://');

      let keyboard = undefined;
      let appText = '';

      if (isHttps) {
        keyboard = new InlineKeyboard().webApp('📱 SubTracker-ni ochish', webAppUrl);
        appText = 'Quyidagi tugma orqali ilovani ishga tushiring 👇';
      } else {
        appText = `🌐 <b>Ilovani brauzerda ochish havolasi:</b>\n👉 <a href="${webAppUrl}">${webAppUrl}</a>`;
      }

      await ctx.reply(
        `Assalomu alaykum, <b>${firstName}</b>!\n\n` +
        `🚀 <b>SubTracker</b> platformasiga xush kelibsiz!\n\n` +
        `Bu yerda siz:\n` +
        `• Barcha raqamli va real obunalaringizni hisoblab borasiz\n` +
        `• Valyutalarni (USD/EUR) avtomatik so'mga (UZS) o'girasiz\n` +
        `• To'lov kuni yaqinlashganda eslatmalar olasiz\n` +
        `• Oilaviy va jamoaviy obunalar xarajatlarini avtomatik bo'lib to'laysiz!\n\n` +
        appText,
        {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        }
      );
    });

    // Inline button callback: To'ladim (A'zo bosadi)
    bot.callbackQuery(/^pay_share:(.+)$/, async (ctx) => {
      const shareId = ctx.match[1];
      try {
        const share = await prisma.subscriptionShare.findUnique({
          where: { id: shareId },
          include: {
            subscription: true,
            member: { include: { user: true } },
          },
        });

        if (!share) {
          return ctx.answerCallbackQuery({ text: 'Ulush topilmadi!' });
        }

        await prisma.subscriptionShare.update({
          where: { id: shareId },
          data: { status: 'PAID', paidAt: new Date() },
        });

        await ctx.answerCallbackQuery({ text: 'To\'lov haqida xabar berildi!' });
        await ctx.editMessageText(
          `✅ <b>${share.subscription.name}</b> uchun <b>${share.amount.toLocaleString()} UZS</b> to'lovingiz yuborildi. Sardor tasdiqlashi kutilmoqda.`,
          { parse_mode: 'HTML' }
        );

        // Guruh sardoriga bildirishnoma yuborish
        const group = await prisma.subscriptionGroup.findFirst({
          where: { id: share.subscription.groupId || '' },
        });

        if (group && bot) {
          const leaderKeyboard = new InlineKeyboard()
            .text('✔️ Tasdiqlash', `confirm_share:${share.id}`)
            .text('❌ Rad etish', `reject_share:${share.id}`);

          await bot.api.sendMessage(
            group.creatorId,
            `📩 <b>To'lov tasdiqlash:</b>\n` +
            `Foydalanuvchi <b>${share.member.user.firstName}</b> <b>${share.subscription.name}</b> uchun <b>${share.amount.toLocaleString()} UZS</b> to'laganini bildirdi.\n\nTasdiqlaysizmi?`,
            { parse_mode: 'HTML', reply_markup: leaderKeyboard }
          );
        }
      } catch (err) {
        console.error('Callback xatosi:', err);
      }
    });

    // Inline button callback: Tasdiqlash (Sardor bosadi)
    bot.callbackQuery(/^confirm_share:(.+)$/, async (ctx) => {
      const shareId = ctx.match[1];
      try {
        const share = await prisma.subscriptionShare.update({
          where: { id: shareId },
          data: { status: 'CONFIRMED', confirmedAt: new Date() },
          include: { member: { include: { user: true } }, subscription: true },
        });

        await ctx.answerCallbackQuery({ text: 'To\'lov tasdiqlandi!' });
        await ctx.editMessageText(
          `✔️ <b>${share.member.user.firstName}</b> ning <b>${share.subscription.name}</b> uchun to'lovi muvaffaqiyatli tasdiqlandi.`,
          { parse_mode: 'HTML' }
        );

        // A'zoga xabar
        if (bot) {
          await bot.api.sendMessage(
            share.member.user.telegramId,
            `🎉 <b>${share.subscription.name}</b> uchun <b>${share.amount.toLocaleString()} UZS</b> to'lovingiz guruh sardori tomonidan tasdiqlandi!`,
            { parse_mode: 'HTML' }
          );
        }
      } catch (err) {
        console.error('Confirm xatosi:', err);
      }
    });

    bot.catch((err) => {
      console.error('⚠️ Telegram bot xatoligi:', err.error);
    });

    // Botni ishga tushirish
    bot.start({
      onStart: (botInfo) => {
        console.log(`🤖 Telegram Bot muvaffaqiyatli ishga tushdi: @${botInfo.username}`);
      },
    }).catch((err) => {
      console.warn('⚠️ Telegram bot polling xatosi:', err.message);
    });
  }

  /**
   * Foydalanuvchiga Telegram orqali xabar yuborish
   */
  static async sendMessage(telegramId: string, text: string, keyboard?: InlineKeyboard) {
    if (!bot) {
      console.log(`[SIMULATED TELEGRAM MESSAGE to ${telegramId}]:\n${text}`);
      return;
    }
    try {
      await bot.api.sendMessage(telegramId, text, {
        parse_mode: 'HTML',
        reply_markup: keyboard,
      });
    } catch (err) {
      console.error(`Telegram xabar yuborishda xatolik (${telegramId}):`, (err as Error).message);
    }
  }
}
