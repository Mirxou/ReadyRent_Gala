# المرحلة 5 — قائمة الإطلاق النهائي (Go-Live Checklist)
## STANDARD.Rent — Production Readiness Plan

> **استخدم هذا الملف كمرجع نهائي قبل الإطلاق.**
> **كل نقطة يجب أن تكون ✅ قبل تفعيل المنصة للجمهور.**

---

## 1. البنية التحتية 🔧

```
[ ] 1.1 الخادم مُهيأ (Ubuntu 22.04 + Docker + Nginx)
[ ] 1.2 PostgreSQL يعمل ومُحسَّن (indexes + connection pool)
[ ] 1.3 Redis يعمل (cache + rate limiting)
[ ] 1.4 SSL certificate نشط (Let's Encrypt, expires > 90 days)
[ ] 1.5 Cloudflare DNS مُهيأ + caching + WAF
[ ] 1.6 Nginx reverse proxy يعمل + security headers
[ ] 1.7 Docker containers تعمل (app + notifications + postgres + redis)
[ ] 1.8 Nginx يحول HTTP → HTTPS
[ ] 1.9 Domain resolution يعمل (standardrent.dz → server IP)
[ ] 1.10 Health check endpoint يعمل (/api/health)
[ ] 1.11 Server timezone: Africa/Algiers
[ ] 1.12 Automatic restart على crash (Docker restart policy)
[ ] 1.13 Log rotation مُهيأ
[ ] 1.14 Firewall (UFW) مُفعَّل (SSH + HTTP + HTTPS فقط)
[ ] 1.15 Fail2Ban يعمل
[ ] 1.16 SSH key-only authentication (لا كلمات مرور)
[ ] 1.17 Root login معطَّل
```

---

## 2. قاعدة البيانات 🗄️

```
[ ] 2.1 PostgreSQL (ليس SQLite) في البيئة الإنتاجية
[ ] 2.2 Migrations مُطبَّقة (prisma migrate status = up to date)
[ ] 2.3 Prisma Client مُولَّد (prisma generate)
[ ] 2.4 Connection pool مُهيأ (max 10 connections)
[ ] 2.5 Database backups يومية مُهيأة (cron + pg_dump)
[ ] 2.6 تم اختبار استعادة النسخة الاحتياطية
[ ] 2.7 Indexes مُضافة للبحث الشائع
[ ] 2.8 Seed data مُزال من الإنتاج (no test data)
[ ] 2.9 Environment variables لا تحتوي على قيم افتراضية ضعيفة
```

---

## 3. الأمان 🔒

```
[ ] 3.1 npm audit: 0 vulnerabilities (high/critical)
[ ] 3.2 لا توجد .env في الكود (في .gitignore)
[ ] 3.3 لا توجد secrets hard-coded في الكود
[ ] 3.4 كل API routes محمية بـ auth guard (حيث مطلوب)
[ ] 3.5 Rate limiting يعمل على auth endpoints
[ ] 3.6 CORS مُقيَّد على النطاق الخاص فقط
[ ] 3.7 Security headers مُهيأة (HSTS, X-Frame-Options, CSP)
[ ] 3.8 Session tokens ذات entropy عالية
[ ] 3.9 Passwords مشفرة بـ bcrypt (rounds >= 12)
[ ] 3.10 Payment webhook يتطلب HMAC verification
[ ] 3.11 لا يتم تخزين بيانات البطاقات (PCI-DSS compliant)
[ ] 3.12 File upload: type validation + size limit + auth
[ ] 3.13 SQL injection محمي (Prisma parameterized queries)
[ ] 3.14 XSS محمي (React auto-escaping + CSP headers)
[ ] 3.15 CSRF محمي (SameSite cookies)
[ ] 3.16 IDOR محمي (user can only access own resources)
```

---

## 4. المصادقة والتسجيل 👤

```
[ ] 4.1 التسجيل بالبريد الإلكتروني يعمل
[ ] 4.2 تسجيل الدخول يعمل
[ ] 4.3 تسجيل الخروج يعمل (يُبطل الجلسة)
[ ] 4.4 إعادة تعيين كلمة المرور يعمل
[ ] 4.5 البريد الإلكتروني يُرسل فعليًا (Resend API key حقيقي)
[ ] 4.6 Session tokens تُخزَّن في DB (ليس في-memory)
[ ] 4.7 Sessions المنتهية تُحذف تلقائيًا
[ ] 4.8 Auth guards تعمل على كل صفحة محمية
[ ] 4.9 الرسائل خطأ双语 (عربي + إنجليزي)
[ ] 4.10 2FA يمكن تفعيله (حتى لو اختياري)
```

---

## 5. الصفحات الأساسية (الـ 73 صفحة) 📄

### 5.1 الصفحات العامة (Public)
```
[ ] 5.1.1 / (الرئيسية) — SSR يعمل، بيانات حقيقية، RTL
[ ] 5.1.2 /login — يعمل، يُحوَّل لـ / بعد الدخول
[ ] 5.1.3 /register — يعمل، يُنشئ حساب حقيقي
[ ] 5.1.4 /forgot-password — يعمل، يُرسل بريد حقيقي
[ ] 5.1.5 /reset-password — يعمل مع token صالح
[ ] 5.1.6 /products — يعرض منتجات من DB، فلاتر تعمل
[ ] 5.1.7 /products/[id] — يعرض تفاصيل المنتج، صور، تقييمات
[ ] 5.1.8 /products/create — يعمل (للموردين)
[ ] 5.1.9 /products/[id]/variants — يعمل
[ ] 5.1.10 /cart — يعرض سلة حقيقية من DB
[ ] 5.1.11 /checkout — يعمل مع طريقة دفع حقيقية
[ ] 5.1.12 /bookings/[id] — يعرض حالة الحجز الحقيقية
[ ] 5.1.13 /bookings/[id]/cancel — يعمل
[ ] 5.1.14 /bookings/[id]/tracking — يعرض حالة التتبع
[ ] 5.1.15 /services — يعرض خدمات فعلية
[ ] 5.1.16 /bundles — يعرض حزم فعلية
[ ] 5.1.17 /bundles/[id] — يعرض تفاصيل الحزمة
[ ] 5.1.18 /vendors — يعرض موردين فعليين
[ ] 5.1.19 /vendors/[id] — يعرض ملف المورد
[ ] 5.1.20 /artisans — يعرض حرفيين
[ ] 5.1.21 /artisans/[id] — يعرض ملف الحرفي
[ ] 5.1.22 /blog — يعرض مقالات حقيقية
[ ] 5.1.23 /blog/[id] — يعرض مقال كامل
[ ] 5.1.24 /about — المحتوى محدث
[ ] 5.1.25 /contact — نموذج الاتصال يعمل
[ ] 5.1.26 /faq — محتوى محدث
[ ] 5.1.27 /terms — محتوى قانوني مُراجَع
[ ] 5.1.28 /privacy — محتوى قانوني مُراجَع
[ ] 5.1.29 /marketplace — يعمل
[ ] 5.1.30 /rentals — يعمل
[ ] 5.1.31 /ai-search — يعمل (إذا VLM مُفعَّل)
[ ] 5.1.32 /offline — صفحة عدم الاتصال تعمل
[ ] 5.1.33 /judicial — صفحة السجل القضائي
[ ] 5.1.34 /trust-score — يعرض درجة الثقة
[ ] 5.1.35 /social — صفحة التصويت المجتمعي
```

### 5.2 صفحات المستخدم المحمية
```
[ ] 5.2.1 /dashboard — يعمل مع بيانات حقيقية
[ ] 5.2.2 /dashboard/bookings — يعرض حجوزات المستخدم
[ ] 5.2.3 /dashboard/orders — يعرض الطلبات
[ ] 5.2.4 /dashboard/orders/[id] — تفاصيل الطلب
[ ] 5.2.5 /dashboard/wishlist — يعرض المفضلة
[ ] 5.2.6 /dashboard/notifications — يعرض الإشعارات
[ ] 5.2.7 /dashboard/products — (للموردين)
[ ] 5.2.8 /dashboard/analytics — (للموردين)
[ ] 5.2.9 /dashboard/reports — التقارير
[ ] 5.2.10 /dashboard/disputes — نزاعات المستخدم
[ ] 5.2.11 /dashboard/disputes/[id] — تفاصيل النزاع
[ ] 5.2.12 /dashboard/settings — الإعدادات تعمل
[ ] 5.2.13 /dashboard/social — التصويت المجتمعي
[ ] 5.2.14 /dashboard/wallet — المحفظة
[ ] 5.2.15 /dashboard/waitlist — قائمة الانتظار
[ ] 5.2.16 /dashboard/artisans — (للموردين)
[ ] 5.2.17 /dashboard/standardize — التوحيد القياسي
```

### 5.3 صفحات الثقة والنزاعات
```
[ ] 5.3.1 /verification — صفحة التوثيق (KYC) تعمل
[ ] 5.3.2 /disputes — قائمة النزاعات
[ ] 5.3.3 /disputes/[id] — تفاصيل النزاع
[ ] 5.3.4 /disputes/[id]/appeal — صفحة الاستئناف
[ ] 5.3.5 /contracts/[id] — عرض العقد الرقمي
[ ] 5.3.6 /returns — طلب الإرجاع
[ ] 5.3.7 /insurance — خطط التأمين
[ ] 5.3.8 /wallet — المحفظة المستقلة
[ ] 5.3.9 /subscriptions — خطط الاشتراك
```

### 5.4 لوحة الإدارة
```
[ ] 5.4.1 /admin/dashboard — لوحة الإحصائيات
[ ] 5.4.2 /admin/users — إدارة المستخدمين
[ ] 5.4.3 /admin/users/[id] — تفاصيل/تعديل مستخدم
[ ] 5.4.4 /admin/products — إدارة المنتجات
[ ] 5.4.5 /admin/products/new — إضافة منتج
[ ] 5.4.6 /admin/bookings — إدارة الحجوزات
[ ] 5.4.7 /admin/branches — إدارة الفروع
[ ] 5.4.8 /admin/staff — إدارة الموظفين
[ ] 5.4.9 /admin/reports — التقارير
[ ] 5.4.10 /admin/forecasting — التنبؤات
[ ] 5.4.11 /admin/maintenance — الصيانة
[ ] 5.4.12 /admin/hygiene — النظافة
[ ] 5.4.13 /admin/packaging — التغليف
[ ] 5.4.14 /admin/damage-assessment — تقييم الأضرار
[ ] 5.4.15 /admin/performance-reviews — مراجعات الأداء
[ ] 5.4.16 /admin/activity-logs — سجل النشاط
[ ] 5.4.17 /admin/cms/pages — إدارة الصفحات
```

---

## 6. الميزات الوظيفية ⚙️

```
[ ] 6.1 البحث يعمل (اسم، فئة، موقع)
[ ] 6.2 الفلاتر تعمل (سعر، فئة، تقييم)
[ ] 6.3 الإشعارات في الوقت الفعلي (WebSocket) تعمل
[ ] 6.4 نظام Escrow يعمل (hold → release → refund)
[ ] 6.5 العقود الرقمية تُنشأ تلقائيًا
[ ] 6.6 توقيع العقد يعمل
[ ] 6.7 التقييمات تعمل (إنشاء + عرض)
[ ] 6.8 النزاعات تعمل (تقديم + رسائل + حل)
[ ] 6.9 الاستئناف يعمل
[ ] 6.10 الإرجاع يعمل
[ ] 6.11 التأمين يمكن شراؤه
[ ] 6.12 الاشتراكات تعمل (اشتراك + إلغاء)
[ ] 6.13 المحفظة تعمل (رصيد + إيداع + سحب)
[ ] 6.14 التوصيات تعمل
[ ] 6.15 الـ PWA يعمل (install + offline)
[ ] 6.16 الـ SEO يعمل (meta tags, structured data, sitemap)
[ ] 6.17 Dark/Light mode يعمل على كل صفحة
[ ] 6.18 RTL يعمل على كل صفحة
[ ] 6.19 Trust Score يُحسب ويُعرض
[ ] 6.20 التوثيق (KYC) يعمل مع VLM
```

---

## 7. الدفع 💰

```
[ ] 7.1 CIB/Edahabia مُكامل ويعمل في Sandbox
[ ] 7.2 CIB/Edahabia يعمل في Production
[ ] 7.3 Webhook handling مع HMAC verification
[ ] 7.4 Escrow يُفعَّل تلقائيًا عند الدفع
[ ] 7.5 إشعار دفع يُرسل للمستخدم والمؤجر
[ ] 7.6 فشل الدفع يُحدث حالة الحجز
[ ] 7.7 TVA مُحسَب وعرض في كل الأسعار
[ ] 7.8 إيصال/فاتورة PDF لكل دفع (اختياري للمرحلة 1)
[ ] 7.9 Stripe يعمل (للدولي) — اختياري
```

---

## 8. المراقبة والإشعارات 📊

```
[ ] 8.1 Uptime monitoring مُهيأ (UptimeRobot أو BetterStack)
[ ] 8.2 Error tracking مُهيأ (Sentry)
[ ] 8.3 Log aggregation مُهيأ (Axiom أو Logtail)
[ ] 8.4 Analytics مُهيأ (GA4 أو Plausible)
[ ] 8.5 Backup monitoring (تنبيه عند فشل النسخ الاحتياطي)
[ ] 8.6 Domain expiry monitoring
[ ] 8.7 SSL expiry monitoring
[ ] 8.8 Database size monitoring
[ ] 8.9 Response time alerts (P95 > 1s)
```

---

## 9. المحتوى والقانون 📝

```
[ ] 9.1 شروط الاستخدام مُراجَعة قانونيًا
[ ] 9.2 سياسة الخصوصية مُراجَعة قانونيًا
[ ] 9.3 Cookie consent banner مُضاف
[ ] 9.4 معلومات الشركة القانونية في الفوتر
[ ] 9.5 رقم السجل التجاري (RC) معروض
[ ] 9.6 كل الأسعار شاملة TVA أو واضحة
[ ] 9.7 سياسة الاسترجاع واضحة ومحددة
[ ] 9.8 معلومات الاتصال صحيحة ومحدثة
[ ] 9.9 Blog content حقيقي (3+ مقالات على الأقل)
[ ] 9.10 FAQ محدث بأسئلة حقيقية
```

---

## 10. SEO وتجربة المستخدم 🔍

```
[ ] 10.1 Lighthouse Performance > 90
[ ] 10.2 Lighthouse Accessibility > 90
[ ] 10.3 Lighthouse Best Practices > 90
[ ] 10.4 Lighthouse SEO > 95
[ ] 10.5 Page title و meta description لكل صفحة
[ ] 10.6 Open Graph tags لكل صفحة
[ ] 10.7 Structured data (JSON-LD) للمنتجات والحجوزات
[ ] 10.8 Sitemap.xml يعمل (/sitemap.xml)
[ ] 10.9 Robots.txt يعمل (/robots.txt)
[ ] 10.10 Canonical URLs لكل صفحة
[ ] 10.11 Mobile responsive على كل صفحة
[ ] 10.12 Focus indicators لكل عنصر تفاعلي
[ ] 10.13 Alt text لكل صورة
[ ] 10.14 Error pages تعمل (404, 500)
[ ] 10.15 Loading states لكل عملية async
```

---

## 11. ما قبل الإطلاق (T-minus 24h) 🚀

```
[ ] 11.1 إيقاف كل seed data من الإنتاج
[ ] 11.2 التأكد من أن .env.production لا يحتوي على قيم تطوير
[ ] 11.3 تشغيل اختبارات E2E كاملة على بيئة الإنتاج
[ ] 11.4 اختبار يدوي كامل (كل المسارات الـ 10)
[ ] 11.5 التأكد من أن النسخة الاحتياطية الأخيرة ناجحة
[ ] 11.6 إبلاغ فريق الدعم
[ ] 11.7 إعداد صفحة صيانة (maintenance mode) جاهزة
[ ] 11.8 إعداد رسائل إشعارات جاهزة (للمستخدمين الجدد)
[ ] 11.9 التحقق من Cloudflare (WAF + caching + SSL)
[ ] 11.10 التحقق من Uptime monitoring
```

---

## 12. بعد الإطلاق (T+1h, T+24h, T+7d) ✅

### T+1 ساعة
```
[ ] 12.1 فحص Sentry للأخطاء الجديدة
[ ] 12.2 فحص Uptime monitoring
[ ] 12.3 فحص سجلات Nginx (access + error)
[ ] 12.4 التأكد من أن التسجيل والدخول يعملان
[ ] 12.5 التأكد من أن الدفع يعمل
[ ] 12.6 مراقبة CPU/RAM (htop)
```

### T+24 ساعة
```
[ ] 12.7 فحص Analytics (عدد الزيارات، معدل الارتداد)
[ ] 12.8 مراجعة تذاكر الدعم (إن وُجدت)
[ ] 12.9 فحص سجلات الأمان (Failed logins, suspicious activity)
[ ] 12.10 مراجعة قاعدة البيانات (حجم، أداء الاستعلامات)
```

### T+7 أيام
```
[ ] 12.11 تقرير الأسبوع الأول (زيارات، تسجيلات، حجوزات)
[ ] 12.12 مراجعة وتحسين الأداء بناءً على بيانات حقيقية
[ ] 12.13 تحديد ألم المستخدم الأول (support tickets, drop-off points)
[ ] 12.14 تحديث الخطة بناءً على الملاحظات
```

---

## الملخص

| القسم | عدد النقاط | 
|---|---|
| البنية التحتية | 17 |
| قاعدة البيانات | 9 |
| الأمان | 16 |
| المصادقة | 10 |
| الصفحات | 61 |
| الميزات | 20 |
| الدفع | 9 |
| المراقبة | 9 |
| المحتوى | 10 |
| SEO | 15 |
| قبل الإطلاق | 10 |
| بعد الإطلاق | 14 |
| **الإجمالي** | **200** |

> **لا تُطلق المنصة حتى تكون كل نقطة ✅.**
> إذا كانت نقطة غير قابلة للإنجاز، وثّق السبب والمخاطرة والمخطط البديل.

---

> **المرحلة التالية**: `07-POST-LAUNCH-MONITORING.md` — المراقبة والنمو المستمر.