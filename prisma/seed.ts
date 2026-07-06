import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

// Deterministic CUID-like IDs for referential integrity
function cid(prefix: string, num: number): string {
  return `${prefix}${String(num).padStart(4, '0')}`;
}

async function main() {
  console.log('🌱 Seeding STANDARD.Rent database...');

  // ──── Users ────
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);
  const demoUserId = cid('usr', 1);
  const adminUserId = cid('usr', 2);

  await db.user.upsert({
    where: { email: 'user@standard.dz' },
    update: {},
    create: {
      id: demoUserId,
      email: 'user@standard.dz',
      username: 'مستخدم_سيادي',
      passwordHash: hash('password123'),
      firstName: 'مستخدم',
      lastName: 'سيادي',
      phone: '0770 123 456',
      role: 'customer',
      trustScore: 72,
      walletBalance: 45250,
      isVerified: true,
    },
  });

  await db.user.upsert({
    where: { email: 'admin@standard.dz' },
    update: {},
    create: {
      id: adminUserId,
      email: 'admin@standard.dz',
      username: 'admin',
      passwordHash: hash('admin123'),
      firstName: 'مدير',
      lastName: 'النظام',
      role: 'admin',
      trustScore: 100,
      walletBalance: 0,
      isVerified: true,
    },
  });

  // ──── Categories ────
  const catData = [
    { nameAr: 'فساتين زفاف', slug: 'wedding-dresses', icon: 'https://picsum.photos/seed/cat-wedding/100/100' },
    { nameAr: 'بدلات رجالية', slug: 'mens-suits', icon: 'https://picsum.photos/seed/cat-suits/100/100' },
    { nameAr: 'قفطان جزائري', slug: 'caftan-algerian', icon: 'https://picsum.photos/seed/cat-caftan/100/100' },
    { nameAr: 'قرطاسيات', slug: 'karstassiya', icon: 'https://picsum.photos/seed/cat-karstass/100/100' },
    { nameAr: 'جلابيات فاخرة', slug: 'galabiya-luxury', icon: 'https://picsum.photos/seed/cat-galabiya/100/100' },
    { nameAr: 'أزياء مناسبات', slug: 'occasion-wear', icon: 'https://picsum.photos/seed/cat-occasion/100/100' },
  ];

  const catIds: string[] = [];
  for (const c of catData) {
    const cat = await db.category.create({ data: c });
    catIds.push(cat.id);
  }

  // ──── Vendors ────
  const vendorData = [
    { name: 'El Ksar Fashion House', nameAr: 'دار القصر للأزياء', description: 'A luxury fashion house in Constantine.', descriptionAr: 'دار أزياء فاخرة في قسنطينة متخصصة في فساتين الزفاف والأزياء التقليدية الجزائرية.', city: 'قسنطينة', rating: 4.9, trustScore: 96, productsCount: 45, totalSales: 387, avatar: 'https://picsum.photos/seed/vendor1/200/200', logo: 'https://picsum.photos/seed/vendor1/200/200', isVerified: true, website: 'https://www.facebook.com/ElKsarFashion', joinedDate: '2020-03-15' },
    { name: 'Casbah Couture', nameAr: 'كوتور القصبة', description: 'A luxury fashion boutique in Algiers.', descriptionAr: 'متجرب للأزياء الفاخرة في قلب العاصمة.', city: 'الجزائر العاصمة', rating: 4.7, trustScore: 92, productsCount: 62, totalSales: 425, avatar: 'https://picsum.photos/seed/vendor2/200/200', logo: 'https://picsum.photos/seed/vendor2/200/200', isVerified: true, website: 'https://www.instagram.com/casbahcouture.dz', joinedDate: '2019-07-22' },
    { name: 'Tlemcani Heritage', nameAr: 'تراث تلمساني', description: 'Traditional Tlemcen attire.', descriptionAr: 'متجر متخصص في الأزياء التقليدية التلمسانية.', city: 'تلمسان', rating: 4.8, trustScore: 95, productsCount: 38, totalSales: 312, avatar: 'https://picsum.photos/seed/vendor3/200/200', logo: 'https://picsum.photos/seed/vendor3/200/200', isVerified: true, website: 'https://www.facebook.com/TlemcaniHeritage', joinedDate: '2021-01-10' },
    { name: 'Oran Elegant Wear', nameAr: 'أناقة وهران', description: 'Elegant fashion gallery in Oran.', descriptionAr: 'معرض أزياء راقي في وهران.', city: 'وهران', rating: 4.5, trustScore: 87, productsCount: 29, totalSales: 198, avatar: 'https://picsum.photos/seed/vendor4/200/200', logo: 'https://picsum.photos/seed/vendor4/200/200', isVerified: true, website: 'https://www.facebook.com/OranElegantWear', joinedDate: '2022-05-18' },
    { name: 'Annaba Bridal Studio', nameAr: 'ستوديو عروس عنابة', description: 'Bridal studio in Annaba.', descriptionAr: 'ستوديو متخصص في أزياء العروسات في عنابة.', city: 'عنابة', rating: 4.6, trustScore: 89, productsCount: 24, totalSales: 156, avatar: 'https://picsum.photos/seed/vendor5/200/200', logo: 'https://picsum.photos/seed/vendor5/200/200', isVerified: false, website: 'https://www.instagram.com/annababridal', joinedDate: '2023-02-28' },
    { name: 'Sétif Fashion Gallery', nameAr: 'غاليري أزياء سطيف', description: 'Fashion gallery in Sétif.', descriptionAr: 'غاليري أزياء في سطيف.', city: 'سطيف', rating: 4.4, trustScore: 83, productsCount: 31, totalSales: 142, avatar: 'https://picsum.photos/seed/vendor6/200/200', logo: 'https://picsum.photos/seed/vendor6/200/200', isVerified: false, website: 'https://www.facebook.com/SetifFashionGallery', joinedDate: '2023-08-05' },
  ];

  const vendorIds: string[] = [];
  for (const v of vendorData) {
    const vendor = await db.vendor.create({ data: v });
    vendorIds.push(vendor.id);
  }

  // ──── Products (20) ────
  const productsData = [
    { name: 'Wedding Dress Princess Al Zahra', nameAr: 'فستان زفاف أميرة الزهراء', slug: 'fatan-zifaf-amira-al-zahra', description: 'فستان زفاف فاخر بتصميم أميري مطرّز يدوياً بأطراف ذهبية', pricePerDay: 25000, images: JSON.stringify([{id:1,url:'https://picsum.photos/seed/product1a/600/800',is_main:true},{id:2,url:'https://picsum.photos/seed/product1b/600/800',is_main:false},{id:3,url:'https://picsum.photos/seed/product1c/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product1a/600/800', locationName: 'قسنطينة', isAvailable: true, rating: 4.9, trustScore: 96, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['S','M','L','XL']), colorOptions: JSON.stringify(['أبيض','عاجي']), categoryId: catIds[0], vendorId: vendorIds[0] },
    { name: 'Classic Black Tuxedo', nameAr: 'بدلة سوداء كلاسيكية', slug: 'badla-sawda-classic', description: 'بدلة رسمية سوداء بتصميم كلاسيكي أنيق', pricePerDay: 8000, images: JSON.stringify([{id:4,url:'https://picsum.photos/seed/product2a/600/800',is_main:true},{id:5,url:'https://picsum.photos/seed/product2b/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product2a/600/800', locationName: 'الجزائر العاصمة', isAvailable: true, rating: 4.7, trustScore: 92, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL','XXL']), colorOptions: JSON.stringify(['أسود','كحلي غامق']), categoryId: catIds[1], vendorId: vendorIds[1] },
    { name: 'Royal Algerian Caftan Gold', nameAr: 'قفطان جزائري ملكي ذهبي', slug: 'qaftan-malaki-dhahabi', description: 'قفطان جزائري فاخر مطرّز بخيوط الذهب الخالص', pricePerDay: 18000, images: JSON.stringify([{id:6,url:'https://picsum.photos/seed/product3a/600/800',is_main:true},{id:7,url:'https://picsum.photos/seed/product3b/600/800',is_main:false},{id:8,url:'https://picsum.photos/seed/product3c/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product3a/600/800', locationName: 'تلمسان', isAvailable: true, rating: 5.0, trustScore: 98, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['ذهبي','أحمر ذهبي']), categoryId: catIds[2], vendorId: vendorIds[2] },
    { name: 'Elegant Karstassiya Blouse', nameAr: 'قرطاسية أنيقة', slug: 'kartasiya-aniqa', description: 'قرطاسية جزائرية تقليدية بتطريز يدوي دقيق', pricePerDay: 10000, images: JSON.stringify([{id:9,url:'https://picsum.photos/seed/product4a/600/800',is_main:true},{id:10,url:'https://picsum.photos/seed/product4b/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product4a/600/800', locationName: 'وهران', isAvailable: true, rating: 4.8, trustScore: 90, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['أزرق سماوي','وردي']), categoryId: catIds[3], vendorId: vendorIds[3] },
    { name: 'Luxury Galabiya Embroidered', nameAr: 'جلابية فاخرة مطرّزة', slug: 'galabiya-fakhira-mutarriza', description: 'جلابية فاخرة مطرّزة بخيوط الحرير والذهب', pricePerDay: 12000, images: JSON.stringify([{id:11,url:'https://picsum.photos/seed/product5a/600/800',is_main:true},{id:12,url:'https://picsum.photos/seed/product5b/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product5a/600/800', locationName: 'عنابة', isAvailable: true, rating: 4.6, trustScore: 85, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL','XXL']), colorOptions: JSON.stringify(['أبيض','بيج']), categoryId: catIds[4], vendorId: vendorIds[4] },
    { name: 'Bridal Caftan Sapphire', nameAr: 'قفطان عروس أزرق ياقوتي', slug: 'qaftan-arous-azraq', description: 'قفطان عروس بلون أزرق ياقوتي نادر', pricePerDay: 22000, images: JSON.stringify([{id:13,url:'https://picsum.photos/seed/product6a/600/800',is_main:true},{id:14,url:'https://picsum.photos/seed/product6b/600/800',is_main:false},{id:15,url:'https://picsum.photos/seed/product6c/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product6a/600/800', locationName: 'قسنطينة', isAvailable: true, rating: 4.9, trustScore: 95, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['أزرق ياقوتي']), categoryId: catIds[2], vendorId: vendorIds[0] },
    { name: 'Evening Gown Rose', nameAr: 'فستان سهرة وردي', slug: 'fatan-sahra-waradi', description: 'فستان سهرة أنيق باللون الوردي', pricePerDay: 9000, images: JSON.stringify([{id:16,url:'https://picsum.photos/seed/product7a/600/800',is_main:true},{id:17,url:'https://picsum.photos/seed/product7b/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product7a/600/800', locationName: 'البليدة', isAvailable: true, rating: 4.5, trustScore: 82, isPremium: false, isVerified: false, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['وردي','خوخي']), categoryId: catIds[5], vendorId: vendorIds[5] },
    { name: "Men's Wedding Suit Ivory", nameAr: 'بدلة زفاف رجالية عاجية', slug: 'badla-zifaf-rija-iwajiya', description: 'بدلة زفاف رجالية باللون العاجي', pricePerDay: 15000, images: JSON.stringify([{id:18,url:'https://picsum.photos/seed/product8a/600/800',is_main:true},{id:19,url:'https://picsum.photos/seed/product8b/600/800',is_main:false}]), primaryImage: 'https://picsum.photos/seed/product8a/600/800', locationName: 'الجزائر العاصمة', isAvailable: true, rating: 4.8, trustScore: 91, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['عاجي','بيج']), categoryId: catIds[1], vendorId: vendorIds[1] },
    { name: 'Traditional Red Caftan', nameAr: 'قفطان تقليدي أحمر', slug: 'qaftan-taqlidi-ahmar', description: 'قفطان جزائري تقليدي باللون الأحمر', pricePerDay: 14000, images: JSON.stringify([{id:20,url:'https://picsum.photos/seed/product9a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product9a/600/800', locationName: 'قسنطينة', isAvailable: true, rating: 4.7, trustScore: 88, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['أحمر']), categoryId: catIds[2], vendorId: vendorIds[0] },
    { name: 'Royal White Galabiya', nameAr: 'جلابية ملكية بيضاء', slug: 'galabiya-malakiya-baida', description: 'جلابية بيضاء ملكية مطرّزة', pricePerDay: 11000, images: JSON.stringify([{id:21,url:'https://picsum.photos/seed/product10a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product10a/600/800', locationName: 'تلمسان', isAvailable: true, rating: 4.6, trustScore: 86, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['S','M','L','XL']), colorOptions: JSON.stringify(['أبيض']), categoryId: catIds[4], vendorId: vendorIds[2] },
    { name: 'Lace Evening Dress', nameAr: 'فستان دانتيل سهرة', slug: 'fatan-dantil-sahra', description: 'فستان دانتيل أنيق للسهرات', pricePerDay: 9500, images: JSON.stringify([{id:22,url:'https://picsum.photos/seed/product11a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product11a/600/800', locationName: 'وهران', isAvailable: true, rating: 4.4, trustScore: 80, isPremium: false, isVerified: false, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['أسود','أحمر']), categoryId: catIds[5], vendorId: vendorIds[3] },
    { name: 'Gold Thread Karstassiya', nameAr: 'قرطاسية بخيوط الذهب', slug: 'kartasiya-khayut-dhahab', description: 'قرطاسية فاخرة بخيوط الذهب', pricePerDay: 16000, images: JSON.stringify([{id:23,url:'https://picsum.photos/seed/product12a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product12a/600/800', locationName: 'قسنطينة', isAvailable: true, rating: 4.9, trustScore: 94, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['S','M']), colorOptions: JSON.stringify(['ذهبي']), categoryId: catIds[3], vendorId: vendorIds[0] },
    { name: 'Modern Algerian Suit', nameAr: 'بدلة جزائرية عصرية', slug: 'badla-jaza-iriya-asriya', description: 'بدلة عصرية بلمسة جزائرية', pricePerDay: 7000, images: JSON.stringify([{id:24,url:'https://picsum.photos/seed/product13a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product13a/600/800', locationName: 'الجزائر العاصمة', isAvailable: true, rating: 4.5, trustScore: 84, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['كحلي','رمادي']), categoryId: catIds[1], vendorId: vendorIds[1] },
    { name: 'Navy Blue Formal Suit', nameAr: 'بدلة رسمية كحلية', slug: 'badla-rasmia-kuhliya', description: 'بدلة رسمية كحلية أنيقة', pricePerDay: 7500, images: JSON.stringify([{id:25,url:'https://picsum.photos/seed/product14a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product14a/600/800', locationName: 'عنابة', isAvailable: true, rating: 4.6, trustScore: 87, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL','XXL']), colorOptions: JSON.stringify(['كحلي']), categoryId: catIds[1], vendorId: vendorIds[4] },
    { name: 'Pink Bridal Kaftan', nameAr: 'قفطان عروس وردي', slug: 'qaftan-arous-waradi', description: 'قفطان عروس وردية أنيق', pricePerDay: 19000, images: JSON.stringify([{id:26,url:'https://picsum.photos/seed/product15a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product15a/600/800', locationName: 'تلمسان', isAvailable: true, rating: 4.8, trustScore: 93, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['وردي']), categoryId: catIds[2], vendorId: vendorIds[2] },
    { name: 'Green Traditional Caftan', nameAr: 'قفطان أخضر تقليدي', slug: 'qaftan-akhdar-taqlidi', description: 'قفطان أخضر تقليدي جزائري', pricePerDay: 13000, images: JSON.stringify([{id:27,url:'https://picsum.photos/seed/product16a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product16a/600/800', locationName: 'سطيف', isAvailable: true, rating: 4.5, trustScore: 85, isPremium: false, isVerified: true, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['أخضر زيتوني']), categoryId: catIds[2], vendorId: vendorIds[5] },
    { name: 'Short Moroccan Djellaba', nameAr: 'جلابية مغربية قصيرة', slug: 'jilabiya-maghribiya-qasira', description: 'جلابية مغربية قصيرة أنيقة', pricePerDay: 6000, images: JSON.stringify([{id:28,url:'https://picsum.photos/seed/product17a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product17a/600/800', locationName: 'وهران', isAvailable: true, rating: 4.3, trustScore: 79, isPremium: false, isVerified: false, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['أبيض','كريمي']), categoryId: catIds[4], vendorId: vendorIds[3] },
    { name: 'Silver Evening Gown', nameAr: 'فستان سهرة فضي', slug: 'fatan-sahra-fiddi', description: 'فستان سهرة فضي لامع', pricePerDay: 8500, images: JSON.stringify([{id:29,url:'https://picsum.photos/seed/product18a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product18a/600/800', locationName: 'قسنطينة', isAvailable: true, rating: 4.4, trustScore: 81, isPremium: false, isVerified: false, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['فضي']), categoryId: catIds[5], vendorId: vendorIds[0] },
    { name: 'Gray Short Suit', nameAr: 'بدلة رمادية قصيرة', slug: 'badla-ramdiya-qasira', description: 'بدلة رمادية قصيرة للمناسبات', pricePerDay: 6500, images: JSON.stringify([{id:30,url:'https://picsum.photos/seed/product19a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product19a/600/800', locationName: 'سطيف', isAvailable: true, rating: 4.2, trustScore: 78, isPremium: false, isVerified: false, sizeOptions: JSON.stringify(['M','L','XL']), colorOptions: JSON.stringify(['رمادي']), categoryId: catIds[1], vendorId: vendorIds[5] },
    { name: 'Beige Caftan Tlemcen', nameAr: 'قفطان بيج تلمساني', slug: 'qaftan-bej-telmcani', description: 'قفطان بيج بطراز تلمساني أصيل', pricePerDay: 17000, images: JSON.stringify([{id:31,url:'https://picsum.photos/seed/product20a/600/800',is_main:true}]), primaryImage: 'https://picsum.photos/seed/product20a/600/800', locationName: 'تلمسان', isAvailable: true, rating: 4.7, trustScore: 90, isPremium: true, isVerified: true, sizeOptions: JSON.stringify(['S','M','L']), colorOptions: JSON.stringify(['بيج']), categoryId: catIds[2], vendorId: vendorIds[2] },
  ];

  const productIds: string[] = [];
  for (const p of productsData) {
    const product = await db.product.create({ data: p });
    productIds.push(product.id);
  }

  // Update category product counts
  for (let i = 0; i < catIds.length; i++) {
    const count = await db.product.count({ where: { categoryId: catIds[i] } });
    await db.category.update({ where: { id: catIds[i] }, data: { productCount: count } });
  }

  // ──── Artisans ────
  const artisansData = [
    { name: 'Amina Benali', nameAr: 'أمينة بن علي', specialty: 'Caftan Embroidery', specialtyAr: 'تطريز قفطان', rating: 4.9, location: 'قسنطينة', avatar: 'https://picsum.photos/seed/artisan1/200/200', bioAr: 'حرفية متخصصة في تطريز القفطان الجزائري بخيوط الذهب والفضة. خبرة تزيد عن 20 سنة.', isVerified: true, trustScore: 96, completedOrders: 423, specialties: JSON.stringify(['تطريز قفطان','تطريز قرطاسية','فوقية']), responseTime: 'خلال ساعة' },
    { name: 'Karim Bouzid', nameAr: 'كريم بوزيد', specialty: 'Traditional Sewing', specialtyAr: 'خياطة تقليدية', rating: 4.7, location: 'الجزائر العاصمة', avatar: 'https://picsum.photos/seed/artisan2/200/200', bioAr: 'خياط تقليدي محترف متخصص في تفصيل الأزياء الجزائرية الأصيلة.', isVerified: true, trustScore: 91, completedOrders: 312, specialties: JSON.stringify(['تفصيل قفطان','خياطة بدلات','تعديل مقاسات']), responseTime: 'خلال ساعتين' },
    { name: 'Fatima Zohra', nameAr: 'فاطمة الزهراء', specialty: 'Bridal Accessories', specialtyAr: 'إكسسوارات العروس', rating: 4.8, location: 'وهران', avatar: 'https://picsum.photos/seed/artisan3/200/200', bioAr: 'مصممة إكسسوارات العروس. متخصصة في التيجان والأحزمة والمجوهرات التقليدية.', isVerified: true, trustScore: 89, completedOrders: 289, specialties: JSON.stringify(['تيجان','أحزمة','مجوهرات تقليدية']), responseTime: 'خ خلال 3 ساعات' },
    { name: 'Yacine Meddour', nameAr: 'ياسين مدور', specialty: 'Fabric Dyeing', specialtyAr: 'صباغة الأقمشة', rating: 4.6, location: 'تلمسان', avatar: 'https://picsum.photos/seed/artisan4/200/200', bioAr: 'صباغ محترف للأقمشة الطبيعية. يستخدم أصباغ نباتية تقليدية.', isVerified: true, trustScore: 86, completedOrders: 178, specialties: JSON.stringify(['صباغة طبيعية','صباغة تقليدية','تلوين قفطان']), responseTime: 'خلال 5 ساعات' },
    { name: 'Nadia Khellaf', nameAr: 'نادية خلف', specialty: 'Bridal Makeup', specialtyAr: 'مكياج عروس', rating: 4.8, location: 'قسنطينة', avatar: 'https://picsum.photos/seed/artisan5/200/200', bioAr: 'خبيرة مكياج محترفة مع شهادات دولية. متخصصة في مكياج العروس.', isVerified: true, trustScore: 92, completedOrders: 567, specialties: JSON.stringify(['مكياج عروس','مكياج حفلات','تسريحات شعر']), responseTime: 'خلال 30 دقيقة' },
    { name: 'Houria Cherif', nameAr: 'هورية شريف', specialty: 'Floral Arrangement', specialtyAr: 'تنسيق زهور', rating: 4.6, location: 'البليدة', avatar: 'https://picsum.photos/seed/artisan6/200/200', bioAr: 'فنانة تنسيق زهور محترفة.', isVerified: true, trustScore: 87, completedOrders: 201, specialties: JSON.stringify(['باقات زهور','تنسيق أعراس','ديكور زهور']), responseTime: 'خلال ساعتين' },
    { name: 'Djamilia Ait Ahmed', nameAr: 'جميلة آيت أحمد', specialty: 'Luxury Sewing', specialtyAr: 'خياطة وتعديل فاخرة', rating: 4.5, location: 'سطيف', avatar: 'https://picsum.photos/seed/artisan7/200/200', bioAr: 'خياطة متخصصة في تعديل وتفصيل الأزياء الفاخرة.', isVerified: true, trustScore: 84, completedOrders: 378, specialties: JSON.stringify(['تعديل أزياء','تفصيل على المقاس','إصلاح ملابس فاخرة']), responseTime: 'خلال 4 ساعات' },
    { name: 'Yasmine Ould Mohand', nameAr: 'ياسمين ولد محمد', specialty: 'Caftan Design', specialtyAr: 'تصميم قفطان وقرطاسيات', rating: 4.9, location: 'قسنطينة', avatar: 'https://picsum.photos/seed/artisan8/200/200', bioAr: 'مصممة متخصصة في القفطان والقرطاسيات الجزائرية.', isVerified: true, trustScore: 95, completedOrders: 267, specialties: JSON.stringify(['قفطان جزائري','قرطاسية','فوقية']), responseTime: 'خلال ساعة واحدة' },
  ];

  for (const a of artisansData) {
    await db.artisan.create({ data: a });
  }

  // ──── Bundles ────
  const bundlesData = [
    { name: 'Wedding Complete Bundle', nameAr: 'باقة زفاف شاملة', descriptionAr: 'باقة متكاملة لليوم المميز تشمل فستان زفاف، بدلة العريس، تنسيق الزهور، والمكياج.', discountPercentage: 15, totalPrice: 55000, image: 'https://picsum.photos/seed/bundle1/600/400', includes: JSON.stringify(['فستان زفاف أميرة الزهراء','بدلة زفاف رجالية عاجية','تنسيق زهور','مكياج عروس']), validDays: 3 },
    { name: 'Gala Night Bundle', nameAr: 'باقة ليلة غالا', descriptionAr: 'باقة مثالية للسهرات الراقية وحفلات الغالا.', discountPercentage: 12, totalPrice: 16000, image: 'https://picsum.photos/seed/bundle2/600/400', includes: JSON.stringify(['فستان سهرة وردي','بدلة رسمية كحلية']), validDays: 1 },
    { name: 'Family Events Bundle', nameAr: 'باقة مناسبات عائلية', descriptionAr: 'باقة للمناسبات العائلية والاحتفالات.', discountPercentage: 10, totalPrice: 22000, image: 'https://picsum.photos/seed/bundle3/600/400', includes: JSON.stringify(['قفطان تقليدي أحمر','بدلة رمادية قصيرة']), validDays: 2 },
    { name: 'Bridal Caftan Set', nameAr: 'طقم قفطان العروس', descriptionAr: 'طقم كامل للعروس يشمل قفطان ذهبي وقرطاسية مطرّزة.', discountPercentage: 18, totalPrice: 30000, image: 'https://picsum.photos/seed/bundle4/600/400', includes: JSON.stringify(['قفطان جزائري ملكي ذهبي','قرطاسية بخيوط الذهب']), validDays: 3 },
    { name: 'Traditional Tlemcen Set', nameAr: 'طقم تلمسان التقليدي', descriptionAr: 'طقم تقليدي من تلمسان يشمل قفطان أزرق وجلابية بيضاء.', discountPercentage: 14, totalPrice: 31000, image: 'https://picsum.photos/seed/bundle5/600/400', includes: JSON.stringify(['قفطان عروس أزرق ياقوتي','جلابية ملكية بيضاء']), validDays: 3 },
  ];

  const bundleProductMap = [
    [0, 1],   // bundle 1 -> products 0,7
    [6, 13],  // bundle 2 -> products 6,13
    [8, 18],  // bundle 3 -> products 8,18
    [2, 11],  // bundle 4 -> products 2,11
    [5, 9],   // bundle 5 -> products 5,9
  ];

  for (let i = 0; i < bundlesData.length; i++) {
    const bundle = await db.bundle.create({ data: bundlesData[i] });
    const pIdxs = bundleProductMap[i];
    for (let j = 0; j < pIdxs.length; j++) {
      await db.bundleItem.create({
        data: { bundleId: bundle.id, productId: productIds[pIdxs[j]], order: j },
      });
    }
  }

  // ──── Reviews ────
  const reviewsData = [
    { productId: productIds[0], userId: demoUserId, reviewerName: 'سارة بن عبد الله', rating: 5, comment: 'فستان الزفاف كان رائعاً! الجودة ممتازة والتطريز يدوي بامتياز.', isVerified: true, status: 'approved', createdAt: new Date('2024-12-15T14:30:00Z') },
    { productId: productIds[1], userId: demoUserId, reviewerName: 'كريم بوجلال', rating: 4, comment: 'البدلة كانت نظيفة ومكوية بشكل جيد.', isVerified: true, status: 'approved', createdAt: new Date('2024-12-10T09:15:00Z') },
    { productId: productIds[2], userId: demoUserId, reviewerName: 'نورة بلقاسم', rating: 5, comment: 'القفطان الذهبي كان تحفة فنية!', isVerified: true, status: 'approved', createdAt: new Date('2024-11-28T16:45:00Z') },
    { productId: productIds[5], userId: demoUserId, reviewerName: 'ياسين مراد', rating: 5, comment: 'قفطان العروس الأزرق كان أجمل مما تخيلت.', isVerified: true, status: 'approved', createdAt: new Date('2024-11-20T11:00:00Z') },
    { productId: productIds[3], userId: demoUserId, reviewerName: 'هدى شريف', rating: 4, comment: 'القرطاسية جميلة جداً والتطريز دقيق.', isVerified: true, status: 'approved', createdAt: new Date('2024-11-15T08:30:00Z') },
    { productId: productIds[7], userId: demoUserId, reviewerName: 'محمد أمين زروال', rating: 5, comment: 'بدلة الزفاف كانت مثالية!', isVerified: true, status: 'approved', createdAt: new Date('2024-11-05T13:20:00Z') },
    { productId: productIds[13], userId: demoUserId, reviewerName: 'إيمان حمداني', rating: 4, comment: 'فستان الدانتيل جميل وأنيق.', isVerified: false, status: 'approved', createdAt: new Date('2024-10-28T17:45:00Z') },
    { productId: productIds[13], userId: demoUserId, reviewerName: 'بلال بن عمر', rating: 4, comment: 'البدلة الكحلية كانت مناسبة جداً للمناسبة.', isVerified: true, status: 'approved', createdAt: new Date('2024-10-20T10:00:00Z') },
    { productId: productIds[0], userId: demoUserId, reviewerName: 'رشيدة بوزيان', rating: 5, comment: 'أفضل تجربة كراء مرت بها! الفستان كان نظيفاً ومعطراً وجاهزاً للارتداء.', isVerified: true, status: 'approved', createdAt: new Date('2024-10-15T12:00:00Z') },
    { productId: productIds[4], userId: demoUserId, reviewerName: 'عمار حداد', rating: 3, comment: 'الجلابية جميلة لكن المقاس كان أصغر قليلاً.', isVerified: true, status: 'approved', createdAt: new Date('2024-10-10T09:30:00Z') },
  ];

  for (const r of reviewsData) {
    await db.review.create({ data: r });
  }

  // ──── Local Guide Categories ────
  const lgCats = [
    { nameAr: 'تصوير مناسبات', nameEn: 'Event Photography', slug: 'photography', icon: 'Camera', serviceCount: 3 },
    { nameAr: 'مكياج وتجميل', nameEn: 'Makeup & Beauty', slug: 'makeup', icon: 'Sparkles', serviceCount: 2 },
    { nameAr: 'ديجي وموسيقى', nameEn: 'DJ & Music', slug: 'dj', icon: 'Music', serviceCount: 2 },
    { nameAr: 'قاعات الأفراح', nameEn: 'Wedding Halls', slug: 'halls', icon: 'Building2', serviceCount: 2 },
    { nameAr: 'ديكور وزينة', nameEn: 'Decoration', slug: 'decoration', icon: 'Flower2', serviceCount: 2 },
    { nameAr: 'حفلات وأفراح', nameEn: 'Party Planning', slug: 'party-planning', icon: 'PartyPopper', serviceCount: 1 },
    { nameAr: 'تصوير فيديو', nameEn: 'Videography', slug: 'videography', icon: 'Video', serviceCount: 1 },
    { nameAr: 'طباخين وحلويات', nameEn: 'Chefs & Pastries', slug: 'catering', icon: 'ChefHat', serviceCount: 1 },
  ];

  const lgCatIds: string[] = [];
  for (const c of lgCats) {
    const cat = await db.localGuideCategory.create({ data: c });
    lgCatIds.push(cat.id);
  }

  // ──── Local Guide Services ────
  const lgServices = [
    { name: 'Studio El Nor Photography', nameAr: 'ستوديو النور للتصوير', categoryId: lgCatIds[0], city: 'الجزائر العاصمة', rating: 4.9, reviewCount: 127, priceRange: '15000 - 35000 د.ج', descriptionAr: 'فريق تصوير احترافي متخصص في الأعراس والمناسبات.', phone: '0661 789 012', whatsapp: '213661789012', isVerified: true, featured: true },
    { name: 'Makeup by Amina', nameAr: 'مكياج أمينة', categoryId: lgCatIds[1], city: 'وهران', rating: 4.8, reviewCount: 89, priceRange: '15000 - 40000 د.ج', descriptionAr: 'خبيرة مكياج محترفة مع 8 سنوات خبرة.', phone: '0770 345 678', whatsapp: '213770345678', isVerified: true, featured: true },
    { name: 'DJ Karim Events', nameAr: 'دي جي كريم', categoryId: lgCatIds[2], city: 'البليدة', rating: 4.6, reviewCount: 64, priceRange: '25000 - 80000 د.ج', descriptionAr: 'دي جي محترف مع أحدث المعدات الصوتية والإضاءة.', phone: '0542 567 890', whatsapp: '213542567890', isVerified: true, featured: false },
    { name: 'Dar El Arous Constantine', nameAr: 'دار العروس قسنطينة', categoryId: lgCatIds[3], city: 'قسنطينة', rating: 4.8, reviewCount: 203, priceRange: '150000 - 300000 د.ج', descriptionAr: 'قاعة أفراح فاخرة في قلب قسنطينة تتسع لـ 500 ضيف.', phone: '0555 123 456', whatsapp: '213555123456', isVerified: true, featured: true },
    { name: 'Golden Roses Decoration', nameAr: 'ورود ذهبية للديكور', categoryId: lgCatIds[4], city: 'عنابة', rating: 4.5, reviewCount: 56, priceRange: '20000 - 80000 د.ج', descriptionAr: 'فريق ديكور محترف متخصص في زينة الأعراس.', phone: '0698 234 567', whatsapp: '213698234567', isVerified: true, featured: false },
    { name: 'Snap Wedding Photography', nameAr: 'سناب للتصوير', categoryId: lgCatIds[0], city: 'قسنطينة', rating: 4.7, reviewCount: 98, priceRange: '20000 - 50000 د.ج', descriptionAr: 'فريق تصوير متخصص في أعراس المغرب العربي.', phone: '0664 123 456', whatsapp: '213664123456', isVerified: true, featured: true },
    { name: 'Events Pro Sétif', nameAr: 'إيفانتس برو سطيف', categoryId: lgCatIds[5], city: 'سطيف', rating: 4.8, reviewCount: 142, priceRange: '100000 - 500000 د.ج', descriptionAr: 'شركة تنظيم حفلات متكاملة.', phone: '0550 678 901', whatsapp: '213550678901', isVerified: true, featured: true },
    { name: 'Chef Mourad Catering', nameAr: 'الشيف مراد للتموين', categoryId: lgCatIds[7], city: 'الجزائر العاصمة', rating: 4.9, reviewCount: 178, priceRange: '800 - 2500 د.ج/طبق', descriptionAr: 'خدمات تموين احترافية للأعراس.', phone: '0662 890 123', whatsapp: '213662890123', isVerified: true, featured: true },
    { name: 'Palais des Fêtes Tlemcen', nameAr: 'قصر الأفراح تلمسان', categoryId: lgCatIds[3], city: 'تلمسان', rating: 4.7, reviewCount: 156, priceRange: '100000 - 250000 د.ج', descriptionAr: 'قصر أفراح تاريخي بطراز معماري أندلسي.', phone: '0543 012 345', whatsapp: '213543012345', isVerified: true, featured: false },
    { name: 'Belle Visage Makeup', nameAr: 'بيل فيساج للمكياج', categoryId: lgCatIds[1], city: 'الجزائر العاصمة', rating: 4.8, reviewCount: 115, priceRange: '20000 - 45000 د.ج', descriptionAr: 'صالون مكياج وتجميل متخصص في مكياج العروس.', phone: '0551 234 567', whatsapp: '213551234567', isVerified: true, featured: false },
    { name: 'DJ Rachid Sound', nameAr: 'دي جي رشيد للصوتيات', categoryId: lgCatIds[2], city: 'عنابة', rating: 4.5, reviewCount: 47, priceRange: '20000 - 60000 د.ج', descriptionAr: 'دي جي مع 10 سنوات خبرة في الأعراس.', phone: '0772 345 678', whatsapp: '213772345678', isVerified: false, featured: false },
    { name: 'Vision Video Production', nameAr: 'فيجن فيديو للتصوير', categoryId: lgCatIds[6], city: 'البليدة', rating: 4.6, reviewCount: 73, priceRange: '30000 - 90000 د.ج', descriptionAr: 'شركة إنتاج فيديو متخصصة في تغطية الأعراس.', phone: '0663 456 789', whatsapp: '213663456789', isVerified: true, featured: false },
    { name: 'Ajwaa Decoration Studio', nameAr: 'أجواء للديكور والزينة', categoryId: lgCatIds[4], city: 'سطيف', rating: 4.4, reviewCount: 38, priceRange: '15000 - 60000 د.ج', descriptionAr: 'استوديو ديكور يقدم حلولاً إبداعية لتزيين قاعات الأفراح.', phone: '0554 567 890', whatsapp: '213554567890', isVerified: false, featured: false },
    { name: 'Adasa Constantine Photography', nameAr: 'عدسة قسنطينة للتصوير', categoryId: lgCatIds[0], city: 'قسنطينة', rating: 4.7, reviewCount: 91, priceRange: '18000 - 45000 د.ج', descriptionAr: 'استوديو تصوير فني في قسنطينة.', phone: '0665 678 901', whatsapp: '213665678901', isVerified: true, featured: true },
  ];

  for (const s of lgServices) {
    await db.localGuideService.create({ data: s });
  }

  // ──── Subscription Plans ────
  const subPlans = [
    { planId: 'free', nameAr: 'مجاني', nameEn: 'Free', price: 0, bookingsLimit: 3, features: JSON.stringify(['تصفح المنتجات','3 حجوزات شهرياً','دعم بالبريد']) },
    { planId: 'basic', nameAr: 'أساسي', nameEn: 'Basic', price: 1500, bookingsLimit: 10, features: JSON.stringify(['10 حجوزات شهرياً','تأمين أساسي مجاني','دعم هاتفي','شارة عضو أساسي']) },
    { planId: 'premium', nameAr: 'مميز', nameEn: 'Premium', price: 4500, bookingsLimit: -1, features: JSON.stringify(['حجوزات غير محدودة','تأمين متقدم مجاني','أولوية في العروض','خصم 10%','شارة عضو مميز','مستشار شخصي']) },
    { planId: 'vip', nameAr: 'VIP', nameEn: 'VIP', price: 9900, bookingsLimit: -1, features: JSON.stringify(['كل مميزات مميز','توصيل مجاني','دخول مبكر للعروض','نقاط ثقة مضاعفة','شارة VIP ذهبية','دعم على مدار الساعة']) },
  ];

  for (const sp of subPlans) {
    await db.subscriptionPlan.create({ data: sp });
  }

  // ──── Insurance Plans ────
  const insPlans = [
    { nameAr: 'خطة أساسية', nameEn: 'Basic Plan', price: 500, coverageAr: 'تغطية التلفيات البسيطة', coverageEn: 'Covers minor damages' },
    { nameAr: 'خطة متقدمة', nameEn: 'Premium Plan', price: 1200, coverageAr: 'تغطية شاملة تشمل التلفيات والفقدان', coverageEn: 'Comprehensive coverage including damage and loss' },
    { nameAr: 'خطة VIP', nameEn: 'VIP Plan', price: 2500, coverageAr: 'تغطية كاملة مع استبدال فوري', coverageEn: 'Full coverage with instant replacement' },
  ];

  for (const ip of insPlans) {
    await db.insurancePlan.create({ data: ip });
  }

  // ──── Delivery Zones ────
  await db.deliveryZone.createMany({
    data: [
      { name: 'الجزائر العاصمة', sameDayAvailable: true, deliveryFee: 500 },
      { name: 'وهران', sameDayAvailable: false, deliveryFee: 800 },
      { name: 'قسنطينة', sameDayAvailable: false, deliveryFee: 800 },
      { name: 'تلمسان', sameDayAvailable: false, deliveryFee: 1000 },
      { name: 'عنابة', sameDayAvailable: false, deliveryFee: 1000 },
      { name: 'سطيف', sameDayAvailable: false, deliveryFee: 900 },
      { name: 'البليدة', sameDayAvailable: true, deliveryFee: 500 },
    ],
  });

  // ──── Addresses (for demo user) ────
  await db.address.createMany({
    data: [
      { userId: demoUserId, address: 'شارع ديدوش مراد، الجزائر العاصمة', city: 'الجزائر العاصمة', isDefault: true },
      { userId: demoUserId, address: 'شارع لاربي بن مهيدي، وهران', city: 'وهران', isDefault: false },
    ],
  });

  // ──── Notifications (for demo user) ────
  await db.notification.createMany({
    data: [
      { userId: demoUserId, type: 'trust', title: 'ارتقاء الهوية السيادية', message: 'تم تحديث رصيد ثقتك إلى الرقم +85 بناءً على الالتزام بالعقود.', createdAt: new Date(Date.now() - 7200000) },
      { userId: demoUserId, type: 'financial', title: 'تحرير ضمان ائتماني', message: 'تم الإفراج عن مبلغ 12,000 DA من خزانة الضمان (Escrow).', createdAt: new Date(Date.now() - 18000000) },
      { userId: demoUserId, type: 'asset', title: 'مراقبة جودة الأصل', message: 'أصلك "فستان قسنطيني" مر بمرحلة فحص النظافة بنجاح.', isRead: true, createdAt: new Date(Date.now() - 86400000) },
      { userId: demoUserId, type: 'system', title: 'تحديث ميثاق STANDARD', message: 'تم تحديث بروتوكول التحكيم التلقائي V.2.1.', isRead: true, createdAt: new Date(Date.now() - 172800000) },
    ],
  });

  // ──── Wallet Transactions (for demo user) ────
  await db.transaction.createMany({
    data: [
      { userId: demoUserId, type: 'ESCROW_HELD', amount: 1250, note: 'حجز فستان سهرة - مرجع #2041', hash: '0x8f2d...23e1', createdAt: new Date() },
      { userId: demoUserId, type: 'INCOME', amount: 8500, note: 'تسوية حجز معدات تصوير', hash: '0x4e5f...6g7h', createdAt: new Date(Date.now() - 86400000) },
      { userId: demoUserId, type: 'EXPENDITURE', amount: 2100, note: 'رسوم فحص تقني - كاميرا سوني', hash: '0x9i0j...k1l2', createdAt: new Date(Date.now() - 172800000) },
    ],
  });

  // ──── CMS Pages ────
  await db.cMSPage.createMany({
    data: [
      { title: 'سياسة الخصوصية', slug: 'privacy', content: '<h2>سياسة الخصوصية</h2><p>نحترم خصوصيتك ونحمي بياناتك الشخصية وفقاً للتشريع الجزائري.</p>', status: 'published' },
      { title: 'شروط الاستخدام', slug: 'terms', content: '<h2>شروط الاستخدام</h2><p>باستخدامك منصة ستاندرد، فإنك توافق على هذه الشروط والأحكام.</p>', status: 'published' },
      { title: 'من نحن', slug: 'about', content: '<h2>من نحن</h2><p>ستاندرد هي منصة كراء ملابس فاخرة رقمية في الجزائر.</p>', status: 'published' },
    ],
  });

  // ──── Blog Posts ────
  await db.blogPost.createMany({
    data: [
      { title: 'دليل الكراء الفاخر في الجزائر', slug: 'luxury-rental-guide', content: '<p>مرحباً بكم في دليل الكراء الفاخر. اكتشفوا أفضل المنتجات والخدمات.</p>', excerpt: 'دليل شامل لكراء الملابس الفاخرة في الجزائر', status: 'published' },
      { title: 'كيف تختار فستان الزفاف المثالي', slug: 'choosing-wedding-dress', content: '<p>نصائح مهمة لاختيار فستان الزفاف المناسب لمناسبتك.</p>', excerpt: 'نصائح لاختيار فستان الزفاف', status: 'published' },
    ],
  });

  // ──── Branches ────
  await db.branch.createMany({
    data: [
      { name: 'فرع الجزائر العاصمة', city: 'الجزائر', address: 'شارع ديدوش مراد' },
      { name: 'فرع وهران', city: 'وهران', address: 'شارع لاربي بن مهيدي' },
    ],
  });

  // ──── Activity Logs ────
  await db.activityLog.createMany({
    data: [
      { userId: adminUserId, action: 'تسجيل دخول', target: 'لوحة التحكم', ip: '192.168.1.1' },
      { userId: adminUserId, action: 'تعديل منتج', target: 'فستان زفاف #5', ip: '192.168.1.2', createdAt: new Date(Date.now() - 3600000) },
      { userId: adminUserId, action: 'حذف حجز', target: 'BK-1234', ip: '192.168.1.3', createdAt: new Date(Date.now() - 7200000) },
    ],
  });

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });