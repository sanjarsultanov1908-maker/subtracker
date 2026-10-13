import { PrismaClient } from '@prisma/client';
import { CbuService } from '../src/services/cbu.service.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 SubTracker uchun demo ma\'lumotlar kiritilmoqda...');

  // Valyuta kurslarini olish
  await CbuService.syncRates();
  const rates = await CbuService.getCachedOrFallbackRates();
  const usdRate = rates['USD'] || 12850;

  // 1. Asosiy test foydalanuvchisi
  const user = await prisma.user.upsert({
    where: { telegramId: '998901234567' },
    update: {},
    create: {
      telegramId: '998901234567',
      firstName: 'Azizbek',
      lastName: 'Dev',
      username: 'aziz_dev',
      monthlyBudget: 500000, // 500,000 so'm limit
    },
  });

  // 2. Do'stlar (guruh a'zolari)
  const friend1 = await prisma.user.upsert({
    where: { telegramId: '998901111111' },
    update: {},
    create: {
      telegramId: '998901111111',
      firstName: 'Jasur',
      username: 'jasur_pro',
    },
  });

  const friend2 = await prisma.user.upsert({
    where: { telegramId: '998902222222' },
    update: {},
    create: {
      telegramId: '998902222222',
      firstName: 'Malika',
      username: 'malika_ui',
    },
  });

  // Eski obunalarni tozalash (agar mavjud bo'lsa)
  await prisma.subscriptionShare.deleteMany({});
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.groupMember.deleteMany({});
  await prisma.subscriptionGroup.deleteMany({});

  // 3. Obunalar yaratish
  const today = new Date();

  // Netflix - 3 kun qolgan
  const in3Days = new Date(today);
  in3Days.setDate(today.getDate() + 3);

  const sub1 = await prisma.subscription.create({
    data: {
      userId: user.id,
      name: 'Netflix Premium',
      category: 'Ko\'ngilochar',
      icon: '🎬',
      price: 9.99,
      currency: 'USD',
      priceInUZS: Math.round(9.99 * usdRate),
      billingCycle: 'MONTHLY',
      firstBillDate: new Date(today.getFullYear(), today.getMonth() - 2, 16),
      nextBillingDate: in3Days,
      lastUsedDate: new Date(),
    },
  });

  // ChatGPT Plus - 12 kundan keyin
  const in12Days = new Date(today);
  in12Days.setDate(today.getDate() + 12);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      name: 'ChatGPT Plus',
      category: 'Ish va AI',
      icon: '🤖',
      price: 20,
      currency: 'USD',
      priceInUZS: Math.round(20 * usdRate),
      billingCycle: 'MONTHLY',
      firstBillDate: new Date(today.getFullYear(), today.getMonth() - 1, 25),
      nextBillingDate: in12Days,
      lastUsedDate: new Date(),
    },
  });

  // Fitnes klub - O'zbek so'mida
  const in20Days = new Date(today);
  in20Days.setDate(today.getDate() + 20);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      name: 'BeFit Sport Klub',
      category: 'Salomatlik',
      icon: '💪',
      price: 350000,
      currency: 'UZS',
      priceInUZS: 350000,
      billingCycle: 'MONTHLY',
      firstBillDate: new Date(today.getFullYear(), today.getMonth() - 3, 5),
      nextBillingDate: in20Days,
      lastUsedDate: new Date(),
    },
  });

  // Kam ishlatilgan obuna (Smart Inactivity testi uchun: 38 kun oldin)
  const in8Days = new Date(today);
  in8Days.setDate(today.getDate() + 8);
  const thirtyEightDaysAgo = new Date(today);
  thirtyEightDaysAgo.setDate(today.getDate() - 38);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      name: 'PlayStation Plus',
      category: 'Ko\'ngilochar',
      icon: '🎮',
      price: 7.99,
      currency: 'USD',
      priceInUZS: Math.round(7.99 * usdRate),
      billingCycle: 'MONTHLY',
      firstBillDate: new Date(today.getFullYear(), today.getMonth() - 4, 10),
      nextBillingDate: in8Days,
      lastUsedDate: thirtyEightDaysAgo,
    },
  });

  // 4. Guruh va Family Sharing yaratish (Spotify Family)
  const in5Days = new Date(today);
  in5Days.setDate(today.getDate() + 5);

  const group = await prisma.subscriptionGroup.create({
    data: {
      name: 'Spotify Family (Dostlar)',
      creatorId: user.telegramId,
      members: {
        create: [
          { userId: user.id, role: 'LEADER' },
          { userId: friend1.id, role: 'MEMBER' },
          { userId: friend2.id, role: 'MEMBER' },
        ],
      },
    },
    include: { members: true },
  });

  const spotifySub = await prisma.subscription.create({
    data: {
      userId: user.id,
      name: 'Spotify Family',
      category: 'Musiqa',
      icon: '🎵',
      price: 4.99,
      currency: 'USD',
      priceInUZS: Math.round(4.99 * usdRate),
      billingCycle: 'MONTHLY',
      firstBillDate: new Date(today.getFullYear(), today.getMonth() - 1, 18),
      nextBillingDate: in5Days,
      isShared: true,
      groupId: group.id,
      lastUsedDate: new Date(),
    },
  });

  // Guruh a'zolariga teng ulush: 4.99 USD / 3 kishi
  const shareAmount = Math.round((4.99 * usdRate) / 3);

  const leaderMember = group.members.find(m => m.userId === user.id)!;
  const friend1Member = group.members.find(m => m.userId === friend1.id)!;
  const friend2Member = group.members.find(m => m.userId === friend2.id)!;

  await prisma.subscriptionShare.createMany({
    data: [
      {
        subscriptionId: spotifySub.id,
        memberId: leaderMember.id,
        amount: shareAmount,
        status: 'CONFIRMED',
        dueBillingDate: in5Days,
      },
      {
        subscriptionId: spotifySub.id,
        memberId: friend1Member.id,
        amount: shareAmount,
        status: 'PAID', // Jasur to'ladim dedi
        dueBillingDate: in5Days,
        paidAt: new Date(),
      },
      {
        subscriptionId: spotifySub.id,
        memberId: friend2Member.id,
        amount: shareAmount,
        status: 'PENDING', // Malika hali to'lamadi
        dueBillingDate: in5Days,
      },
    ],
  });

  console.log('✅ Demo ma\'lumotlar muvaffaqiyatli kiritildi!');
}

main()
  .catch((e) => {
    console.error('Seed xatosi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
