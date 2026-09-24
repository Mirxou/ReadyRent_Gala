// Seed script — run with: bun prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Seeding rental platform…');

  // wipe in FK-safe order
  await db.emailLog.deleteMany();
  await db.review.deleteMany();
  await db.booking.deleteMany();
  await db.item.deleteMany();
  await db.customer.deleteMany();
  await db.merchant.deleteMany();

  // ─── Merchants ────────────────────────────────────────────────────
  const oasis = await db.merchant.create({
    data: { name: 'واحة التجهيزات', email: 'oasis@kraa.dz', phone: '+213 555 11 22 33' },
  });
  const desertCamp = await db.merchant.create({
    data: { name: 'تخييم الصحراء', email: 'desert@kraa.dz', phone: '+213 555 44 55 66' },
  });
  const techRent = await db.merchant.create({
    data: { name: 'تك رينت', email: 'tech@kraa.dz', phone: '+213 555 77 88 99' },
  });

  // ─── Customers ────────────────────────────────────────────────────
  const amine = await db.customer.create({
    data: { name: 'أمين بلقاسم', email: 'amine@demo.dz', phone: '+213 666 00 11 22' },
  });
  const lina = await db.customer.create({
    data: { name: 'ليلى مرابط', email: 'lina@demo.dz', phone: '+213 666 33 44 55' },
  });

  // ─── Items ────────────────────────────────────────────────────────
  const tent = await db.item.create({
    data: {
      name: 'خيمة عائلية 6 أشخاص',
      description:
        'خيمة مقاومة للماء والأشعة فوق البنفسجية تتسع لـ 6 أشخاص، مع غرفة نشرتين وحصيرة أرضية. مثالية لعطلات نهاية الأسبوع في الشراق أو تيكجدة.',
      category: 'تخييم',
      imageUrl: '/items/tent.png',
      dailyRate: 3500,
      deposit: 10000,
      insuranceFee: 500,
      merchantId: desertCamp.id,
    },
  });
  const bike = await db.item.create({
    data: {
      name: 'دراجة جبلية كاملة التجهيز',
      description:
        'دراجة جبلية بإطار 27.5"، 21 سرعة، فرامل قرصية هيدروليكية وخوذة مجانية مع كل كراء.',
      category: 'تنقل',
      imageUrl: '/items/bike.png',
      dailyRate: 2000,
      deposit: 15000,
      insuranceFee: 400,
      merchantId: oasis.id,
    },
  });
  const vacuum = await db.item.create({
    data: {
      name: 'مكنسة تنظيف صناعية',
      description:
        'مكنسة ضغط عالي للتنظيف العميق للسجاد والموكيت والواجهات. تشغيل هادئ وقوية — بدون ضمان مادي، فقط وثيقة تعريف موقعة.',
      category: 'أدوات',
      imageUrl: '/items/vacuum.png',
      dailyRate: 4500,
      deposit: 0,
      insuranceFee: 800,
      merchantId: oasis.id,
    },
  });
  const camera = await db.item.create({
    data: {
      name: 'كاميرا سينمائية + عدسين',
      description:
        'كاميرا احترافية 4K مع مثبّت، عدسة 24-70mm وعدسة 50mm، بطاريتان وحقيبة نقل صلبة.',
      category: 'تصوير',
      imageUrl: '/items/camera.png',
      dailyRate: 12000,
      deposit: 50000,
      insuranceFee: 3000,
      merchantId: techRent.id,
    },
  });
  const generator = await db.item.create({
    data: {
      name: 'مولّد كهربائي محمول 3 كيلوواط',
      description:
        'مولّد بنزين هادئ بقوة 3kW يكفي لموقع بناء صغير أو مخيم فاخر. يأتي بوعاء وقود إضافي.',
      category: 'أدوات',
      imageUrl: '/items/generator.png',
      dailyRate: 6000,
      deposit: 20000,
      insuranceFee: 1200,
      merchantId: oasis.id,
    },
  });
  const projector = await db.item.create({
    data: {
      name: 'بروجيكتور + شاشة 120"',
      description:
        'بروجيكتور 4500 لومن مع شاشة قابلة للطي مقاس 120 بوصة — مثالي للفعاليات والأعراس والندوات.',
      category: 'فعاليات',
      imageUrl: '/items/projector.png',
      dailyRate: 5000,
      deposit: 15000,
      insuranceFee: 1000,
      merchantId: techRent.id,
    },
  });

  // ─── A completed historical booking + reviews (so items show ratings) ──
  const now = new Date();
  const pastStart = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
  const pastEnd = new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000);
  const oldBooking = await db.booking.create({
    data: {
      itemId: tent.id,
      customerId: lina.id,
      startDate: pastStart,
      endDate: pastEnd,
      days: 3,
      rentalPrice: 10500,
      deposit: 10000,
      insuranceFee: 500,
      totalPrice: 21000,
      lateFeePerDay: Math.round(3500 * 0.3),
      lateFee: 0,
      depositHeld: 10000,
      depositReturned: 10000,
      status: 'COMPLETED',
      paymentRef: 'SEED-PAY-001',
      paidAt: pastStart,
      returnedAt: pastEnd,
    },
  });
  await db.review.create({
    data: {
      bookingId: oldBooking.id,
      itemId: tent.id,
      customerId: lina.id,
      rating: 5,
      comment: 'خيمة نظيفة ومتينة، والتاجر تعامل راقٍ جداً. الضمان رجع لي في نفس اليوم!',
    },
  });

  const pastStart2 = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000);
  const pastEnd2 = new Date(now.getTime() - 38 * 24 * 60 * 60 * 1000);
  const oldBooking2 = await db.booking.create({
    data: {
      itemId: bike.id,
      customerId: amine.id,
      startDate: pastStart2,
      endDate: pastEnd2,
      days: 2,
      rentalPrice: 4000,
      deposit: 15000,
      insuranceFee: 400,
      totalPrice: 19400,
      lateFeePerDay: Math.round(2000 * 0.3),
      lateFee: 0,
      depositHeld: 15000,
      depositReturned: 15000,
      status: 'COMPLETED',
      paymentRef: 'SEED-PAY-002',
      paidAt: pastStart2,
      returnedAt: pastEnd2,
    },
  });
  await db.review.create({
    data: {
      bookingId: oldBooking2.id,
      itemId: bike.id,
      customerId: amine.id,
      rating: 4,
      comment: 'دراجة بحالة ممتازة، فقط الفرامل احتاجت ضبطاً بسيطاً من جهتي.',
    },
  });

  console.log('✅ Seed complete:');
  console.log(`   merchants: 3, customers: 2, items: 6, completed bookings: 2, reviews: 2`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
