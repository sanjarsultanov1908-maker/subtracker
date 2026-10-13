import axios from 'axios';
import https from 'https';
import { prisma } from '../prisma.js';

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

interface CBURateItem {
  id: number;
  Code: string;
  Ccy: string; // 'USD', 'EUR', 'RUB', etc.
  CcyNm_UZ: string;
  Rate: string; // '12850.00'
  Date: string;
}

const FALLBACK_RATES: Record<string, number> = {
  USD: 12850,
  EUR: 13950,
  RUB: 135,
  UZS: 1,
};

export class CbuService {
  private static lastFetchTime: number = 0;
  private static CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours cache

  /**
   * Markaziy Bank API orqali valyuta kurslarini oladi va bazaga yangilab qo'yadi
   */
  static async syncRates(): Promise<Record<string, number>> {
    try {
      const response = await axios.get<CBURateItem[]>('https://cbu.uz/uz/arkhiv-kursov-valyut/json/', {
        timeout: 8000,
        httpsAgent,
      });

      const rates: Record<string, number> = { UZS: 1 };

      for (const item of response.data) {
        if (['USD', 'EUR', 'RUB'].includes(item.Ccy)) {
          const numRate = parseFloat(item.Rate);
          rates[item.Ccy] = numRate;

          // Bazada saqlab qo'yish
          await prisma.exchangeRate.upsert({
            where: { currency: item.Ccy },
            update: { rate: numRate },
            create: { currency: item.Ccy, rate: numRate },
          });
        }
      }

      this.lastFetchTime = Date.now();
      return rates;
    } catch (error) {
      console.warn('⚠️ CBU API bilan ulanishda xatolik, bazadagi yoki standart kurslar ishlatilmoqda:', (error as Error).message);
      return this.getCachedOrFallbackRates();
    }
  }

  /**
   * Bazadagi kesh kurslarni oladi, bo'lmasa fallback qaytaradi
   */
  static async getCachedOrFallbackRates(): Promise<Record<string, number>> {
    try {
      const dbRates = await prisma.exchangeRate.findMany();
      if (dbRates.length > 0) {
        const rates: Record<string, number> = { UZS: 1 };
        dbRates.forEach((r) => {
          rates[r.currency] = r.rate;
        });
        return rates;
      }
    } catch {
      // Ignored
    }
    return FALLBACK_RATES;
  }

  /**
   * Berilgan valyutadagi narxni UZS ga o'girish
   */
  static async convertToUZS(amount: number, currency: string): Promise<number> {
    if (currency === 'UZS') return amount;
    const rates = await this.getCachedOrFallbackRates();
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
    return Math.round(amount * rate);
  }
}
