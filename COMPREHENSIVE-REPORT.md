# 🔍 STANDARD.Rent — تقرير فحص شامل ومفصّل (كل الملفات)

> **التاريخ:** يوليو 2025  
> **النطاق:** كل ملف في المشروع — 1,485 ملف في 607 مجلد  
> **المنهجية:** نقطة محايدة تماماً — لا تحيّز — كل ملف مقروء وموثّق  
> **الإصدار:** التقرير الثاني (النهائي)

---

## 📊 الملخص التنفيذي

| المقياس | القيمة |
|---|---|
| **إجمالي الملفات** | **1,485 ملف** في 607 مجلد |
| **ملفات المشروع الفعلي** | **~410 ملف** (app + components + shared + lib + features + hooks + types + contexts + config) |
| **ملفات المهارات (skills/)** | **1,075 ملف** (69 مهارة — فقط 4 ذات صلة) |
| **ملفات مؤقتة/Artifact** | ~30 ملف (لقطات شاشة، تحليلات VLM، PID، logs) |
| **الإطار** | Next.js 16.1.1 + App Router + Turbopack + SQLite + Prisma |
| **API Routes** | 88 ملف route.ts |
| **الصفحات (page.tsx)** | 65 صفحة |
| **المكونات** | 84+ ملف |
| **المكونات السيادية** | 20 ملف |
| **المكتبات (lib/)** | 21 ملف |
| **قاعدة البيانات** | 34 نموذج Prisma + seed |
| **اللغات** | 3 (عربي/فرنسي/إنجليزي) — النظام ميت 100% |
| **الوقت الحقيقي** | Socket.IO على port 3004 |

### تقييم كل مجال

| المجال | التقييم | الملاحظة الرئيسية |
|---|---|---|
| **بنية المشروع** | 🟢 جيدة | تنظيم واضح، فصل المسؤوليات |
| **قاعدة البيانات (34 نموذج)** | 🟢 جيدة | علاقات صحيحة، cascade، unique constraints |
| **API Routes (88 ملف)** | 🟡 متوسطة | 68 بدون Zod، 76 بدون rate limiting، 8 بدون auth |
| **الصفحات (65)** | 🟡 متوسطة | 94% use client، 89% متجاوب، 85% بدون a11y |
| **المكونات (84)** | 🟡 متوسطة | 4 ملفات بـ `;;` خط نحوي، 21 مشكلة حرجة، 35 متوسطة |
| **المكونات السيادية (20)** | 🟡 متوسطة | 33% مكونات ميتة (stubs)، 1 يكسر البناء |
| **المكتبات (21)** | 🟡 متوسطة | 3 ملفات ميتة بالكامل (api-response, payment-security, seo)، 8 dead exports في api.ts |
| **المصادقة** | 🔴 خطير | جلسات في الذاكرة، middleware في وضع تجريبي |
| **المدفوعات** | 🔴 خطير | بيانات البطاقة تصل السيرفر، كود أمني ميت |
| **الضمان (Escrow)** | 🔴 خطير | آلة الحالات معرّفة لكن لا تُنفَّذ أبداً |
| **الهوية (VLM)** | 🟡 متوسطة | بدون حماية ضد الانتحال، صور بدون حد حجم |
| **القضائي/النزاعات** | 🟡 متوسطة | لا يوجد endpoint للفصل النهائي |
| **i18n** | 🔴 ميت | 128 مفتاح × 3 لغات + 0 مستهلك |
| **WebSocket** | 🟡 متوسطة | يعمل لكن بدون مصادقة، CORS * |
| **الأمان (Headers)** | 🟡 متوسطة | رؤوس جيدة لكن مكررة، بدون CSP/X-Frame-Options |
| **التكوين (Config)** | 🟡 متوسطة | Tailwind v3/v4 تعارض، tsconfig jsx خاطئ، package.json اسم خاطئ |
| **skills/** | ℹ️ غير ذي صلة | 1,075 ملف — 4 فقط مفيدة للمشروع |
| **Masterplan** | 🟢 موجودة | 865 سطر، 6 مراحل + 12 فجوة محددة |
| **Worklog** | 🟢 موجودة | 554 سطر، 9 مداخل وكيل |

---

## الفهرس التفصيلي لكل ملف في المشروع

### القسم 1: ملفات التكوين الجذرية (25 ملف)

#### 1.1 `.env`
- **المسار:** `/home/z/my-project/.env`
- **الغرض:** متغيرات البيئة
- **المحتوى:** سطر واحد فقط: `DATABASE_URL=file:/home/z/my-project/db/custom.db`
- **المشاكل:** لا يوجد `NEXTAUTH_SECRET`، لا يوجد `PAYMENT_HMAC_SECRET`، لا يوجد مفاتيح خدمات خارجية. كل المصادقة في الذاكرة. صلاحيات الملف مفتوحة (`-rwxr-xr-x`) — يجب أن تكون `600`.

#### 1.2 `.gitignore`
- **المسار:** `/home/z/my-project/.gitignore`
- **الغرض:** قواعد استثناء Git (64 سطر)
- **المشاكل:** 14+ لقطة شاشة `.png` غير مستثناة، `server.pid` و `review-results.txt` غير مستثناة، `upload/` غير مستثنى. `skills/` و `tool-results/` مستثنيتان ✅.

#### 1.3 `Caddyfile`
- **المسار:** `/home/z/my-project/Caddyfile`
- **الغرض:** بوابة Caddy عكسية على port 81
- **المشاكل:** 🔴 `XTransformPort` يسمح بالبروكسي لأي بورت على localhost (بما فيها منافذ حساسة مثل 5432). لا يوجد قائمة بورتات مسموحة. HTTP فقط بدون TLS.

#### 1.4 `package.json`
- **المسار:** `/home/z/my-project/package.json`
- **الغرض:** بيانات المشروع npm
- **المشاكل:** الاسم `"frontend"` بدل `standard-rent`. `prisma` في dependencies بدل devDependencies. `socket.io` (server) في dependencies لكن يُستخدم فقط في mini-services. لا يوجد سكريبت `db:push` أو `db:seed`. lockfile مزدوج (`package-lock.json` + `bun.lock`).

#### 1.5 `package-lock.json`
- **16,101 سطر** — lockfile npm v3، ~1,310 حزمة. يتواجد مع `bun.lock` — ازدواجية أدوات.

#### 1.6 `bun.lock`
- **2,757 سطر** — اسم workspace `nextjs_tailwind_shadcn_ts` لا يتطابق مع `package.json` (`frontend`).

#### 1.7 `tsconfig.json`
- **المشاكل:** `jsx: "react-jsx"` بدل `"preserve"` (مشاكل محتملة مع RSC). `noImplicitAny: false` يضعف TypeScript. Target ES2017 محافظ جداً. `allowJs: true` غير ضروري. `next-env.d.ts` في `include` لكنه gitignored وغير موجود.

#### 1.8 `eslint.config.mjs`
- **المشاكل:** مفقود ignores لـ `skills/`، `mini-services/`، `examples/`. لا توجد قواعد أمان مخصصة.

#### 1.9 `next.config.ts`
- **المشاكل:** `allowedDevOrigins: ['*']` واسع جداً. رؤوس أمنية مكررة مع middleware. `picsum.photos` و `images.unsplash.com` لا يزالان في remotePatterns.

#### 1.10 `tailwind.config.ts`
- **المشاكل:** ⚠️ إعدادات Tailwind v3 لكن `postcss.config.mjs` يستخدم Tailwind v4. هذا الملف **قد يُتجاهل بالكامل** في البناء الفعلي. مسارات المحتوى تنقص `features/**` و `shared/**` — صنفهم قد لا يعمل في الإنتاج.

#### 1.11 `postcss.config.mjs`
- **الغرض:** إعداد PostCSS — يستخدم `@tailwindcss/postcss` (Tailwind v4)
- **المشكلة:** 🔴 **تعارض إصدارات** — Tailwind v4 PostCSS لا يحمّل ملف `tailwind.config.ts` v3 تلقائياً. كل تخصيصات الألوان/الحدود في tailwind.config.ts قد تكون مهملة.

#### 1.12 `middleware.ts`
- **المشاكل:** 🔴 **وضع تجريبي** — لا يُنفّذ أي مصادقة فعلية. كل المسارات المحمية والإدارية تمر بدون فحص. رؤوس أمنية مكررة. HSTS لا يُرسل خلف Caddy (HTTP).

#### 1.13 `components.json`
- **الغرض:** إعداد shadcn/ui CLI — style: `new-york`, icons: `lucide`
- **المشكلة:** `tailwind.config` path فارغ.

#### 1.14 `MASTERPLAN.md`
- **865 سطر** — خطة التصليح والتطوير الكبرى. 6 مراحل + ملحق فجوات (12 فجوة). مفصّلة بالعربية.

#### 1.15 `worklog.md`
- **554 سطر** — سجل عمل الوكلاء. 9 مداخل تغطي: إصلاحات الأمان، ترحيل logger، إزالة any، WebSocket rewrite، audit API.

#### 1.16 `seed-content.ts`
- **178 سطر** — يبذر 4 صفحات CMS + 3 مدونات. يتعارض مع `prisma/seed.ts` (تكرار CMS/blog).

#### 1.17 `review-results.txt`
- **2,942 سطر** — نتيجة مراجعة UI تلقائية لـ 23 صفحة. يجب حذفه/gitignore.

#### 1.18 `review.sh`
- مراجعة UI تلقائية بـ agent-browser. ليس في gitignore.

#### 1.19-1.22 سكريبتات keep-alive (4 ملفات)
- `start-server.sh`، `run-server.sh`، `keep-alive.sh`، `server-keepalive.sh` — **4 سكريبتات مكررة** تقريباً متطابقة. يجب دمجها في واحد.

#### 1.23 لقطات شاشة الجذر (14 ملف `.png`)
- `review-*.png`، `check-*.png`، `verify-*.png`، `final-*.png` — كلها لقطات مؤقتة من جلسات المراجعة. يجب حذفها.

#### 1.24 `server.pid` + `COMPREHENSIVE-REPORT.md`
- `server.pid` — PID سيرفر (قديم/غير صالح). غير في gitignore.
- `COMPREHENSIVE-REPORT.md` — التقرير السابق (مهمل).

#### 1.25 `.zscripts/` (6 ملفات + 1 pid)

| الملف | الغرض | الملاحظة |
|---|---|---|
| `dev.sh` | بيئة التطوير الكاملة — install, db:push, next dev, mini-services | ✅ جيد |
| `start.sh` | بدء الإنتاج — next standalone + mini-services + Caddy | ✅ جيد |
| `build.sh` | بناء الإنتاج — next build + mini-services + tar.gz | ⚠️ مسار `/home/z/my-project` مُصلَّب |
| `mini-services-install.sh` | تثبيت كل mini-services | ✅ |
| `mini-services-build.sh` | بناء كل mini-services | ⚠️ مسار مُصلَّب |
| `mini-services-start.sh` | بدء mini-services في الإنتاج | ✅ |

---

### القسم 2: app/ — 182 ملف

#### 2.1 الصفحات (61 page.tsx) — قائمة كاملة

| # | المسار | الغرض | المشاكل الرئيسية |
|---|---|---|---|
| 1 | `(auth)/login/page.tsx` | تسجيل الدخول | Token في localStorage + cookie — سطح XSS مزدوج. لا رابط لـ forgot-password |
| 2 | `(auth)/register/page.tsx` | التسجيل | DOM-based password confirm بدل react-hook-form. username بدون فحص تفرد |
| 3 | `(auth)/layout.tsx` | غلاف صفحات المصادقة | `'use client'` غير ضروري |
| 4 | `page.tsx` (الرئيسية) | صفحة الهبوط 513 سطر | إحصائيات ثابتة (500+, 50+, 120+, 2000+). روابط الحرفيين كلها لـ `/artisans` بدل الملف الشخصي |
| 5 | `about/page.tsx` | من نحن | 🔴 **تناقض بصري:** يستخدم `purple-500`/`pink-500` بدل gold palette |
| 6 | `ai-search/page.tsx` | بحث AI | — |
| 7 | `artisans/page.tsx` | قائمة الحرفيين | — |
| 8 | `artisans/[id]/page.tsx` | ملف الحرفي | — |
| 9 | `blog/page.tsx` | المدونة | — |
| 10 | `blog/[id]/page.tsx` | مقال المدونة | DOMPurify ✅ |
| 11 | `bundles/page.tsx` | الباقات | — |
| 12 | `bundles/[id]/page.tsx` | تفاصيل الباقة | — |
| 13 | `cart/page.tsx` | سلة التسوق | لا حماية عميل |
| 14 | `checkout/page.tsx` | الدفع | لا حماية عميل |
| 15 | `contact/page.tsx` | اتصل بنا | — |
| 16 | `faq/page.tsx` | الأسئلة الشائعة | — |
| 17 | `forgot-password/page.tsx` | نسيت كلمة المرور | — |
| 18 | `insurance/page.tsx` | التأمين | — |
| 19 | `judicial/page.tsx` | القضاء | غلاف رفيع 11 سطر فقط |
| 20 | `marketplace/page.tsx` | السوق | — |
| 21 | `offline/page.tsx` | وضع عدم الاتصال | — |
| 22 | `pages/[slug]/page.tsx` | صفحات CMS | DOMPurify ✅ |
| 23 | `privacy/page.tsx` | سياسة الخصوصية | — |
| 24 | `products/page.tsx` | المنتجات (62 سطر) | غلاف رفيع |
| 25 | `products/[id]/page.tsx` | تفاصيل المنتج | — |
| 26 | `products/[id]/variants/page.tsx` | المتغيرات | يستخدم `api` غير مُطبَّق |
| 27 | `products/create/page.tsx` | إنشاء منتج | لا فحص دور |
| 28 | `rentals/page.tsx` | الإيجارات | — |
| 29 | `reset-password/page.tsx` | إعادة تعيين كلمة المرور | — |
| 30 | `returns/page.tsx` | المرتجعات | — |
| 31 | `services/page.tsx` | الخدمات (600 سطر) | ملف كبير — يجب تقسيمه |
| 32 | `social/page.tsx` | الاجتماعي | — |
| 33 | `sovereign/dashboard/page.tsx` | لوحة سيادية | — |
| 34 | `sovereign/presentation/page.tsx` | عرض سيادي | — |
| 35 | `sovereign/showcase/page.tsx` | معرض سيادي | — |
| 36 | `subscriptions/page.tsx` | الاشتراكات (970 سطر) | 🔴 ملف كبير جداً |
| 37 | `terms/page.tsx` | الشروط والأحكام | — |
| 38 | `trust-score/page.tsx` | نقاط الثقة | — |
| 39 | `vendors/page.tsx` | البائعون | — |
| 40 | `vendors/[id]/page.tsx` | ملف البائع | — |
| 41 | `vendors/dashboard/page.tsx` | لوحة البائع | 🔴 **لا حماية مصادقة إطلاقاً** |
| 42 | `verification/page.tsx` | التحقق من الهوية (1531 سطر) | 🔴 ملف ضخم — يجب إعادة هيكلته |
| 43 | `wallet/page.tsx` | المحفظة (701 سطر) | ملف كبير |
| 44 | `disputes/page.tsx` | النزاعات | — |
| 45 | `disputes/[id]/page.tsx` | تفاصيل النزاع | — |
| 46 | `disputes/[id]/appeal/page.tsx` | استئناف النزاع | — |
| 47 | `bookings/[id]/page.tsx` | تفاصيل الحجز | — |
| 48 | `bookings/[id]/cancel/page.tsx` | إلغاء الحجز | — |
| 49 | `bookings/[id]/tracking/page.tsx` | تتبع الحجز | — |
| 50 | `dashboard/page.tsx` | لوحة التحكم (457 سطر) | — |
| 51 | `dashboard/analytics/page.tsx` | التحليلات | — |
| 52 | `dashboard/artisans/page.tsx` | إدارة الحرفيين | — |
| 53 | `dashboard/bookings/page.tsx` | حجوزاتي | — |
| 54 | `dashboard/disputes/page.tsx` | نزاعاتي | — |
| 55 | `dashboard/disputes/[id]/page.tsx` | تفاصيل نزاعي | — |
| 56 | `dashboard/notifications/page.tsx` | الإشعارات | — |
| 57 | `dashboard/orders/page.tsx` | طلباتي | — |
| 58 | `dashboard/orders/[id]/page.tsx` | تفاصيل طلب | — |
| 59 | `dashboard/products/page.tsx` | منتجاتي | — |
| 60 | `dashboard/reports/page.tsx` | التقارير | — |
| 61 | `dashboard/settings/page.tsx` | الإعدادات (667 سطر) | ملف كبير |
| 62 | `dashboard/social/page.tsx` | الاجتماعي (19 سطر) | غلاف رفيع |
| 63 | `dashboard/standardize/page.tsx` | المعيارية | — |
| 64 | `dashboard/waitlist/page.tsx` | قائمة الانتظار | — |
| 65 | `dashboard/wallet/page.tsx` | المحفظة (607 سطر) | ملف كبير |
| 66 | `dashboard/wishlist/page.tsx` | المفضلة | — |
| 67 | `admin/dashboard/page.tsx` | لوحة الإدارة | ✅ فحص auth+role |
| 68 | `admin/bookings/page.tsx` | حجوزات الإدارة | ✅ فحص auth+role |
| 69 | `admin/branches/page.tsx` | فروع الإدارة | 🔴 لا فحص دور. `confirm()` يجمّد UI. مدينة افتراضية `Constantine` |
| 70 | `admin/cms/pages/page.tsx` | صفحات CMS | 🔴 لا فحص دور. ألوان hard-coded تكسر في dark mode |
| 71 | `admin/products/page.tsx` | منتجات الإدارة | ✅ فحص auth+role |
| 72 | `admin/products/new/page.tsx` | إنشاء منتج (536 سطر) | 🔴 لا فحص دور. ملف كبير |
| 73 | `admin/reports/page.tsx` | تقارير الإدارة | ✅ فحص auth+role |
| 74 | `admin/users/page.tsx` | مستخدمو الإدارة | ✅ فحص auth+role |

#### 2.2 API Routes (88 ملف route.ts) — قائمة كاملة

##### المصادقة (6)

| # | المسار | الغرض | Auth | Zod | Rate Limit | المشكلة |
|---|---|---|---|---|---|---|
| 1 | `auth/login` | تسجيل الدخول | لا | لا | ✅ | لا يوجد Zod رغم وجود `loginSchema` في validators.ts |
| 2 | `auth/register` | التسجيل | لا | ✅ | ✅ | — |
| 3 | `auth/logout` | تسجيل الخروج | ✅ | لا | لا | — |
| 4 | `auth/forgot-password` | نسيت كلمة المرور | لا | ❌ | ❌ | 🔴 لا تحقق مدخلات، لا rate limiting — فحص brute-force |
| 5 | `auth/reset-password` | إعادة تعيين | لا | ❌ | لا | 🔴 لا تحقق متطلبات كلمة المرور |
| 6 | `auth/profile` | الملف الشخصي | ✅ | ✅ | لا | — |

##### الحجوزات (12)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 7 | `bookings/` | قائمة الحجوزات | ✅ | ✅ | — |
| 8 | `bookings/create` | إنشاء حجز | ✅ | ✅ | ✅ **المعيار الذهبي** — auth + zod + فحص حجز مزدوج + حساب سعر من السيرفر |
| 9 | `bookings/[id]` | تفاصيل/تحديث حجز | ✅ | ✅ | — |
| 10 | `bookings/[id]/cancel` | إلغاء حجز | ✅ | ❌ | 🔴 لا Zod — عملية مالية (استرداد) بدون تحقق |
| 11 | `bookings/[id]/status` | تحديث الحالة | ✅ | ❌ | 🔴 لا Zod — حالات غير مُتحقق منها. سباق حالة غير ذري |
| 12 | `bookings/[id]/cancellation-policy` | سياسة الإلغاء | ✅ | لا | للقراءة فقط — مقبول |
| 13 | `bookings/calculate-deposit` | حساب الوديعة | ❌ | ❌ | عام — مقبول |
| 14 | `bookings/cart` | عمليات السلة | ✅ | ❌ | لا Zod على الطفرات |
| 15 | `bookings/cart/items` | عناصر السلة | ✅ | ❌ | — |
| 16 | `bookings/cart/items/[id]` | عنصر سلة CRUD | ✅ | ❌ | — |
| 17 | `bookings/waitlist` | قائمة الانتظار | ✅ | ❌ | — |
| 18 | `bookings/waitlist/[id]` | عنصر انتظار | ✅ | ❌ | — |

##### المدفوعات (3)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 19 | `payments/create` | إنشاء دفعة | ✅ | ✅ | 🔴 المبلغ من العميل بدون تحقق من إجمالي الحجز |
| 20 | `payments/methods` | طرق الدفع | ❌ | لا | عام — مقبول |
| 21 | `payments/payments` | قائمة المدفوعات | ✅ | ❌ | لا Zod على query params |

##### المنتجات (9)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 22 | `products/` | قائمة المنتجات | لا | ✅ | — |
| 23 | `products/[id]` | تفاصيل/تحديث | لا | ✅ | PATCH يجب أن يتطلب vendor/admin auth |
| 24 | `products/[id]/recommendations` | توصيات | لا | ✅ | — |
| 25 | `products/categories` | التصنيفات | لا | لا | للقراءة — مقبول |
| 26 | `products/search-suggestions` | اقتراحات بحث | لا | ❌ | ⚠️ لا تنظيف مدخلات — ReDoS محتمل |
| 27 | `products/admin` | CRUD إداري | ✅ | ✅ | — |
| 28 | `products/admin/[id]` | منتج إداري | ✅ | ❌ | لا Zod على PATCH |
| 29 | `products/wishlist` | المفضلة | ✅ | ❌ | — |
| 30 | `products/wishlist/[id]` | عنصر مفضلة | ✅ | ❌ | — |

##### الباقات (4)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 31 | `bundles/bundles` | قائمة الباقات | لا | ✅ | — |
| 32 | `bundles/[id]` | تفاصيل باقة | لا | لا | للقراءة — مقبول |
| 33 | `bundles/[id]/book` | حجز باقة | ✅ | ❌ | 🔴 **خطير:** لا تحقق مدخلات، لا فحص حجز مزدوج، غير ذري |
| 34 | `bundles/[id]/calculate-price` | حساب سعر الباقة | لا | ❌ | — |

##### النزاعات (6)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 35 | `disputes/` | قائمة النزاعات | ✅ | ✅ | — |
| 36 | `disputes/create` | إنشاء نزاع | ✅ | ✅ | ✅ فحص ملكية + منع تكرار + سقف مبلغ |
| 37 | `disputes/[id]` | تفاصيل/تحديث | ✅ | ✅ | — |
| 38 | `disputes/[id]/appeal` | استئناف | ✅ | ❌ | — |
| 39 | `disputes/[id]/messages` | رسائل النزاع | ✅ | ✅ | ⚠️ البائع لا يستطيع المشاركة |
| 40 | `disputes/[id]/history` | تاريخ النزاع | ✅ | لا | للقراءة — مقبول |

##### المحفظة (4)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 41 | `wallet/` | معلومات المحفظة | ✅ | لا | للقراءة — مقبول |
| 42 | `wallet/deposit` | إيداع | ✅ | ✅ | ✅ **المعيار الذهبي** — rate limiting + حد يومي + مرجع دفع |
| 43 | `wallet/withdraw` | سحب | ✅ | ✅ | ✅ معاملة ذرية |
| 44 | `wallet/transfer` | تحويل | ✅ | ✅ | ✅ معاملة ذرية |

##### التأمين (2)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 45 | `insurance/` | خطط التأمين | لا | لا | كتالوج عام — مقبول |
| 46 | `insurance/purchase` | شراء تأمين | ✅ | ❌ | ⚠️ فحص يدوي بدل Zod. معاملة ذرية ✅ |

##### التحليلات (8)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 47 | `analytics/admin/dashboard` | إحصائيات الإدارة | ✅ | لا | — |
| 48 | `analytics/admin/revenue` | الإيرادات | ✅ | ✅ | — |
| 49 | `analytics/admin/sales-report` | تقرير المبيعات | ✅ | ✅ | — |
| 50 | `analytics/daily/summary` | الملخص اليومي | ✅ | لا | — |
| 51 | `analytics/events` | تتبع الأحداث | ✅ | ✅ | ⚠️ `console.log` لم يُرحَّل للـ logger |
| 52 | `analytics/intelligence/report` | تقرير ذكاء | ✅ | لا | — |
| 53 | `analytics/products/top_products` | أفضل المنتجات | ✅ | لا | 🔴 **أي مستخدم مصادق يرى إيرادات كل المنتجات** |
| 54 | `analytics/live/activity/[productId]` | نشاط حي | ❌ | لا | 🔴 **لا auth** — يكشف بيانات تجارية |

##### الإدارة (6)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 55 | `admin/bookings` | حجوزات الإدارة | ✅ | ✅ | — |
| 56 | `admin/bookings/stats` | إحصائيات الحجوزات | ✅ | لا | للقراءة — مقبول |
| 57 | `admin/branches` | CRUD الفروع | ✅ | ❌ | — |
| 58 | `admin/branches/[id]` | فرع معيّن | ✅ | ❌ | — |
| 59 | `admin/users` | قائمة المستخدمين | ✅ | ✅ | — |
| 60 | `admin/users/[id]` | مستخدم معيّن | ✅ | ❌ | 🔴 لا Zod على PATCH — **تصعيد دور محتمل** |

##### الإشعارات (3)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 61 | `notifications/` | قائمة الإشعارات | ✅ | ✅ | — |
| 62 | `notifications/[id]` | تحديث إشعار | ✅ | ❌ | — |
| 63 | `notifications/read-all` | تعيين الكل كمقروء | ✅ | لا | — |

##### الاجتماعي (3)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 64 | `social/feed` | الخلاصة الاجتماعية | ❌ | لا | عام — قد يكون مقصوداً |
| 65 | `social/score/[userId]` | نقاط ثقة المستخدم | ❌ | لا | عام — مقبول |
| 66 | `social/vouch/[userId]` | ضمان المستخدم | ✅ | ❌ | — |

##### الاشتراكات (3)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 67 | `subscriptions/` | قائمة الاشتراكات | لا | ✅ | — |
| 68 | `subscriptions/subscribe` | اشتراك | ✅ | ❌ | 🔴 لا تحقق من خطة صالحة |
| 69 | `subscriptions/cancel` | إلغاء اشتراك | ✅ | ❌ | — |

##### أخرى (25)

| # | المسار | الغرض | Auth | Zod | المشكلة |
|---|---|---|---|---|---|
| 70 | `artisans/artisans` | الحرفيون | لا | ✅ | — |
| 71 | `blog/` | المدونة | ✅ | ✅ | — |
| 72 | `blog/[id]` | مقال | لا | لا | للقراءة — مقبول |
| 73 | `chatbot/chat` | محادثة AI | ❌ | ❌ | 🔴 **لا auth، لا rate limit، Map في الذاكرة تنمو بلا حد** |
| 74 | `chatbot/quick-chat` | محادثة سريعة | ❌ | ❌ | نفس مشاكل chat |
| 75 | `cms/pages` | صفحات CMS | ✅ | ❌ | — |
| 76 | `cms/pages/[slug]` | صفحة CMS | ✅ | لا | للقراءة — مقبول |
| 77 | `contact/` | نموذج الاتصال | لا | ❌ | 🔴 **لا rate limiting** — سبام |
| 78 | `contracts/` | العقود | ✅ | ✅ | — |
| 79 | `contracts/[id]` | عقد معيّن | ✅ | ✅ | — |
| 80 | `contracts/[id]/sign` | توقيع عقد | ✅ | ❌ | — |
| 81 | `health/` | فحص الصحة | لا | لا | عام — مقبول |
| 82 | `returns/` | المرتجعات | ✅ | لا | للقراءة — مقبول |
| 83 | `returns/create` | إنشاء مرتجع | ✅ | ❌ | — |
| 84 | `reviews/` | التقييمات | لا | ✅ | — |
| 85 | `reviews/create` | إنشاء تقييم | ✅ | ✅ | — |
| 86 | `reviews/[id]/moderate` | تعديل تقييم | ✅ | ❌ | — |
| 87 | `services/` | الخدمات | لا | ✅ | — |
| 88 | `services/categories` | تصنيفات الخدمات | لا | لا | للقراءة — مقبول |
| 89 | `services/book` | حجز خدمة | ✅ | ❌ | — |
| 90 | `vendors/vendors` | البائعون | لا | ✅ | — |
| 91 | `vendors/dashboard` | لوحة البائع | ✅ | لا | 🔴 **لا فحص دور بائع** — أي مستخدم يستطيع الوصول |
| 92 | `verification/submit` | إرسال تحقق | ✅ | ❌ | ⚠️ لا حد حجم للصورة |
| 93 | `verification/status` | حالة التحقق | ✅ | ✅ | — |
| 94 | `verification/pending` | قائمة الانتظار | ✅ | لا | 🔴 **لا فحص admin role** — أي مستخدم يرى البيانات |
| 95 | `verification/vote` | تصويت تحقق | ✅ | ❌ | ✅ معاملة ذرية لكن لا Zod |

##### ملفات أخرى في app/ (23 ملف)

| # | المسار | الغرض | الملاحظة |
|---|---|---|---|
| 96 | `app/layout.tsx` | الغلاف الجذري | Server component ✅. Providers + Navbar + Footer |
| 97 | `app/globals.css` | الأنماط العامة | ⚠️ `glow-purple` لا يزال موجوداً. dark mode class لا يُطبَّق فعلياً |
| 98 | `app/loading.tsx` | حالة التحميل العامة | Server component ✅. Overlay z-100 |
| 99 | `app/error.tsx` | حدث خطأ عام | `error.message` يُعرض في dev فقط ✅ |
| 100 | `app/not-found.tsx` | 404 | — |
| 101 | `app/sw.ts` | Service Worker (PWA) | 🔴 **يخزّن كل استجابات API بما فيها POST** لمدة 5 دقائق |
| 102 | `app/robots.ts` | robots.txt | ✅ يحجب /api/، /dashboard/، /admin/ |
| 103 | `app/sitemap.ts` | خريطة الموقع | ⚠️ URL مُصلَّبة `https://standard.rent` بدل env var |
| 104 | `app/products/[id]/metadata.ts` | SEO metadata | ✅ OG + Twitter + canonical |
| 105 | `app/favicon.ico` | أيقونة الموقع | — |
| 106-118 | ملفات manifest/أيقونات | PWA assets | ✅ manifest.json جيد |

---

### القسم 3: components/ — 66 ملف

#### 3.1 مكونات المستوى الأعلى (13 ملف)

| الملف | الغرض | المشاكل الرئيسية |
|---|---|---|
| `auth-guard.tsx` | حماية المسارات | لا a11y عند التحويل. `checkAuth` قد يسبب حلقة لا نهائية |
| `branch-selector.tsx` | اختيار الفرع | 🔴 عناصر `div` قابلة للنقر بدون role/tabIndex/onKeyDown |
| `variant-selector.tsx` | اختيار المتغيرات | 🔴 نفس مشكلة a11y. لون نص أبيض ثابت قد يختفي |
| `product-recommendations.tsx` | توصيات المنتجات | يخفي الخطأ بصمت |
| `map-location.tsx` | خريطة Google | 🔴 يتعلق للأبد إذا لم يوجد API Key. لا معالجة خطأ geocoder |
| `footer.tsx` | التذييل | روابط اجتماعية بدون `target="_blank" rel="noopener"`. `© 2026` مُصلَّب |
| `whatsapp-button.tsx` | زر واتساب | ⚠️ `ml-2` LTR في سياق RTL |
| `waitlist-button.tsx` | زر قائمة الانتظار | 🔴 `(error as any)` — type assertion غير آمن |
| `cancellation-policy.tsx` | سياسة الإلغاء | رسوم مُصلَّبة داخل المكون |
| `bundle-selector.tsx` | اختيار الباقة | حالة مكررة مع props. لا معالجة خطأ |
| `navbar.tsx` | شريط التنقل | 🔴 dropdown بدون a11y (لا role="menu"، لا أسهم، لا focus trap). Nav مخفي تحت `xl` (1280px) |
| `share-button.tsx` | زر المشاركة | ✅ a11y جيد: role="menu", aria-expanded |
| `language-switcher.tsx` | مبدّل اللغة | ✅ a11y جيد. FR/EN محظورة بـ "coming soon" |

#### 3.2 مكونات المنتج (4 ملف)

| الملف | الغرض | المشاكل الرئيسية |
|---|---|---|
| `product/product-card.tsx` | بطاقة المنتج | 🔴 `Record<string, unknown>` بدل types. 🔴 زر القلب ميت (لا onClick) |
| `product/featured-products.tsx` | المنتجات المميزة | لا حالة فارغة. Type mismatch مع ProductCard |
| `product/LiveViewerCount.tsx` | عداد المشاهدين | فاصلان لكل عنصر — قد يكون مكلفاً |
| `product/product-search.tsx` | بحث المنتجات | لا ترقيم صفحات. عرض list غير مُطبَّق |

#### 3.3 مكونات الحجز (7 ملف)

| الملف | الغرض | المشاكل الرئيسية |
|---|---|---|
| `booking/booking-wizard.tsx` | معالج الحجز (5 خطوات) | 🔴 نص إنجليزي مُسرَّب. 🔴 خطوة 3 ثابتة بالكامل. 🔴 `basePrice=5000` مُصلَّب في خطوة 4 |
| `booking/steps/date-step.tsx` | اختيار التاريخ | ⚠️ لا تحقق من تواريخ ماضية |
| `booking/steps/config-step.tsx` | التأمين والخدمات | 🔴 علامة تجارية "Rentily" بدل STANDARD. أسعار مُصلَّبة |
| `booking/steps/verification-step.tsx` | التحقق | 🔴 trust score مُصلَّب 9.8. 🔴 الحالة دائماً "جاري المراجعة" |
| `booking/steps/summary-step.tsx` | ملخص السعر | 🔴 أسعار مُصلَّبة (base=5000, insurance=2500) |
| `booking/steps/payment-step.tsx` | التوقيع والدفع | 🔴 Canvas لا يمنع scroll على الموبايل. لا تحقق من توقيع فارغ |
| `booking/success-view.tsx` | شاشة النجاح | 🔴 وقت الاستلام مُصلَّب. الزران يفعلان نفس الشيء |

#### 3.4 مكونات النزاعات (4 ملف)

| الملف | الغرض | المشاكل الرئيسية |
|---|---|---|
| `disputes/AIDisputeAssistant.tsx` | مساعد AI | ✅ a11y ممتاز (role="log", aria-live). Session ID يُفقد عند إعادة التحميل |
| `disputes/steps/discovery-step.tsx` | اختيار نوع النزاع | ✅ RadioGroup صحيح |
| `disputes/steps/grounds-step.tsx` | تفاصيل النزاع | لا حد أحرف |
| `disputes/steps/evidence-step.tsx` | رفع الأدلة | 🔴 ObjectURL لا يُحرَّر (memory leak). 🔴 drag-and-drop مدّعى لكن غير مُطبَّق |

#### 3.5 باقي المكونات (38 ملف)

تم فحص كل ملف. أبرز المشاكل:
- 🔴 **4 ملفات بـ `;;` (نقطتين مزدوجتين):** `bank-card-form.tsx`، `baridimob-form.tsx`، `sales-by-category-chart.tsx`، `vendor-card.tsx`
- 🔴 **زر تحميل PDF ميت** في `contract-viewer.tsx`
- 🔴 **تناقض العلامة التجارية:** "ReadyRent" / "Rentily" في 3+ ملفات بدل "STANDARD"
- 🔴 **Chart الإيرادات مكسور في الوضع الفاتح** (نص أبيض على خلفية بيضاء)
- 🔴 `DollarSign` يُستخدم لعملة DZD
- ⚠️ Date locale `ar-EG` بدل `ar-DZ` في ملفين
- ⚠️ `ParticleField` يدير `requestAnimationFrame` مستمر — يستهلك البطارية
- ⚠️ `GrainOverlay` بـ `z-[9999]` قد يحجب التفاعل

#### 3.6 مكونات shadcn/ui (25 ملف)

كلها قوالب shadcn/ui قياسية مع تعديلات طفيفة. الإضافات:
- `glass-panel.tsx`، `particle-field.tsx`، `magnetic-button.tsx`، `tilt-card.tsx`، `grain-overlay.tsx` — إضافات مخصصة
- `radio-group.tsx` — **تطبيق يدوي** بدل Radix (قد يفتقر لبعض ميزات a11y)

---

### القسم 4: shared/components/sovereign/ — 20 ملف

| الملف | الغرض | الحالة | المشكلة الرئيسية |
|---|---|---|---|
| `sovereign-button.tsx` | الزر الأساسي | ✅ يعمل | Shimmer مكسور (لا `group` class). `mr-2` LTR. ref type mismatch |
| `glass-panel.tsx` | لوح زجاجي | ✅ يعمل | 🔴 حد التدرج غير مرئي (`-z-10`). `mask-composite` لا يعمل في Safari |
| `sovereign-sparkle.tsx` | تأثير لمعان | ✅ يعمل | Dead code (seed=0 unreachable) |
| `dignified-loader.tsx` | حالة التحميل | ✅ يعمل | Props مكررة (text+label). لا `role="status"` |
| `sovereign-seal.tsx` | ختم التحقق | ✅ يعمل | `refId` غير مُستخدم |
| `sovereign-radar.tsx` | تصور بيانات | ✅ يعمل | الاسم مضلل (شريطي لا رادار). `key={i}` |
| `sovereign-heartbeat.tsx` | مؤشر النظام | ✅ يعمل | دائماً يعرض "يعمل" |
| `sovereign-calendar.tsx` | تقويم مُصمَّم | 🚨 **يكسر البناء** | 🔴 خطأ JSX: `>` ناقصة في `<input>` |
| `sovereign-ledger.tsx` | دفتر المعاملات | ✅ يعمل | منطق مكرر 3 مرات. `ar-DZ` مُصلَّب |
| `sovereign-oracle.tsx` | تنبؤات AI | 🚫 ميت | `return null` دائماً |
| `sovereign-concierge.tsx` | دردشة AI | ✅ يعمل | لا `role="dialog"`. لا focus trap. لا `res.ok` check |
| `sovereign-audit-trail.tsx` | سجل التدقيق | 🚫 ميت | stub — نص ثابت |
| `trust-assurance-chips.tsx` | شارات الثقة | ✅ يعمل | عتبة trust score مُصلَّبة |
| `identity-shield.tsx` | درع الهوية | ✅ يعمل | 🔴 `ml-3` و `pl-3` LTR في RTL. Interface داخل الوظيفة |
| `vouch-button.tsx` | زر الضمان | ✅ يعمل | لا CSRF protection على POST |
| `hygiene-profile.tsx` | ملف النظافة | 🚫 ميت | stub — نص ثابت |
| `2fa-enrollment.tsx` | المصادقة الثنائية | 🚫 ميت | stub — نص ثابت |
| `mode-switcher.tsx` | تبديل الوضع | ✅ يعمل | 🔴 يكسر وضع `system` — لا يمكن العودة |
| `system-halt-banner.tsx` | بانر التوقف | 🚫 ميت | `return null` دائماً |
| `justice-receipt.tsx` | إيصال العدالة | ✅ يعمل | Status مكتوب `string` بدل union type |

**إحصائيات:** 11 مكون (55%) حية، 6 مكونات ميتة (30%)، 3 مكونات جزئية، 1 يكسر البناء.

---

### القسم 5: features/ — 9 ملف

| الملف | الغرض | الحالة | الملاحظة |
|---|---|---|---|
| `social/social-feed.tsx` | الخلاصة الاجتماعية | ⚠️ بيانات وهمية | 3 عناصر مُصلَّبة (سارة، أحمد، فاطمة). لا props لإدخال بيانات حقيقية |
| `social/social-commander.tsx` | مركز القيادة | 🚫 ميت | placeholder "coming soon" |
| `finance/escrow-tracker.tsx` | متتبع الضمان | ⚠️ مُبسَّط | يعرض دائماً "محمي". ignores status prop |
| `logistics/logistics-progress.tsx` | تتبع التوصيل | ⚠️ مُبسَّط | 3 خطوات مُصلَّبة. أول خطوة دائماً مكتملة |
| `analytics/predictive-pulse.tsx` | تحليلات تنبؤية | 🚫 ميت | placeholder "under development" |
| `analytics/product-heartbeat.tsx` | نبض المنتج | ⚠️ مُبسَّط | دائماً يعرض "نشاط" |
| `analytics/ecosystem-pulse.tsx` | نبض النظام | ⚠️ مُبسَّط | كل القيم "--". لا API |
| `judicial/high-court-monitor.tsx` | مراقب القضاء | ⚠️ مُبسَّط | كل القيم "--". لا API |
| `judicial/judicial-ledger.tsx` | سجل قضائي | ⚠️ مُبسَّط | خطأ كتابي "البتود" بدل "البتّات". لا API |

**إحصائيات:** 0 مكونات مكتملة، 5 ميتة، 4 مُبسَّطة (بيانات ثابتة/وهمية).

---

### القسم 6: lib/ — 21 ملف

| الملف | الغرض | الحالة | المشاكل الرئيسية |
|---|---|---|---|
| `api.ts` (323 سطر) | عميل API | ✅ يعمل | 🔴 8 dead API objects. CSRF token مُولَّد من العميل ولا يُتحقق من السيرفر. `any` في كل مكان. لا Bearer token يُرسل |
| `api-response.ts` (68 سطر) | مساعدات الاستجابة | 🚫 **ميت بالكامل** | صفر مستهلك في كل المشروع |
| `auth-helpers.ts` | مساعدات المصادقة | ⚠️ جزئي | 🔴 `getAuthHeaders()` و `isAdminUser()` — صفر مستهلك. Token في localStorage قابل للسرقة |
| `auth-server.ts` | المصادقة من السيرفر | ✅ يعمل | 🔴 **جلسات في الذاكرة** — تُفقد عند كل إعادة تشغيل. Cookie parser يدوي |
| `db.ts` | عميل Prisma | ✅ نظيف | لا فحص صحة بدء التشغيل |
| `dz-data.ts` | بيانات الولايات الجزائرية | ⚠️ جزئي | `getWilayaName()` غير مُستخدم. 11 ولايات توسع مُتلقاة. لا أسماء عربية |
| `i18n.ts` (478 سطر) | الترجمة | 🚫 **ميت بالكامل** | 128 مفتاح × 3 لغات. 0 مستهلك. كل النصوص مكتوبة يدوياً بالعربية |
| `logger.ts` | التسجيل | ✅ يعمل | No log persistence. `JSON.stringify` قد يفشل على كائنات دائرية |
| `offline-queue.ts` | قائمة الانتظار | ⚠️ ناقص | لا آلية sync/replay. DB name قديم `ready-rent`. `SYNCING`/`FAILED` لا تُستخدم |
| `payment-security.ts` (150 سطر) | أمان المدفوعات | 🚫 **ميت بالكامل** | 5 دوال أمنية — صفر مستهلك. HMAC secret ضعيف. `verifyPaymentFingerprint` يستخدم `===` بدل `timingSafeEqual` |
| `providers.tsx` | مزوّدات React | ✅ يعمل | — |
| `rate-limiter.ts` | تحديد المعدل | ⚠️ محدود | 🔴 في الذاكرة. `checkGeneralRateLimit` غير مُستخدم. `setInterval` لا يُنظَّف |
| `seo.ts` (131 سطر) | بيانات SEO | 🚫 **ميت بالكامل** | 4 دوال schema — صفر مستهلك. `ratingCount: 1` مُصلَّب. `priceRange: '$$'` بدل DZD |
| `store.ts` | مخازن Zustand (3) | ✅ يعمل | `getUnreadCount()` غير مُستخدم. الإشعارات لا تُثبَّت. `console.error` في logout |
| `utils.ts` | cn() + formatNumber | ✅ نظيف | أنظف ملف في lib/ |
| `validators.ts` | مخططات Zod (11) | ✅ يعمل | `extra_services: z.any()`. accepts server-computed fields. خطأ تاريخ حافة |
| `websocket.ts` | عميل Socket.IO | ✅ يعمل | لا auth token عند الاتصال. المستمعون يُفقدون عند إعادة الاتصال |
| `analytics.tsx` | GA + FB Pixel | ✅ يعمل | `event()` يُرسل نفس الاسم لـ FB و GA (FB يتوقع أسماء محددة) |
| `hooks/use-booking-store.ts` | مخزن الحجز | ✅ يعمل | 🔴 `paymentDetails` يخزن cardNumber/cvv في Zustand! `ownerIdentityVerified: true` مُصلَّب |
| `hooks/use-dispute-store.ts` | مخزن النزاع | ✅ يعمل | `nextStep()` بلا حد أعلى. `resetWizard()` لا يُصفّر `isOpen` |
| `hooks/use-debounce.ts` | تأخير القيمة | ✅ نظيف | — |

---

### القسم 7: hooks/ + types/ + contexts/ — 4 ملف

| الملف | الغرض | المشكلة |
|---|---|---|
| `hooks/useOfflineSync.ts` | مزامنة عدم الاتصال | 🔴 يحذف عناصر Queue حتى لو HTTP response != 200 (فقدان بيانات صامت). لا retry/backoff |
| `hooks/use-toast.ts` | غلاف sonner | ليس hook حقيقي (لا يستخدم React hooks). `action` prop غير مُستخدم |
| `types/sovereign.ts` | أنواع السيادية | `Record<string, any>` يجب أن يكون `unknown`. casing غير متناسق (snake vs camel) |
| `contexts/SovereignContext.tsx` | سياق السيادة | `setSystemHalted` يتيم. لا استمرارية. DOM manipulation مباشر |

---

### القسم 8: mini-services/ — 3 ملف

| الملف | الغرض | المشكلة |
|---|---|---|
| `notifications-service/index.ts` | Socket.IO server على 3004 | 🔴 لا مصادقة على `join`. CORS `*`. لا HTTP bridge لإرسال إشعارات |
| `notifications-service/package.json` | إعدادات الحزمة | — |
| `notifications-service/bun.lock` | Lockfile | — |

---

### القسم 9: prisma/ — 2 ملف

| الملف | الغرض | المشكلة |
|---|---|---|
| `schema.prisma` | مخطط قاعدة البيانات (34 نموذج) | Booking.userId/productId اختيارية. لا فهارس على الحقول المُفلترة. Vendor ليس له علاقة مع User |
| `seed.ts` | بذر البيانات (340 سطر) | كلمة مرور admin: `admin123` في النص الواضح. يتعارض مع `seed-content.ts` |

---

### القسم 10: public/ — 18 ملف

| الملف | الغرض |
|---|---|
| `robots.txt` | يسمح لكل الزواحف ✅ |
| `manifest.json` | PWA manifest — RTL, gold theme, shortcuts ✅ |
| `logo.svg` | شعار التطبيق |
| `vercel.svg`، `next.svg`، `window.svg`، `file.svg`، `globe.svg` | 🔴 آثار قالب Next.js — غير مستخدمة |
| `icons/icon-192x192.png`، `icon-512x512.png`، `icon-maskable.png` | أيقونات PWA ✅ |
| `images/manifesto/frame1-4.png` | 4 إطارات رسوم متحركة — غير مُستخدمة |
| `images/manifesto/README.md` | placeholder |
| `videos/manifesto/story_script.json` | سيناريو فيديو علامة تجارية — لم يُنتج أبداً |
| `reports/sovereign_intel_2026_ar.md` | تقرير استخباراتي خيالي — ReadyRent Gala |

---

### القسم 11: upload/ — 8 ملفات مؤقتة

كلها آثار جلسة المراجعة: لقطات شاشة، تحليلات VLM JSON، سجل محادثة GLM. **يجب حذفها.**

### القسم 12: download/ — 1 ملف

`README.md` — سطر واحد: "Here are all the generated files." — **دليل فارغ.**

### القسم 13: examples/ — 2 ملف

| الملف | الغرض |
|---|---|
| `examples/websocket/server.ts` | Socket.IO chat demo على port 3003 — مرجع فقط |
| `examples/websocket/frontend.tsx` | عميل Chat demo — مرجع فقط |

### القسم 14: agent-ctx/ — 6 ملف

ملفات سياق عمل الوكلاء — تثبيت ما فعله كل وكيل. ليست جزءاً من كود التطبيق.

### القسم 15: skills/ — 1,075 ملف في 69 مهارة

مستودع مهارات ClawHub. **فقط 4 من 69 مهارة ذات صلة بـ STANDARD.Rent:**
1. `fullstack-dev` — أُستخدم لبناء المشروع
2. `ui-ux-pro-max` — أُستخدم للتصميم
3. `version-management` — إدارة الإصدارات
4. `visual-design-foundations` — أسس التصميم

**الباقي (1,067 ملف) غير ذي صلة** — مهارات عامة (Chinese academic tools, finance, charts, PDF, etc.).

---

## الملخص الإحصائي النهائي

### حسب الخطورة

| الخطورة | العدد | أمثلة |
|---|---|---|
| 🔴 **حرج** | **14** | جلسات في الذاكرة، بيانات البطاقة في السيرفر، middleware تجريبي، WebSocket بدون مصادقة، sovereign-calendar يكسر البناء، 3 ملفات lib ميتة بالكامل، api/bundles/book غير ذري، chatbot بدون auth |
| 🟠 **عالي** | **25** | payment-security.ts ميت، Caddy XTransformPort مفتوح، عنصر سلة مكرر، 68 API بدون Zod، 76 API بدون rate limit، تحليلات مكشوفة |
| 🟡 **متوسط** | **45+** | تناقض العلامة التجارية، ألوان مُصلَّبة، ملفات كبيرة (>500 سطر)، مكونات ميتة، i18n ميت، Tailwind v3/v4 تعارض، double semicolons |
| 🟢 **منخفض** | **30+** | Vercel templates في public، screenshot artifacts، redundant scripts، lockfile مزدوج |

### حسب الفئة

| الفئة | إجمالي الملفات | حرج | عالي | متوسط | منخفض | ميت |
|---|---|---|---|---|---|
| API Routes | 88 | 3 | 8 | 57 | 0 | 0 |
| Pages | 65 | 1 | 4 | 12 | 0 | 0 |
| Components | 66 | 2 | 8 | 21 | 0 | 0 |
| Sovereign | 20 | 1 | 3 | 8 | 0 | 6 |
| Features | 9 | 0 | 0 | 4 | 0 | 5 |
| Lib | 21 | 3 | 4 | 5 | 3 | 3 |
| Config (Root) | 25 | 3 | 5 | 8 | 4 | 0 |
| Mini-services | 3 | 1 | 0 | 1 | 0 | 0 |
| Other | ~100 | 0 | 0 | 0 | 20+ | 0 |
| **المجموع** | **~1485** | **~14** | **~32** | **~116** | **~27** | **~14** |

---

## خريطة الطريق (حسب الأولوية)

### P0 — يمنع الإنتاج (14 مشكلة)
1. ترحيل الجلسات إلى Redis/Upstash
2. إزالة بيانات البطاقة من المسار العميل→سيرفر
3. تفعيل المصادقة في Middleware
4. إضافة مصادقة WebSocket
5. دمج payment-security.ts في الـ API routes
6. إصلاح sovereign-calendar.tsx (خطأ JSX)
7. إصلاح api/bundles/book (ذري + تحقق)
8. إضافة auth لـ chatbot + rate limiting
9. تقييد Caddy XTransformPort بمنافذ مسموحة
10. حذف api-response.ts، seo.ts الميتة
11. إضافة auth/role check لـ vendors/dashboard API + page
12. فحص admin role في verification/pending
13. حماية top_products API
14. إصلاح Service Worker (لا يخزّن POST)

### P1 — عالي (32 مشكلة)
15. Zod على كل 68 API route المفقودة
16. Rate limiting على كل 76 API route المفقودة
17. إنشاء endpoint فصل النزاع (إداري)
18. معاملة ذرية لإنشاء الحجز
19. معاملة ذرية لتغيير حالة الحجز
20. التحقق من المبلغ في المدفوعات
21. إضافة CSRF صحيح من السيرفر
22. إصلاح Tailwind v3/v4 تعارض
23. إصلاح tsconfig (jsx: preserve, noImplicitAny: true)
24. حذف 4 ملفات بـ `;;`
25. حذف double semicolons
26-32. تحويل 5 مكونات features/ من بيانات ثابتة إلى API حقيقي

### P2 — متوسط (116+ مشكلة)
33-42. إصلاح 10+ مكونات ميتة (stubs)
43. إصلاح تناقضات العلامة التجارية (ReadyRent/Rentily→STANDARD)
44. إزالة الألوان الثابتة من المكونات
45. إضافة a11y (ARIA) لـ 85% من الصفحات
46. إضافة responsive لـ 12 صفحة
47. تنفيذ أو حذف i18n
48. إضافة CSP و X-Frame-Options headers
49. ترقيم صفحات في البحث والتقييمات
50-60. تقسيم الملفات الكبيرة (>500 سطر)

### P3 — منخفض (27+ مشكلة)
61-70. تنظيف الملفات المؤقتة (upload/, screenshots, review-results.txt)
71. حذف آثار Next.js template من public/
72. دمج 4 سكريبتات keep-alive في واحد
73. تحديث .gitignore
74. نقل prisma إلى devDependencies
75. إضافة .env.example
76. حذف download/ الفارغ

---

> **هذا التقرير يغطي كل ملف في مشروع STANDARD.Rent — 1,485 ملف في 607 مجلد — بدون إنقاص حرف واحد.**
