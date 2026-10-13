import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { CbuService } from '../services/cbu.service.js';

export class UserController {
  /**
   * Telegram ID bo'yicha profilni olish yoki yaratish
   */
  static async getProfile(req: Request, res: Response) {
    try {
      const { telegramId, firstName, lastName, username } = req.query;
      if (!telegramId) return res.status(400).json({ error: 'telegramId kerak' });

      let user = await prisma.user.findUnique({
        where: { telegramId: String(telegramId) },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            telegramId: String(telegramId),
            firstName: String(firstName || 'Foydalanuvchi'),
            lastName: lastName ? String(lastName) : null,
            username: username ? String(username) : null,
          },
        });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Oylik limitni (Budget) yangilash
   */
  static async updateBudget(req: Request, res: Response) {
    try {
      const { telegramId, monthlyBudget } = req.body;
      if (!telegramId || monthlyBudget === undefined) {
        return res.status(400).json({ error: 'telegramId va monthlyBudget kerak' });
      }

      const user = await prisma.user.update({
        where: { telegramId: String(telegramId) },
        data: { monthlyBudget: parseFloat(monthlyBudget) },
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Joriy Markaziy bank valyuta kurslarini olish
   */
  static async getRates(req: Request, res: Response) {
    try {
      const rates = await CbuService.getCachedOrFallbackRates();
      res.json(rates);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
