# STANDARD.Rent — خطة الجاهزية للإنتاج (Production Readiness Plan)
## من الصفر إلى الإطلاق الحقيقي

> **الإصدار**: 1.0 | **التاريخ**: يوليو 2025 | **النطاق**: 73 صفحة، 95 API، 34 نموذج بيانات
> **المرجعية**: تقرير التدقيق الشامل + MASTERPLAN.md + PRODUCTION-MIGRATION.md + worklog.md

---

## فلسفة الخطة

> **STANDARD.Rent لا يُسوَّق كمنصة تأجير عادية — بل كنظام ثقة رقمي شامل يُعيد تعريف العلاقة بين المؤجر والمستأجر في الجزائر.**

كل عنصر في هذه الخطة يخدم هدفًا واحدًا: **جعل المعاملة الآمنة والشفافة هي المعيار الأساسي في السوق الجزائري.**

---

## الوضع الحالي — لقطة شاملة

### ما تم إنجازه (الأساس الحالي)

| البُعد | الحالة | التفاصيل |
|---|---|---|
| **الإطار التقني** | ✅ مستقر | Next.js 16.3.3 + TypeScript 5 + Tailwind v4 + Prisma ORM |
| **التصميم** | ✅ مكتمل | نظام Sovereign (ذهبي/أسود/أبيض)، دعم RTL عربي، Dark/Light mode |
| **قاعدة البيانات** | ✅ مُهيكَلة | 34 نموذج Prisma، SQLite للتنمية، جاهز للتبديل لـ PostgreSQL |
| **الصفحات** | ⚠️ 73 صفحة مبنيّة | بعضها يحتاج ربط API فعلي |
| **الـ API** | ⚠️ ~95 route | بعضها stub/هيكلي، يحتاج منطق حقيقي |
| **المصادقة** | ⚠️ جزئي | تسجيل/دخول يعمل، OAuth/هاتف هيكلي فقط |
| **الثقة** | ⚠️ أساس | نموذج الثقة موجود، KYC بهيكل VLM، يحتاج تكامل حقيقي |
| **الدفع** | ⚠️ هيكلي | CIB/Edahabia + Stripe stubs، لا يوجد تكامل حقيقي |
| **الإيميل** | ⚠️ جاهز | Resend مُعدّ، يحتاج API key حقيقي |
| **الرفع** | ⚠️ جاهز | Cloudinary مُعدّ، يحتاج API keys حقيقية |
| **PWA** | ✅ مكتمل | Serwist + manifest + service worker |
| **Docker** | ✅ مكتمل | Dockerfile + docker-compose متعدد المراحل |
| **CI/CD** | ⚠️ أساسي | GitHub Actions (lint + build)، يحتاج CD |
| **SEO** | ✅ SSR | الصفحة الرئيسية SSR، sitemap، robots.txt |
| **Lint** | ✅ نظيف | 0 أخطاء، 25 تحذير متعمد |

### ما لا يعمل بعد (Critical Gaps)

1. **لا يوجد دفعة حقيقية** — كل أشكال الدفع هي واجهات فارغة
2. **لا يوجد KYC حقيقي** — التحقق بالذكاء الاصطناعي يستخدم VLM لكنه لم يُختبر في بيئة حقيقية
3. **لا يوجد نظام إشعارات حقيقي** — WebSocket notification service موجود لكنه stub
4. **بعض مسارات API مزدوجة/خاطئة** — كما موثق في MASTERPLAN.md (المهمة 1.1-1.6)
5. **لا يوجد GDPR/قانون حماية البيانات** — لا سياسة خصوصية فعالة، لا موافقات صريحة
6. **لا يوجد اختبارات** — 0 test case مكتوب
7. **الأمان يحتاج تقوية** — CSRF, rate limiting محدود، no WAF

---

## هيكل الخطة — المراحل الست

```
المرحلة 0: التأسيس القانوني والتسجيل (أسبوع 1-2)
    ↓
المرحلة 1: الإصلاحات الحرجة والبنية التحتية (أسبوع 3-6)
    ↓
المرحلة 2: نظام الثقة والأمان (أسبوع 7-12)
    ↓
المرحلة 3: التكاملات الخارجية الحقيقية (أسبوع 13-16)
    ↓
المرحلة 4: الاختبار الشامل والتدقيق (أسبوع 17-20)
    ↓
المرحلة 5: الإطلاق والمراقبة المستمرة (أسبوع 21+)
```

---

## تفصيل المراحل

### المرحلة 0: التأسيس القانوني (قبل أي تطوير إنتاجي)
📄 **الملف**: `01-LEGAL-COMPLIANCE.md`

- تسجيل الشركة (SARL أو EURL) في السجل التجاري الجزائري
- الحصول على رقم الضرائب (NIF) والرقم الإحصائي (NIS)
- تسجيل اسم النطاق `.dz` من NIC.DZ أو `.com.dz`
- فتح حساب بنكي احترافي (CCP أو حساب بنكي تجاري)
- التسجيل كمتداول إلكتروني وفقًا للقانون 18-05
- إعداد شروط الاستخدام وسياسة الخصوصية بالعربية والفرنسية
- التشاور مع محامٍ مختص في القانون الرقمي الجزائري

---

### المرحلة 1: الإصلاحات الحرجة والبنية التحتية
📄 **الملف**: `02-INFRASTRUCTURE-DEPLOYMENT.md`

**الهدف**: جعل كل المسارات المكسورة تعمل والبنية التحتية جاهزة

1. **إصلاح مسارات API المزدوجة** (MASTERPLAN 1.1-1.6)
   - disputes, contracts, bundles, bookings, cart, returns
2. **الخادم والإستضافة**
   - اختيار مزود: Hetzner/OVH (أوروبا) أو DataClub (الجزائر)
   - إعداد PostgreSQL بدل SQLite
   - إعداد Redis للـ cache
   - إعداد Nginx كـ reverse proxy + SSL (Let's Encrypt)
   - إعداد CDN (Cloudflare أو BunnyCDN)
3. **إصلاح الـ WebSocket notifications**
   - تكامل notifications-service مع قاعدة البيانات الحقيقية
   - إزالة ثقة الـ userId من العميل
4. **إصلاح PCI-DSS في bank-card-form.tsx**
   - لا يتم إرسال رقم البطاقة للخادم الخلفي أبدًا
   - استخدام Stripe Elements أو CIB hosted checkout

---

### المرحلة 2: نظام الثقة والأمان
📄 **الملف**: `03-TRUST-SAFETY-SYSTEM.md`

**الهدف**: بناء نظام الثقة الشامل الذي يميز STANDARD.Rent

1. **نظام الثقة (Trust Score)**
   - خوارزمية احتساب الدرجات (التحقق، التقييمات، السجل، النزاعات)
   - عرض الثقة على كل ملف تعريفي (vendor, artisan, user)
2. **KYC/KYB (التوثيق)**
   - تكامل VLM حقيقي لفحص الوجه
   - نظام التصويت المجتمعي (5 أصوات موافقة)
   - فحص السجل القضائي (integration with judicial database when available)
3. **نظام النزاعات مع الاستئناف**
   - تدفق كامل: تقديم ← مراجعة ← وساطة ← استئناف ← حل
   - تكامل AI للتحليل الأولي للنزاعات
4. **العقود الرقمية**
   - إنشاء تلقائي عند تأكيد الحجز
   - توقيع إلكتروني مع تجزئة (hash) للعقد
5. **نظام الضمان (Escrow)**
   - حجز المبلغ عند الدفع
   - إطلاق المبلغ عند التأكيد
   - إرجاع المبلغ عند النزاع/الإلغاء

---

### المرحلة 3: التكاملات الخارجية الحقيقية
📄 **الملف**: `04-PAYMENT-LEGAL-ALGERIA.md`

**الهدف**: كل تكامل خارجي يعمل فعلاً

1. **CIB/Edahabia**
   - التسجيل كبائع لدى SATIM أو مزود الدفع
   - تكامل الـ API الحقيقي
   - اختبار SandBox ثم Production
2. **Stripe (للدولي/بطاقات Visa)**
   - تكامل Stripe Checkout Sessions
   - Webhook handling حقيقي مع HMAC verification
3. **SMS Provider**
   - اختيار مزود (Twilio, Vonage, أو مزود محلي جزائري)
   - تكامل إرسال/تحقق رمز OTP
4. **Google OAuth**
   - تكامل Google Sign-In
   - ربط بحساب STANDARD.Rent الموجود
5. **Resend (البريد الإلكتروني)**
   - تفعيل API key حقيقي
   - إعداد domain verification (SPF, DKIM, DMARC)
6. **Cloudinary**
   - تفعيل API keys حقيقية
   - إعداد transformations للصور

---

### المرحلة 4: الاختبار الشامل والتدقيق
📄 **الملف**: `05-TESTING-QA-PLAN.md`

**الهدف**: 0 عيوب حرجة عند الإطلاق

1. **اختبارات الوحدة (Unit Tests)**
   - كل lib function (`auth-server.ts`, `payment-provider.ts`, `rate-limiter.ts`, etc.)
   - كل utility function
2. **اختبارات التكامل (Integration Tests)**
   - كل API route (95 route)
   - تسلسلات العمل الحرجة (تسجيل ← تصفح ← حجز ← دفع ← مراجعة)
3. **اختبارات E2E (End-to-End)**
   - Playwright: 10 مسارات مستخدم أساسية
   - اختبار كل صفحة من الـ 73 صفحة
4. **اختبار الأمان (Security Testing)**
   - OWASP Top 10
   - Penetration testing أساسي
   - اختبار Rate Limiting
5. **اختبار الأداء (Performance)**
   - Lighthouse: 90+ في كل الفئات
   - اختبار التحميل (k6 أو Artillery)
6. **اختبار التوافق**
   - Mobile: Chrome Android, Safari iOS
   - Desktop: Chrome, Firefox, Edge
   - RTL rendering check

---

### المرحلة 5: الإطلاق والمراقبة
📄 **الملف**: `06-GO-LIVE-CHECKLIST.md`
📄 **الملف**: `07-POST-LAUNCH-MONITORING.md`

**الهدف**: إطلاق سلس ومراقبة مستمرة

1. **قائمة الإطلاق النهائية** (200+ نقطة تحقق)
2. **المراقبة**
   - Uptime monitoring (UptimeRobot أو BetterStack)
   - Error tracking (Sentry)
   - Analytics (GA4 + Plausible)
   - Log aggregation (Axiom أو Logtail)
3. **النسخ الاحتياطي**
   - Daily DB backups (pg_dump)
   - Cloudinary image backups
   - Git backups
4. **خطة الاستجابة للأحداث**
   - ماذا تفعل عند انهيار الخادم
   - ماذا تفعل عند تسريب بيانات
   - ماذا تفعل عند نزاع كبير

---

## مؤشرات الأداء الرئيسية (KPIs) للإطلاق

| المؤشر | الهدف | طريقة القياس |
|---|---|---|
| وقت التحميل (LCP) | < 2.5s | Lighthouse + Web Vitals |
| وقت الاستجابة API (P95) | < 500ms | APM tool |
| وقت التشغيل (Uptime) | 99.9% | Uptime monitor |
| أمان (CVEs) | 0 high/critical | `npm audit` + Snyk |
| Lint errors | 0 | `bun run lint` |
| Test coverage | > 70% | Jest/Vitest reports |
| Lighthouse score | > 90 كل فئة | Lighthouse CI |
| Mobile score | > 85 | Lighthouse Mobile |

---

## مخطط الصفحات الـ 73 — توزيع على المراحل

### المرحلة 1 (حرجة — يجب تعمل قبل الإطلاق)
- `/` الصفحة الرئيسية — ✅ SSR يعمل
- `/login`, `/register`, `/forgot-password`, `/reset-password` — ⚠️ بحاجة لإصلاح OAuth/Phone
- `/products`, `/products/[id]`, `/products/create` — ⚠️ بحاجة لإصلاح API paths
- `/cart`, `/checkout` — ⚠️ بحاجة لإصلاح الدفع
- `/bookings/[id]`, `/bookings/[id]/cancel`, `/bookings/[id]/tracking` — ⚠️ بحاجة لإصلاح API

### المرحلة 2 (نظام الثقة)
- `/verification` — ⚠️ بحاجة لتكامل VLM حقيقي
- `/trust-score` — ⚠️ بحاجة لخوارزمية احتساب
- `/disputes`, `/disputes/[id]`, `/disputes/[id]/appeal` — ⚠️ بحاجة لإصلاح API paths
- `/contracts/[id]` — ⚠️ بحاجة لإنشاء تلقائي
- `/returns` — ⚠️ بحاجة لإصلاح API paths
- `/insurance` — ⚠️ بحاجة لتكامل حقيقي

### المرحلة 3 (التكاملات)
- `/wallet`, `/dashboard/wallet` — ⚠️ بحاجة لتكامل CIB/Edahabia
- `/services` — ⚠️ بحاجة لربط API حقيقي
- `/vendors`, `/vendors/[id]`, `/vendors/dashboard` — ⚠️ بحاجة لربط API
- `/subscriptions` — ⚠️ بحاجة لتكامل دفع متكرر

### المرحلة 4 (اختبار)
- كل لوحة التحكم: `/dashboard/*` (14 صفحة)
- كل لوحة الإدارة: `/admin/*` (16 صفحة)
- الصفحات الثانوية: `/about`, `/faq`, `/blog`, `/contact`, `/terms`, `/privacy`

---

## فهرس الوثائق

| # | الملف | المحتوى |
|---|---|---|
| 00 | `00-MASTER-PLAN.md` | هذا الملف — النظرة الشاملة |
| 01 | `01-LEGAL-COMPLIANCE.md` | الامتثال القانوني والتسجيل في الجزائر |
| 02 | `02-INFRASTRUCTURE-DEPLOYMENT.md` | البنية التحتية والنشر |
| 03 | `03-TRUST-SAFETY-SYSTEM.md` | نظام الثقة والأمان الشامل |
| 04 | `04-PAYMENT-LEGAL-ALGERIA.md` | الدفع والامتثال المالي في الجزائر |
| 05 | `05-TESTING-QA-PLAN.md` | خطة الاختبار الشامل |
| 06 | `06-GO-LIVE-CHECKLIST.md` | قائمة الإطلاق النهائية |
| 07 | `07-POST-LAUNCH-MONITORING.md` | المراقبة بعد الإطلاق |
| 08 | `08-FEATURES-AUDIT.md` | تدقيق كل ميزة من الـ 73 صفحة |
| 09 | `09-SECURITY-HARDENING.md` | تقوية الأمان |
| 10 | `10-TECHNICAL-DEBT.md` | الديون التقنية وتحديد الأولويات |

---

> **ملاحظة مهمة**: هذه الخطة حيّة (living document) — تُحدَّث مع كل تقدم في التنفيذ.
> **المرجع**: كل قرار مبني على التحليل الفعلي للكود المصدري في المشروع، وليس على تخمينات.
