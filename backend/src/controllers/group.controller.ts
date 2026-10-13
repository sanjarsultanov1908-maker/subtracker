import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { BotService } from '../services/bot.service.js';
import { InlineKeyboard } from 'grammy';

export class GroupController {
  /**
   * Foydalanuvchi a'zo yoki sardor bo'lgan guruhlar ro'yxati
   */
  static async list(req: Request, res: Response) {
    try {
      const { telegramId } = req.query;
      if (!telegramId) return res.status(400).json({ error: 'telegramId kerak' });

      const user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (!user) return res.json([]);

      const groups = await prisma.subscriptionGroup.findMany({
        where: {
          OR: [
            { creatorId: String(telegramId) },
            { members: { some: { userId: user.id } } },
          ],
        },
        include: {
          members: { include: { user: true } },
          subscriptions: {
            include: {
              shares: {
                include: { member: { include: { user: true } } },
              },
            },
          },
        },
      });

      res.json(groups);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Yangi oilaviy / jamoaviy guruh yaratish
   */
  static async create(req: Request, res: Response) {
    try {
      const { name, creatorTelegramId, members } = req.body;
      if (!name || !creatorTelegramId) {
        return res.status(400).json({ error: 'Guruh nomi va creatorTelegramId talab qilinadi' });
      }

      let creator = await prisma.user.findUnique({
        where: { telegramId: String(creatorTelegramId) },
      });

      if (!creator) {
        creator = await prisma.user.create({
          data: {
            telegramId: String(creatorTelegramId),
            firstName: req.body.creatorName || 'Sardor',
          },
        });
      }

      // Guruhni yaratish
      const group = await prisma.subscriptionGroup.create({
        data: {
          name,
          creatorId: String(creatorTelegramId),
          members: {
            create: {
              userId: creator.id,
              role: 'LEADER',
            },
          },
        },
        include: { members: { include: { user: true } } },
      });

      // Agar boshqa a'zolar berilgan bo'lsa
      if (Array.isArray(members)) {
        for (const m of members) {
          if (!m.telegramId) continue;
          let memberUser = await prisma.user.findUnique({
            where: { telegramId: String(m.telegramId) },
          });

          if (!memberUser) {
            memberUser = await prisma.user.create({
              data: {
                telegramId: String(m.telegramId),
                firstName: m.firstName || 'A\'zo',
                username: m.username,
              },
            });
          }

          await prisma.groupMember.create({
            data: {
              groupId: group.id,
              userId: memberUser.id,
              role: 'MEMBER',
            },
          });
        }
      }

      const fullGroup = await prisma.subscriptionGroup.findUnique({
        where: { id: group.id },
        include: { members: { include: { user: true } } },
      });

      res.status(201).json(fullGroup);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Obunani guruh a'zolariga teng taqsimlash (Split bill)
   */
  static async splitSubscription(req: Request, res: Response) {
    try {
      const { subscriptionId, groupId } = req.body;
      if (!subscriptionId || !groupId) {
        return res.status(400).json({ error: 'subscriptionId va groupId kerak' });
      }

      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        return res.status(404).json({ error: 'Obuna topilmadi' });
      }

      const group = await prisma.subscriptionGroup.findUnique({
        where: { id: groupId },
        include: { members: { include: { user: true } } },
      });

      if (!group || group.members.length === 0) {
        return res.status(404).json({ error: 'Guruh yoki uning a\'zolari topilmadi' });
      }

      // Har bir a'zoga teng ulush hisoblash
      const memberCount = group.members.length;
      const amountPerMember = Math.round(subscription.priceInUZS / memberCount);

      // Obunani guruhga bog'lash
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: { isShared: true, groupId: group.id },
      });

      // Eski ulushlarni tozalab, yangilarini kiritish
      await prisma.subscriptionShare.deleteMany({
        where: { subscriptionId },
      });

      const createdShares = [];
      for (const member of group.members) {
        const share = await prisma.subscriptionShare.create({
          data: {
            subscriptionId,
            memberId: member.id,
            amount: amountPerMember,
            status: member.role === 'LEADER' ? 'CONFIRMED' : 'PENDING',
            dueBillingDate: subscription.nextBillingDate,
          },
          include: { member: { include: { user: true } } },
        });
        createdShares.push(share);

        // A'zolarga (sardordan tashqari) Telegram eslatma yuborish
        if (member.role !== 'LEADER') {
          const keyboard = new InlineKeyboard().text('✅ To\'ladim', `pay_share:${share.id}`);
          const msg = 
            `👥 <b>Yangi guruh xarajati (${group.name}):</b>\n\n` +
            `Obuna: <b>${subscription.name}</b>\n` +
            `Sizning ulushingiz: <b>${amountPerMember.toLocaleString()} UZS</b>\n` +
            `Muddat: <b>${new Date(subscription.nextBillingDate).toLocaleDateString('uz-UZ')}</b>\n\n` +
            `To'lovni amalga oshirgach "To'ladim" tugmasini bosing:`;

          BotService.sendMessage(member.user.telegramId, msg, keyboard);
        }
      }

      res.json({ success: true, shares: createdShares });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Ulush statusini yangilash (Web UI orqali ham bosish imkoniyati)
   */
  static async updateShareStatus(req: Request, res: Response) {
    try {
      const { shareId } = req.params;
      const { status } = req.body; // 'PAID' yoki 'CONFIRMED'

      const updateData: any = { status };
      if (status === 'PAID') updateData.paidAt = new Date();
      if (status === 'CONFIRMED') updateData.confirmedAt = new Date();

      const share = await prisma.subscriptionShare.update({
        where: { id: shareId },
        data: updateData,
        include: { member: { include: { user: true } }, subscription: true },
      });

      res.json(share);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
