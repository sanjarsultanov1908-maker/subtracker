# 🚀 SubTracker — Telegram Mini App & Web Platforma

**SubTracker** — foydalanuvchilarning raqamli va real obunalarini (Netflix, Spotify, Fitnes, Ijara va boshqalar) bir joyda hisoblab borish, toʻlov sanalarini Telegram orqali oldindan eslatish hamda oilaviy/jamoaviy xarajatlarni avtomatik taqsimlash (split billing) uchun moʻljallangan zamonaviy platforma.

---

## 🌟 Asosiy Imkoniyatlar (Core Features)

1. **Obunalarni Boshqarish (Subscription Management):**
   - Istalgan turdagi obuna qoʻshish (nomi, narxi, valyutasi, davri: oylik/yillik, ilk toʻlov sanasi).
   - Tezkor tanlov shablonlari: Netflix, Spotify, YouTube Premium, ChatGPT Plus, Telegram Premium, iCloud, Fitnes va boshqalar.
   - Oylik va yillik umumiy xarajatlar statistikasi.

2. **CBU (Markaziy Bank) Avtomatik Valyuta Konvertatsiyasi:**
   - USD, EUR, RUB valyutalaridagi obuna narxlarini Oʻzbekiston Markaziy Banki kursi boʻyicha avtomatik soʻmga (UZS) oʻgirish va umumiy byudjetni aniq hisoblash.

3. **Telegram Eslatmalar (Smart Notifications):**
   - Toʻlov kunidan **3 kun oldin** ogohlantirish.
   - Toʻlov kunidan **1 kun oldin** ogohlantirish.
   - **Toʻlov kuni ertalab** aniq summa va maʼlumot bilan eslatma.

4. **Oilaviy / Jamoaviy Obunalar (Family & Group Sharing):**
   - Guruh yaratish (masalan: *Spotify Family*, *Netflix 4K*).
   - Obunani guruh aʼzolari oʻrtasida teng taqsimlash.
   - Aʼzolarga Telegram orqali ulush hisobi va **"Toʻladim ✅"** tugmasi borishi.
   - Guruh sardori uchun tasdiqlash (**"Check-mark ✔️"**) tizimi.

5. **Tejamkorlik va Moliya Tahlili (Smart Analytics & Inactivity Tracker):**
   - Oylik byudjet limiti belgilash va limit oshib ketganda darhol ogohlantirish.
   - 30 kundan beri ishlatilmagan obunalarni aniqlash va ortiqcha xarajatlarni tejash boʻyicha tavsiyalar.

6. **Vizual Taqvim (Visual Calendar):**
   - Oyning qaysi kunida qancha toʻlov yechilishini vizual koʻrsatuvchi interfeys.

---

## 🛠 Texnologik Stek (Tech Stack)

* **Frontend:** React, Vite, TypeScript, TailwindCSS, Lucide Icons, Telegram WebApp SDK.
* **Backend:** Node.js, Express, TypeScript, grammY (Telegram Bot API), node-cron, Axios.
* **Maʼlumotlar Bazasi:** PostgreSQL / SQLite, Prisma ORM.

---

## 📂 Loyiha Strukturasi

```text
subtracker/
├── backend/
│   ├── src/
│   │   ├── controllers/         # Obunalar, guruhlar va foydalanuvchi kontrollerlari
│   │   ├── services/            # CBU API, Telegram bot va Eslatmalar servislari
│   │   ├── routes/              # Express API endpointlari
│   │   ├── prisma.ts            # Prisma client singleton
│   │   └── index.ts             # Server entry point & Cron initializatsiya
│   ├── prisma/
│   │   └── schema.prisma        # Baza sxemasi
│   ├── package.json
│   └── .env
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # TMA Header va pastki tab paneli
│   │   │   ├── SubscriptionCard.tsx # Obuna kartochkasi va statuslari
│   │   │   ├── SubscriptionModal.tsx# Yangi obuna & CBU jonli hisob
│   │   │   ├── CalendarView.tsx     # Vizual taqvim
│   │   │   ├── GroupView.tsx        # Oilaviy ulushlar va tasdiqlash
│   │   │   └── AnalyticsView.tsx    # Byudjet limit va tejamkorlik tahlili
│   │   ├── services/api.ts          # API va Telegram WebApp SDK integratsiyasi
│   │   ├── types/index.ts           # TypeScript interfeyslari
│   │   ├── App.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

---

## ⚡️ Oʻrnatish va Ishga Tushirish

### 1. Backend sozlash:
```bash
cd backend
npm install
npx prisma db push
npm run dev
```
> Server odatiy holatda `http://localhost:5000` manzilida ishga tushadi.

### 2. Frontend sozlash:
```bash
cd ../frontend
npm install
npm run dev
```
> Mini App interfeysi `http://localhost:5173` da ishga tushadi.

### 3. Telegram Bot sozlash (@BotFather):
1. Telegramda `@BotFather` ga kiring va yangi bot yarating (`/newbot`).
2. Olingan `token` ni `backend/.env` faylidagi `BOT_TOKEN` maydoniga yozing.
3. BotFather'da `/setmenubutton` komandasini yuborib, bot menyu tugmasiga frontend URL manzilini (masalan, ngrok manzili) biriktiring.
