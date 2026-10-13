import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import apiRoutes from './routes/api.routes.js';
import { BotService } from './services/bot.service.js';
import { ReminderService } from './services/reminder.service.js';
import { CbuService } from './services/cbu.service.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Asosiy API yo'nalishlari
app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Frontend Mini App statik fayllarini ulash
const frontendDist = fs.existsSync(path.resolve(process.cwd(), '../frontend/dist'))
  ? path.resolve(process.cwd(), '../frontend/dist')
  : path.resolve(process.cwd(), 'frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

async function bootstrap() {
  console.log('🚀 SubTracker Server ishga tushmoqda...');

  // Valyuta kurslarini ilk marta sinxronlash
  await CbuService.syncRates();

  // Telegram botni ishga tushirish
  BotService.init();

  // Eslatmalar xizmatini yoqish (Cron)
  ReminderService.init();

  app.listen(PORT, () => {
    console.log(`✅ Server muvaffaqiyatli ishga tushdi: http://localhost:${PORT}`);
    console.log(`📡 API endpoint: http://localhost:${PORT}/api`);
  });
}

bootstrap().catch((err) => {
  console.error('Serverni ishga tushirishda xatolik:', err);
});
