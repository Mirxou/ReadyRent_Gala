# 🏗️ خطة التصليح والتطوير الكبرى — STANDARD.Rent
### المرجعية: تقرير التدقيق الشامل (67 صفحة × 51 API × 34 نموذج × 231 طريقة)

---

## فلسفة الخطة

> **"لا نبني ما لا يُستخدم، ولا نترك ما يُستخدم مكسوراً"**

الخطة مبنية على مبدأ **الأثر الأكبر أولاً**: كل مرحلة تجعل التطبيق أفضل بشكل ملموس للزائر النهائي.
- **المراحل 1-2**: إصلاح ما هو مكسور (مسارات خاطئة، أزرار ميتة) — أعلى عائد
- **المرحلة 3**: بناء الميزات الحرجة المفقودة
- **المرحلة 4**: لوحة التحكم والإدارة
- **المرحلة 5**: تنظيف الكود الميت
- **المرحلة 6**: ميزات متقدمة (قابلة للنقاش)

---

# 📌 المرحلة 1: الإصلاحات السريعة (تصليح التوصيلات المكسورة)
### ⏱️ التقدير: سريعة — كل إصلاح = دقائق
### 🎯 الهدف: 14 صفحة تنتقل من ❌ إلى ✅ بدون بناء جديد

---

### المهمة 1.1 — إصلاح مسارات النزاعات (Disputes)
**المشكلة:** `lib/api.ts` يستدعي `/disputes/disputes/` (مسار مزدوج) بدل `/disputes/`
**التأثير:** صفحة النزاعات بأكملها لا تعمل رغم وجود الـ API

**الملفات:**
- `lib/api.ts` — تصحيح مسارات `disputesApi`:
  - `disputes/disputes/` → `disputes/`
  - `disputes/disputes/create/` → `disputes/create`
  - `disputes/disputes/${id}/` → `disputes/${id}` (إنشاء route جديد)
  - `disputes/disputes/${id}/messages/` → `disputes/${id}/messages` (إنشاء route جديد)
  - `disputes/tickets/` → إزالة (لا يوجد SupportTicket في Schema)

**الصفحات التي تُصلح:**
- ✅ `/disputes` — عرض النزاعات
- ✅ `/disputes/[id]` — تفاصيل النزاع
- ✅ `/dashboard/disputes` — نزاعاتي في الداشبورد
- ✅ `/dashboard/disputes/[id]` — تفاصيل نزاعي

---

### المهمة 1.2 — إصلاح مسارات العقود (Contracts)
**المشكلة:** الصفحة تستدعي `/contracts/digital/[id]/` بدل `/contracts/[id]/`

**الملفات:**
- `lib/api/contracts.ts` — تصحيح:
  - `/contracts/digital/${id}/` → `/contracts/${id}`
  - `/contracts/digital/?booking=` → `/contracts?booking=`
  - `/contracts/digital/${id}/sign/` → `/contracts/${id}/sign` (إنشاء route جديد)

**الصفحات التي تُصلح:**
- ✅ `/contracts/[id]` — عرض العقد
- ✅ `/contracts/_id_/` — الصفحة المكررة

---

### المهمة 1.3 — ربط زر شراء التأمين
**المشكلة:** API `/api/insurance/purchase` موجود ومكتمل لكن الصفحة لا تستدعيه

**الملفات:**
- `app/insurance/page.tsx` — ربط `handleConfirmPurchase` بـ `fetch('/api/insurance/purchase', { POST })`
- بدل toast "قريباً"

**الصفحات التي تُصلح:**
- ✅ `/insurance` — زر الشراء يصبح حقيقي

---

### المهمة 1.4 — ربط تواصل مع الدعم بالـ WhatsApp
**المشكلة:** زر "تواصل مع الدعم" في صفحة التأمين لا يفعل شيئاً

**الملفات:**
- `app/insurance/page.tsx` — `handleContactSupport` يفتح `https://wa.me/...` (الرقم من المتغيرات البيئية أو ثابت)

---

### المهمة 1.5 — إصلاح مسار الإشعارات
**المشكلة:** `lib/api/notifications.ts` يستدعي `/notifications/notifications/` (مسار مزدوج)

**الملفات:**
- `lib/api/notifications.ts` — تصحيح المسارات
- أو: حذف الملف بالكامل (الصفحات تستخدم `fetch` مباشرة)

---

### المهمة 1.6 — إنشاء API التواصل (Contact)
**المشكلة:** صفحة `/contact` ترسل نموذج لـ `/api/contact/` غير موجود

**الملفات:**
- إنشاء `app/api/contact/route.ts` (POST) — يحفظ الرسالة (Notification أو جدول جديد)
- أو أبسط: إرسال بريد إلكتروني / حفظ في ActivityLog

**الصفحات التي تُصلح:**
- ✅ `/contact` — نموذج التواصل يعمل

---

### المهمة 1.7 — إصلاح بيانات نقاط الثقة المضلّلة
**المشكلة:** صفحة `/trust-score` تعرض النقاط من API لكن تفاصيل المكونات (85, 60, 78, 70, 65) مكتوبة يدوياً

**الملفات:**
- `app/trust-score/page.tsx` — استبدال مصفوفة `components` ببيانات حقيقية من API
- تعديل `/api/social/score/[userId]` ليعيد `breakdown` (أو حسابه من البيانات الحقيقية)

---

### المهمة 1.8 — ربط زر الإلغاء في الاشتراكات
**المشكلة:** زر "إلغاء الاشتراك" يستدعي `/api/subscriptions/cancel` غير موجود

**الملفات:**
- إنشاء `app/api/subscriptions/cancel/route.ts` (POST)
  - يبحث عن UserSubscription للمالك
  - يحدّث `status = 'cancelled'`
  - ينشئ Notification

**الصفحات التي تُصلح:**
- ✅ `/subscriptions` — زر الإلغاء يعمل

---

### المهمة 1.9 — ربط زر الاشتراك
**المشكلة:** زر "اشتراك" يُظهر toast "قريباً"

**الملفات:**
- إنشاء `app/api/subscriptions/subscribe/route.ts` (POST)
  - يخصم من `walletBalance`
  - ينشئ `UserSubscription` (status: 'active')
  - ينشئ `Transaction`
  - ينشئ `Notification`
- ربط الزر بالـ API في `/subscriptions/page.tsx`

---

### المهمة 1.10 — إصلاح أزرار تفاصيل الطلب
**المشكلة:** في `/dashboard/orders/[id]` ثلاثة أزرار ميتة: "إرسال مشكلة" / "تمديد العقد" / "مراسلة"

**الملفات:**
- "إرسال مشكلة" → ربط بـ `router.push('/disputes/create?booking_id=...')` أو `disputesApi.createDispute()`
- "تمديد العقد" → إنشاء `app/api/bookings/[id]/extend/route.ts` (POST) أو إخفاء الزر مؤقتاً
- "مراسلة" → ربط بنظام المحادثة أو إخفاء مؤقتاً

---

### المهمة 1.11 — إصلاح صفحة `/bookings/[id]/cancel`
**المشكلة:** تستدعي `cancellation-policy` و `cancel` — غير موجودين

**الملفات:**
- إنشاء `app/api/bookings/[id]/cancel/route.ts` (POST)
  - يحدّث حالة الحجز إلى `cancelled`
  - يحسب المبلغ المسترد حسب سياسة الإلغاء (بسيطة: 100% إذا قبل 48 ساعة، 50% إذا أقل)
  - ينشئ Transaction استرداد
  - ينشئ Notification
- `/bookings/[id]/cancellation-policy/route.ts` (GET) — يُرجع سياسة الإلغاء

---

### المهمة 1.12 — إصلاح مسارات المحفظة القديمة
**المشكلة:** `lib/api/wallet.ts` يستدعي `/payments/wallet/*` بدل `/wallet/*`

**الملفات:**
- `lib/api/wallet.ts` — تصحيح المسارات (أو حذف الملف، الصفحات تستخدم fetch مباشرة)

---

### المهمة 1.13 — حذف رابط الدليل المحلي الميت
**المشكلة:** `/local-guide` في Navbar و Footer يذهب لـ 404

**الملفات:**
- `components/navbar.tsx` — حذف `{ label: 'الدليل المحلي', href: '/local-guide' }`
- `components/footer.tsx` — نفس الشيء
- بديل: توجيه الرابط إلى `/services` (الصفحة الموجودة)

---

### المهمة 1.14 — إصلاح الاستيرادات المكسورة
**المشكلة:** 3 ملفات تستورد من أماكن خاطئة

**الملفات:**
- `components/booking/artisan-integration.tsx` — يستورد `artisansApi` غير موجود → يستبدل بـ `innovationApi.getArtisans()`
- `components/wallet/wallet-dashboard.tsx` — يستورد من `lib/api/wallet` (مسارات خاطئة) → يُصلح أو يُحذف (الصفحة لا تستخدمه)
- `shared/components/sovereign/2fa-enrollment.tsx` — يستورد 2FA methods غير موجودة → يُحذف أو يُخفى مؤقتاً

---

## ✅ نتيجة المرحلة 1 المتوقعة:
| المؤشر | قبل | بعد |
|--------|------|------|
| صفحات كاملة المكسورة | 14 | **0** |
| صفحات تعمل | ~16 | **~30** |
| أزرار "قريباً" حية | 11 | **3** |

---

# 📌 المرحلة 2: بناء الميزات الحرجة (حلقات مسار المستخدم)
### ⏱️ التقدير: متوسطة
### 🎯 الهدف: إكمال مسار المستخدم من البداية للنهاية

---

### المهمة 2.1 — نظام الخدمات (الذراع الثاني من النظام الثلاثي)
**الحالي:** صفحة `/services` تعرض تصنيفات مكتوبة يدوياً وتستدعي `local-guide/services/` غير موجود
**المطلوب:** الخدمات هي ذراع أساسي من المنصة — يجب أن تعمل

**ما يجب فعله:**
1. **إنشاء API الخدمات:**
   - `GET /api/services` — قائمة الخدمات مع فلترة حسب التصنيف
   - `POST /api/services/book` — حجز خدمة (ينشئ Booking بنوع service)
   - `GET /api/services/categories` — التصنيفات (أعراس، تصوير، مكياج، دج، زهور، حفلات)

2. **تعديل صفحة `/services`:**
   - استبدال `api.get('local-guide/services/')` بـ `fetch('/api/services')`
   - استبدال `api.post('local-guide/services/book/')` بـ `fetch('/api/services/book')`
   - إبقاء التصنيفات hardcoded (6 فقط — مقبولة كتصنيفات ثابتة)

3. **البيانات:**
   - استخدام نموذج `LocalGuideService` الموجود في Prisma (يتيم حالياً)
   - أو إعادة استخدام `Product` مع `category` نوع خدمة

**الصفحات التي تُصلح:**
- ✅ `/services` — الذراع الثاني من النظام الثلاثي يعمل أخيراً

---

### المهمة 2.2 — نظام التقييمات (كتابة + إشراف)
**الحالي:** يمكن إنشاء تقييم (status: 'pending') لكن لا يمكن الموافقة عليه — التقييمات تبقى pending للأبد

**ما يجب فعله:**
1. **إنشاء API الإشراف:**
   - `PATCH /api/reviews/[id]/moderate` — تغيير status (approved/rejected)
   - Auth: فقط admin أو vendor صاحب المنتج

2. **تعديل صفحة تفاصيل المنتج:**
   - عرض فقط التقييمات `status: 'approved'`

3. **تعديل لوحة تحكم الأدمين:**
   - إضافة صفحة "التقييمات المعلّقة" في `/admin/` أو `/dashboard/`

---

### المهمة 2.3 — نظام حالة الحجز (الرحلة الكاملة)
**الحالي:** الحجز يُنشأ بـ `status: 'pending'` ولا يتغير أبداً — لا توجد انتقالات حالة

**ما يجب فعله:**
1. **إنشاء APIs انتقال الحالة:**
   - `PATCH /api/bookings/[id]/status` — تغيير الحالة
     - `pending → confirmed` (بعد الدفع)
     - `confirmed → active` (بعد بدء فترة الكراء)
     - `active → completed` (بعد انتهاء الفترة)
     - `any → cancelled` (الإلغاء — مُنجز في 1.11)
   - Auth: المستخدم نفسه أو admin

2. **ربط تلقائي في Checkout:**
   - عند نجاح الدفع → تحديث حالة الحجز إلى `confirmed`

3. **عرض الحالة في:**
   - `/dashboard/orders` — بـ badge ملون
   - `/dashboard/orders/[id]` — timeline كامل

---

### المهمة 2.4 — نظام استئناف النزاعات
**الحالي:** صفحة `/disputes/[id]/appeal` موجودة لكن `appealsApi` بالكامل بلا backend

**ما يجب فعله:**
1. **إنشاء API:**
   - `POST /api/disputes/[id]/appeal` — تقديم استئناف
   - يحتاج: reason, description
   - يُنشئ DisputeMessage بنوع 'appeal'
   - يُحدّث Dispute.status إلى 'appealed' (إضافة للحالات الموجودة)

2. **ربط الصفحة:**
   - `/disputes/[id]/appeal` تستدعي API الجديد

---

### المهمة 2.5 — نظام تفاصيل النزاع + الرسائل
**الحالي:** صفحة تفاصيل النزاع تعتمد على بيانات وهمية احتياطية

**ما يجب فعله:**
1. **إنشاء APIs:**
   - `GET /api/disputes/[id]` — تفاصيل النزاع (مع DisputeMessages)
   - `POST /api/disputes/[id]/messages` — إرسال رسالة في النزاع
   - `GET /api/disputes/[id]/history` — تاريخ تغيرات الحالة

2. **استخدام نموذج DisputeMessage** (يتيم حالياً في Schema)

3. **ربط الصفحات:**
   - `/disques/[id]` — تعرض بيانات حقيقية بدل fallback mock
   - قسم الرسائل يعمل فعلياً

---

### المهمة 2.6 — نظام التوثيق بـ 2FA (اختياري — حقلان في Schema)
**الحالي:** `User.is2FaEnabled` و `User.twoFaSecret` موجودان في Schema لكن لا يوجد أي كود

**القرار:** حذف الحقلين من Schema مؤقتاً أو تركهما للمرحلة 6

---

### المهمة 2.7 — نظام إعادة كلمة المرور
**الحالي:** صفحتا `/forgot-password` و `/reset-password` موجودتان لكن الـ API غير موجود

**ما يجب فعله:**
1. **إنشاء APIs:**
   - `POST /api/auth/forgot-password` — يولّد token ويُرسل بريد (أو يُرجعه مباشرة في وضع dev)
   - `POST /api/auth/reset-password` — يتحقق من token ويُحدّث كلمة المرور

2. **تعديل الصفحات:**
   - ربط النماذج بالـ APIs الجديدة

---

## ✅ نتيجة المرحلة 2 المتوقعة:
| المؤشر | قبل | بعد |
|--------|------|------|
| مسار المستخدم الكامل | 60% | **90%** |
| الأنظمة الثلاثة (كراء+خدمات+سوق) | ذراعان يعملان | **الثلاثة تعمل** |
| التقييمات | تُكتب ولا تُنشر | **دورة كاملة** |
| النزاعات | إنشاء فقط | **إنشاء + تفاصيل + رسائل + استئناف** |

---

# 📌 المرحلة 3: المحتوى والصفحات الثابتة
### ⏱️ التقدير: سريعة
### 🎯 الهدف: كل رابط في الموقع يُظهر محتوى حقيقياً

---

### المهمة 3.1 — نظام المدونة (Blog)
**الحالي:** الصفحة تعرض 4 مقالات مكتوبة يدوياً، صفحة المقال تفشل دائماً

**ما يجب فعله:**
1. **إنشاء APIs:**
   - `GET /api/blog` — قائمة المقالات (مع pagination)
   - `GET /api/blog/[id]` — تفاصيل مقال
   - `POST /api/blog` — إنشاء مقال (admin)

2. **استخدام نموذج BlogPost** (يتيم حالياً — 6 حقول جاهزة)

3. **تعديل الصفحات:**
   - `/blog` — تستدعي API بدل البيانات اليدوية
   - `/blog/[id]` — تستدعي API بدل 404

4. **تعديل `/admin/cms`:**
   - ربط إدارة المحتوى بـ BlogPost و CMSPage

---

### المهمة 3.2 — نظام الصفحات الديناميكية (CMS)
**الحالي:** `/pages/[slug]` تستدعي `/api/cms/pages/[slug]` غير موجود

**ما يجب فعله:**
1. **إنشاء API:**
   - `GET /api/cms/pages` — قائمة الصفحات
   - `GET /api/cms/pages/[slug]` — صفحة بالـ slug
   - `POST/PUT/DELETE /api/cms/pages` — CRUD (admin)

2. **استخدام نموذج CMSPage** (يتيم حالياً — title, slug, content, status)

3. **تعبئة البيانات:**
   - about, privacy, terms, faq كصفحات CMS

---

### المهمة 3.3 — نظام قائمة الانتظار (Waitlist)
**الحالي:** نموذج WaitlistItem في Schema + زر في صفحة المنتج + صفحة `/dashboard/waitlist` — لكن لا API

**ما يجب فعله:**
1. **إنشاء APIs:**
   - `GET /api/bookings/waitlist` — قائمة انتظاري
   - `POST /api/bookings/waitlist` — إضافة لقائمة الانتظار
   - `DELETE /api/bookings/waitlist/[id]` — إزالة

2. **ربط المكونات:**
   - WaitlistButton في صفحة المنتج
   - `/dashboard/waitlist`

---

### المهمة 3.4 — نظام إشعارات متقدم
**الحالي:** الإشعارات تُعرض لكن لا يمكن تعليمها كمقروءة من الصفحة

**ما يجب فعله:**
1. **تعديل صفحة الإشعارات:**
   - ربط زر "قراءة" بـ `PATCH /api/notifications/[id]` (API موجود)
   - إضافة زر "قراءة الكل" → إنشاء `PATCH /api/notifications/read-all`

---

### المهمة 3.5 — عرض قائمة المدفوعات
**الحالي:** API `/api/payments/payments` موجود (GET) لكن لا صفحة تعرضه

**ما يجب فعله:**
1. **إضافة قسم في `/dashboard/wallet`** أو إنشاء `/dashboard/payments`
2. عرض قائمة المدفوعات مع الحالة والتاريخ

---

## ✅ نتيجة المرحلة 3 المتوقعة:
كل رابط في الموقع يُظهر محتوى حقيقياً — صفر صفحة 404 أو "قريباً" للميزات الأساسية.

---

# 📌 المرحلة 4: لوحة التحكم والإدارة (Admin)
### ⏱️ التقدير: متوسطة إلى طويلة
### 🎯 الهدف: لوحة تحكم حقيقية بدل صفحات وهمية

---

### المهمة 4.1 — تصنيف صفحات الأدمين

**صفحات يمكن ربطها بسرعة (تعرض بيانات حقيقية):**

| الصفحة | الحالي | ما يجب فعله |
|--------|--------|-------------|
| `/admin/dashboard` | ✅ يعمل بالفعل (stats + revenue) | تحسين العرض |
| `/admin/bookings` | تستدعي API موجود | تصحيح المسارات إن لزم |
| `/admin/reports` | ✅ revenue + sales تعمل | إضافة export CSV |
| `/admin/users` | بيانات وهمية | ربط بـ `GET /api/auth/admin/users` (جديد) |

**صفحات تحتاج APIs جديدة:**

| الصفحة | API مطلوب |
|--------|----------|
| `/admin/products` | CRUD منتجات (create, update, delete) |
| `/admin/staff` + `/admin/shifts` + `/admin/performance-reviews` | نظام الموظفين |
| `/admin/branches` | إدارة الفروع (Branch model يتيم) |
| `/admin/activity-logs` | سجل النشاط (ActivityLog model يتيم) |

**صفحات يجب حذفها أو تجميدها (غير مناسبة لمنصة كراء فاخر):**

| الصفحة | السبب |
|--------|-------|
| `/admin/maintenance` | صيانة صناعية — لا يناسب كراء فساتين |
| `/admin/hygiene` | شهادات نظافة صناعية — لا يناسب |
| `/admin/packaging` | إدارة تغليف صناعي — لا يناسب |
| `/admin/inventory` | إدارة مخزون معقدة — لا يناسب (الكراء أبسط) |
| `/admin/damage-assessment` | تقييم أضرار معقد — يمكن تبسيطه |
| `/admin/forecasting` | تنبؤات ذكاء اصطناعي — مبالغة لمرحلة حالية |

---

### المهمة 4.2 — CRUD المنتجات للأدمين
1. **إنشاء APIs:**
   - `POST /api/products` — إنشاء منتج
   - `PUT /api/products/[id]` — تحديث منتج
   - `DELETE /api/products/[id]` — حذف منتج
2. **تعديل `/admin/products`:**
   - نموذج إضافة/تعديل حقيقي
   - أزرار تعديل/حذف تعمل

### المهمة 4.3 — إدارة المستخدمين للأدمين
1. **إنشاء APIs:**
   - `GET /api/admin/users` — قائمة المستخدمين
   - `PATCH /api/admin/users/[id]` — تحديث مستخدم (حظر/تفعيل/تغيير دور)
2. **تعديل `/admin/users`:**
   - بيانات حقيقية من الـ DB

### المهمة 4.4 — إدارة الفروع (إن أُريدت)
1. **إنشاء APIs** لـ Branch model (يتيم)
2. **تعديل `/admin/branches`:**
   - CRUD حقيقي

---

## ✅ نتيجة المرحلة 4 المتوقعة:
لوحة تحكم وظيفية: إدارة منتجات + مستخدمين + حجوزات + تقارير حقيقية.
الصفحات غير المناسبة تُخفى أو تُحذف.

---

# 📌 المرحلة 5: تنظيف الكود الميت (الجراحة التجميلية)
### ⏱️ التقدير: سريعة — حذف فقط
### 🎯 الهدف: كود نظيف بدون ضوضاء

---

### المهمة 5.1 — حذف النظام القديم للـ API
**حذف 11 ملف غير مستخدمة من `lib/api/`:**
```
lib/api/admin.ts          — لا يُستورد أبداً
lib/api/auth.ts           — لا يُستورد أبداً
lib/api/logistics.ts      — لا يُستورد أبداً
lib/api/notifications.ts  — لا يُستورد أبداً
lib/api/index.ts          — لا يُستورد أبداً
lib/api/payments.ts       — يُستورد لكن مسارات خاطئة
lib/api/products.ts       — يُستورد لكن مسارات خاطئة
lib/api/reviews.ts        — يُستورد لكن مسارات خاطئة
lib/api/bookings.ts       — يُستورد لكن مسارات خاطئة
lib/api/wallet.ts         — يُستورد لكن مسارات خاطئة
lib/api/sovereign-client.ts — SovereignClient لا يُستخدم
```

**الملفات الوحيدة المفيدة من النظام القديم (4 من 16):**
- `lib/api/contracts.ts` — يُستورد من صفحة العقود
- `lib/api/disputes.ts` — يُستورد من صفحة النزاعات
- `lib/api/innovation.ts` — يُستورد من الصفحة الرئيسية + الحرفيات
- `lib/api/appeals.ts` — يُستورد من صفحة الاستئناف

**بعد الإصلاح:** دمج الـ 4 المفيدة في `lib/api.ts` وحذف المجلد بالكامل.

---

### المهمة 5.2 — حذف المكونات غير المستخدمة (33 ملف)

**حذف فوري (مكررات + غير مستخدمة أبداً):**
```
components/product-card.tsx         — نسخة مكررة
components/accessory-suggestions.tsx — لا يُستورد
components/hijri-calendar.tsx       — لا يُستورد
components/id-upload.tsx            — لا يُستورد
components/CommunityProductForm.tsx — لا يُستورد
components/damage-inspection.tsx    — لا يُستورد
components/dispute-form.tsx         — نسخة مكررة
components/insurance-selector.tsx   — لا يُستورد
components/booking-calendar.tsx     — لا يُستورد
components/BookingStatusCard.tsx    — لا يُستورد
components/chatbot.tsx              — لا يُستورد (SovereignConcierge هو المستخدم)
components/communication/call-interface.tsx — لا يُستورد
components/booking/artisan-integration.tsx   — لا يُستورد (استيراد مكسور)
components/trust/TrustScoreDashboard.tsx     — لا يُستورد
components/wallet/wallet-dashboard.tsx       — لا يُستورد
components/wallet/transaction-history.tsx    — لا يُستورد
components/disputes/dispute-card.tsx         — لا يُستورد فعلياً
components/ui/interactive-product-card.tsx   — لا يُستورد
components/ui/skeletons.tsx                   — لا يُستورد
components/ui/bento-grid.tsx                  — لا يُستورد
components/ui/3d-card.tsx                     — لا يُستورد
components/ui/spotlight.tsx                   — لا يُستورد
```

---

### المهمة 5.3 — حذف الملفات المكررة والقديمة

```
src/app/           — نسخة قديمة من التطبيق (page.tsx بسيط)
public/public/     — نسخة مكررة من public/
app/contracts/_id_/page.tsx — نسخة مكررة من contracts/[id]/page.tsx
```

---

### المهمة 5.4 — تنظيف `lib/api.ts`
- إزالة ~142 طريقة API بلا خادم (maintenanceApi, hygieneApi, locationsApi, packagingApi, inventoryApi, judicialApi, chatbotApi sessions, intelligenceApi)
- إبقاء فقط الطرق التي لها route فعلي
- **النتيجة:** الملف ينكمش من 231 طريقة إلى ~89 طريقة

---

### المهمة 5.5 — تنظيف حقول Schema غير المستخدمة
- حذف `User.is2FaEnabled` و `User.twoFaSecret` (لا يوجد كود 2FA)
- حذف علاقة `Address.deliveryZoneId` (DeliveryZone يتيم)
- مراجعة علاقات `User.subscriptions` و `User.activityLogs` و `User.waitlistItems` (إن لم تُبنَ APIs لها)

---

## ✅ نتيجة المرحلة 5 المتوقعة:
| المؤشر | قبل | بعد |
|--------|------|------|
| ملفات API client | 17 (مزدوجة) | **1** (`lib/api.ts` فقط) |
| طرق API في الكلاينت | 231 (61% ميت) | **~89** (100% حية) |
| مكونات غير مستخدمة | 33+ | **0** |
| ملفات مكررة | 4+ | **0** |

---

# 📌 المرحلة 6: ميزات متقدمة (قابلة للنقاش)
### ⏱️ التقدير: طويلة
### 🎯 الهدف: التمييز والابتكار

---

### المهمة 6.1 — نظام المحادثة الذكي (Chatbot Sessions)
- إنشاء `ChatSession` API (النموذج يتيم حالياً)
- جلسات محادثة محفوظة + تاريخ
- ربط بـ LLM skill عبر z-ai-web-dev-sdk

### المهمة 6.2 — توصيات المنتجات الذكية
- `POST /api/products/[id]/recommendations` — توصيات بالذكاء الاصطناعي
- `POST /api/products/[id]/matching-accessories` — ملحقات مقترحة

### المهمة 6.3 — نظام التتبع الجغرافي
- تتبع حالة التوصيل على الخريطة
- مناطق التوصيل (DeliveryZone model يتيم)

### المهمة 6.4 — نظام التوثيق الثنائي (2FA)
- إنشاء كود QR + TOTP
- ربط بحقلين User الموجودين

### المهمة 6.5 — نظام الذكاء التجاري
- تحليلات متقدمة
- نبض السوق (Market Pulse)
- تنبؤات

---

# 📊 الرؤية النهائية

```
المرحلة 1: الإصلاح السريع         ████████████░░░░  14 إصلاح → +14 صفحة تعمل
المرحلة 2: الميزات الحرجة         ██████████████░░  7 ميزات → مسار مستخدم 90%
المرحلة 3: المحتوى والصفحات       ████████████░░░░  5 ميزات → صفر 404
المرحلة 4: لوحة التحكم            ██████████░░░░░░  4 ميزات → أدمين حقيقي
المرحلة 5: التنظيف                ██████████░░░░░░  5 مهام → كود نظيف
المرحلة 6: متقدم (اختياري)       ████████████████  5 ميزات → تمييز
```

---

### الترتيب المقترح للتنفيذ:

**الدفعة الأولى (المرحلة 1):** إصلاح 14 كسر سريع — الأثر فوري
**الدفعة الثانية (المرحلة 2 + 5.4):** بناء الميزات الحرجة + تنظيف الـ API client
**الدفعة الثالثة (المرحلة 3 + 5):** المحتوى + التنظيف الشامل
**الدفعة الرابعة (المرحلة 4):** لوحة التحكم
**الدفعة الخامسة (المرحلة 6):** حسب الحاجة والوقت

---

# 🔍 الملحق أ: التنقيب العميق في المتطلبات الأصلية والفجوات المكتشفة

### المرجعية: الملف الأصلي `upload/Pasted Content_1783078370435.txt` (2870 سطر — المحادثة الكاملة مع GLM)

---

## الفجوات التي لم تُغطَّها الخطة الأصلية

### ❌ الفجوة 1: ماركت بلايس — الذراع الثالث غير مكتمل
**الوضع الأصلي:** المشروع مقسّم لـ 3 أذرع: كراء + خدمات + ماركت بلايس
**الحالي:** صفحة `/marketplace` موجودة وتعرض بائعين وحرفيات (جمالياً ممتازة) لكن:
- لا يوجد نظام "بيع" حقيقي — المنتجات الحالية كلها للكراء فقط
- لا يوجد نموذج `MarketplaceListing` في Prisma للمنتجات المعروضة للبيع
- لا يوجد فرق واضح بين `/products` (الكراء) و `/marketplace` (البيع)
- البائعون والحرفيات يظهرون لكن لا يمكنهم إدارة منتجاتهم

**الحل المقترح:**
- إضافة حقل `listingType` لنموذج Product: `'rental' | 'sale'`
- أو إنشاء نموذج `MarketplaceListing` منفصل
- تعديل `/marketplace` لعرض منتجات `listingType: 'sale'` فقط
- إضافة فلاتر للسوق (فئة، مدينة، السعر، الحالة)

---

### ❌ الفجوة 2: نظام التحقق من الهوية (Verification/KYC) — كود بلا API
**الوضع الأصلي:** Django لديه نظام كامل: Face Matching + Community Review + AI Analysis
**الحالي:**
- نموذج `IdentityVerification` في Prisma (حقلان: facePhoto, status, aiAnalysis, aiScore, requiredApprovals)
- نموذج `VerificationVote` (فحص المجتمع)
- صفحة `/verification` ضخمة (1533 سطر!) ومكتملة بصرياً
- `verificationApi` في lib/api.ts (4 methods: submit, getStatus, getPending, vote)
- **لكن لا يوجد أي API route** تحت `app/api/verification/`

**الحل المقترح:**
- إنشاء `POST /api/verification/submit` — رفع الصورة
- إنشاء `GET /api/verification/status` — حالة التحقق
- إنشاء `GET /api/verification/pending` — للمحققين
- إنشاء `POST /api/verification/[id]/vote` — تصويت المجتمع
- ربط صفحة `/verification` بهذه APIs

---

### ❌ الفجوة 3: نظام الباقات (Bundles) — عرض فقط
**الوضع الأصلي:** Django لديه BundleBookingViewSet مع حساب الأسعار atomically
**الحالي:**
- نموذج `Bundle` + `BundleItem` في Prisma
- صفحتان: `/bundles` (قائمة) و `/bundles/[id]` (تفاصيل)
- API واحد فقط: `GET /api/bundles/bundles`
- **لا يوجد** API لحجز باقة، ولا حساب سعر

**الحل المقترح:**
- إنشاء `GET /api/bundles/[id]` — تفاصيل الباقة مع المنتجات
- إنشاء `POST /api/bundles/[id]/book` — حجز باقة (ينشئ Booking لكل BundleItem)
- تعديل صفحة `/bundles/[id]` لعرض المنتجات وأسعار الحجز

---

### ❌ الفجوة 4: نظام البائعين (Vendors) — تسجيل وإدارة ناقصة
**الوضع الأصلي:** Django لديه 10 نقاط API: register, profile, dashboard, performance, commissions
**الحالي:**
- نموذج `Vendor` في Prisma
- صفحات: `/vendors` (قائمة)، `/vendors/[id]` (تفاصيل)، `/vendors/dashboard`
- API واحد: `GET /api/vendors/vendors`
- **لا يوجد** تسجيل بائع، لا إدارة منتجات، لا تتبع أداء

**الحل المقترح:**
- إضافة `role: 'vendor'` عند التسجيل (حقل موجود بالفعل)
- إنشاء `GET /api/vendors/dashboard` — إحصائيات البائع
- إنشاء `POST/PUT/DELETE /api/vendors/products` — CRUD منتجات البائع
- تعديل صفحة `/vendors/dashboard` لعرض بيانات حقيقية

---

### ❌ الفجوة 5: إدارة المنتجات للأدمين/البائعين — placeholder
**الحالي:**
- `/products/create` — "نموذج إضافة المنتج سيكون متاحاً قريباً"
- `/admin/products/new` — نفس النص
- لا يوجد `POST /api/products` (إنشاء)
- لا يوجد `PUT /api/products/[id]` (تحديث)
- لا يوجد `DELETE /api/products/[id]` (حذف)

**الحل المقترح:**
- إضافة POST/PUT/DELETE لـ `/api/products`
- بناء نموذج إضافة/تعديل منتج حقيقي (صور، ألوان، مقاسات، سعر، فئة)
- حماية المسارات بـ auth (vendor أو admin)

---

### ❌ الفجوة 6: إدارة المستخدمين للأدمين — بيانات وهمية
**الحالي:**
- `/admin/users` صفحة موجودة
- `adminApi.getAllUsers()` موجود في lib/api.ts
- **لا يوجد** `GET /api/admin/users` في الخادم

**الحل المقترح:**
- إنشاء `GET /api/admin/users` — قائمة المستخدمين مع فلترة
- إنشاء `PATCH /api/admin/users/[id]` — تحديث (حظر/تفعيل/تغيير دور)
- تعديل صفحة `/admin/users` لعرض بيانات حقيقية

---

### ❌ الفجوة 7: نظام الفروع (Branches) — نموذج يتيم
**الحالي:**
- نموذج `Branch` في Prisma
- صفحة `/admin/branches` موجودة
- **لا يوجد** أي API لـ Branches

**الحل المقترح:**
- إنشاء CRUD API لـ Branches
- أو إزالة الصفحة مؤقتاً (فروع ليست أولوية للمنصة الحالية)

---

### ❌ الفجوة 8: الإشعارات اللحظية (Real-time) — WebSocket مفقود
**الوضع الأصلي:** Django لديه 5 قنوات WebSocket
**الحالي:**
- `components/notifications/realtime-notifications.tsx` موجود لكن لا يعمل (لا WebSocket server)
- الإشعارات تعمل بـ polling فقط (fetch عند فتح الصفحة)

**الحل المقترح (مرحلة 6):**
- إنشاء mini-service WebSocket بـ socket.io
- إشعارات لحظية + تحديث حالة الحجز
- أو استخدام polling ذكي (كل 30 ثانية) كبديل أبسط

---

### ❌ الفجوة 9: Sitemap ناقص جداً
**الحالي:** 11 route فقط في sitemap.ts
**المفقود:**
- `/services`, `/rentals`, `/marketplace` — الأذرع الثلاثة
- `/subscriptions`, `/insurance`, `/vendors`, `/contact`
- `/wallet`, `/cart`, `/checkout`, `/disputes`, `/returns`
- `/bundles`, `/artisans`, `/trust-score`, `/judicial`
- `/about`, `/faq`, `/privacy`, `/terms`, `/blog`

**الحل المقترح:**
- إضافة كل الصفحات العامة لـ sitemap
- إضافة مسارات ديناميكية: `/products/[id]`, `/artisans/[id]`, `/vendors/[id]`, `/blog/[id]`

---

### ❌ الفجوة 10: الصفحات الإدارية غير المناسبة
هذه الصفحات من حقبة Django الصناعية ولا تناسب منصة كراء فاخر:
- `/admin/maintenance` — صيانة صناعية (no API)
- `/admin/hygiene` — شهادات نظافة صناعية (no API)
- `/admin/packaging` — إدارة تغليف صناعي (no API)
- `/admin/inventory` — مخزون معقد (no API)
- `/admin/damage-assessment` — تقييم أضرار معقد (no API)
- `/admin/forecasting` — تنبؤات AI (no API)
- `/admin/performance-reviews` — مراجعات أداء الموظفين (no API)
- `/admin/shifts` — إدارة الورديات (no API)
- `/admin/staff` — إدارة الموظفين (no API)
- `/admin/activity-logs` — سجل النشاط (no API)

**الحل المقترح:**
- إخفاء هذه الصفحات من القائمة الجانبية (أو إزالتها)
- الاحتفاظ بها كـ stubs للمراحل المتقدمة

---

### ⚠️ الفجوة 11: المكونات/الصفحات السيادية (Sovereign) — ديمو فقط
**الحالي:**
- `/sovereign/dashboard` — بيانات وهمية
- `/sovereign/presentation` — عرض شرائح ثابت
- `/sovereign/showcase` — معرض مكونات

**القرار:** هذه صفحات تسويقية/عرضية — لا تحتاج بيانات حقيقية

---

### ⚠️ الفجوة 12: لغة ثانية وثالثة
**الوضع الأصلي:** دعم عربي/فرنسي/إنجليزي
**الحالي:** `language-switcher.tsx` موجود لكن لا يعمل (لا ملفات ترجمة)

**الحل المقترح:** إنشاء نظام i18n بسيط مع ملفات JSON لكل لغة

---

## ✅ ما تم اكتشافه أنه يعمل فعلاً (تأكيد إيجابي)

بعد التنقيب العميق، هذه الميزات تعمل بالفعل ولم تُذكر في التدقيق الأول:

1. ✅ `/rentals` — صفحة كراء كاملة مع تصنيفات ومنتجات حقيقية
2. ✅ `/marketplace` — صفحة سوق مع بائعين وحرفيات حقيقيين
3. ✅ `/services` — صفحة خدمات مع API حقيقي و6 تصنيفات
4. ✅ `/verification` — صفحة تحقق ضخمة (1533 سطر) تنتظر API فقط
5. ✅ `/bundles` و `/bundles/[id]` — صفحات باقات موجودة
6. ✅ `/vendors/dashboard` — لوحة تحكم البائع موجودة
7. ✅ `/returns` — نظام الإرجاع يعمل (قائمة + إنشاء)
8. ✅ `/wallet` — المحفظة تعمل (رصيد + إيداع + تحويل + سحب)
9. ✅ `/social` — صفحة الضمان الاجتماعي موجودة
10. ✅ `/dashboard/social` — نبض مجتمعي في الداشبورد
11. ✅ `/dashboard/analytics` — تحليلات الداشبورد
12. ✅ `/dashboard/reports` — تقارير الداشبورد

---

## 📊 الخلاصة الكمية بعد التنقيب

| البعد | الرقم |
|-------|-------|
| صفحات إجمالية | **83** |
| API routes إجمالية | **70** |
| Prisma models | **34** |
| مكونات واجهة | **~83 + 42 shadcn + 16 sovereign** |
| طرق API client | **172** |
| فجوات حرجة جديدة (ليست في MASTERPLAN) | **10** |
| ميزات تعمل لكن لم يُدرك أنها تعمل | **12** |

---

## 🔄 ترتيب التنفيذ المُحدَّث

بعد دمج الفجوات المكتشفة مع الخطة الأصلية:

**الدفعة صفر (الإصلاحات التي تمت فعلاً في الجلسات السابقة):**
- ✅ إصلاح مسارات النزاعات والعقود والإشعارات والمحفظة
- ✅ بناء APIs: خدمات، مدونة، CMS، قائمة انتظار، حالة الحجز، رسائل النزاعات
- ✅ تنظيف 33 ملف ميت + 8 ملفات API مكررة
- ✅ ربط أزرار التأمين والاشتراك والتواصل

**الدفعة الأولى (الفجوات 1-7 + ما بقي من المرحلة 1):**
1. Verification API (الفجوة 2) — الصفحة جاهزة، فقط API مطلوب
2. Product CRUD API (الفجوة 5) — الأهم للبائعين
3. Bundle Booking API (الفجوة 3) — 3 ملفات فقط
4. Admin Users API (الفجوة 6) — صفحة جاهزة
5. Marketplace listing type (الفجوة 1) — إضافة حقل واحد
6. Sitemap fix (الفجوة 9) — تحديث ملف واحد
7. إخفاء صفحات الإدارة غير المناسبة (الفجوة 10)

**الدفعة الثانية (الفجوات 4, 7, 8):**
1. Vendor Dashboard API (الفجوة 4)
2. Branch API أو إزالة (الفجوة 7)
3. Real-time notifications (الفجوة 8) — WebSocket mini-service

**الدفعة الثالثة (الفجوة 12 + المراحل 4-6):**
1. Multi-language (الفجوة 12)
2. لوحة التحكم الكاملة (المرحلة 4)
3. ميزات متقدمة (المرحلة 6)

---

*هذا الملحق مبني على تنقيب عميق في 2870 سطر من المحادثة الأصلية مع GLM، و34 نموذج Prisma، و172 طريقة API، و83 صفحة، و70 API route. كل فجوة موثقة بملفها وموقعها في الكود.*