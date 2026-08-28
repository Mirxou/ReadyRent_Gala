# خطة التنفيذ المُحكَمة — من أين نبدأ؟
## STANDARD.Rent — مع تحليل خارجي + بحث فعلي + 8 مصادر

> **تاريخ التحديث**: يوليو 2025
> **المنهجية**: البحث الفعلي عبر web-search + page_reader على 8 مصادر خارجية
> **القاعدة الذهبية**: لا سطر كود حتى نفهم أولاً

---

## اكتشافات البحث التي تغيرت كل الأولويات

### 🔥 الاكتشاف #1: Chargily Pay يُبسّط كل شيء

| البند | الخطة الأصلية (04-PAYMENT) | الواقع بعد البحث |
|---|---|---|
| تكامل CIB | تسجيل مباشر في SATIM (6 أسابيع) | **Chargily يُغلّف CIB تلقائيًا** |
| تكامل Edahabia | تسجيل منفصل في Algérie Postale | **Chargily يُغلّف Edahabia أيضًا** |
| SDK | بناء من الصفر | **`chargily-pay-javascript` — TS SDK جاهز** |
| التكلفة | رسوم تسجيل + شهادة SSL | **مجاني 100% — لا اشتراك، لا رسوم خفية** |
| التوثيق | SATIM docs (محدودة) | **dev.chargily.com — توثيق كامل** |
| المدة التقديرية | 6-8 أسابيع | **3-5 أيام** |

**المصدر**: chargily.com, dev.chargily.com, github.com/Chargily/chargily-pay-javascript, state-of-algeria.dev

**النتيجة**: بدلاً من تكاملين منفصلين (SATIM + Algérie Postale)، نستخدم **Chargily كتكامل واحد** يُغطي CIB + Edahabia.

---

### 🔥 الاكتشاف #2: SATIM المباشر بطيء جدًا (لا نبدأ به)

- SATIM لديه **510 عميل مُعتمد فقط** حتى مايو 2024 (حسب cibweb.dz)
- العدد يزداد ببطء شديد (ربما 100 عميل/سنة)
- **لا ننتظر موافقة SATIM** — نستخدم Chargily كبوابة وسيطة
- يمكن الانتقال لـ SATIM المباشر لاحقًا عند الحاجة (للتحكم الكامل + تكلفة أقل)

**المصدر**: state-of-algeria.dev (دراسة استقصائية 2024)

---

### 🔥 الاكتشاف #3: القانون 18-05 يُلزم بنطاق جزائري

> "All e-commerce activities must be registered with the national commerce registry, and any website must use an Algerian domain (e.g. '.com.dz')."

- **يجب** استخدام `.dz` أو `.com.dz` — ليس `.com` فقط
- **يجب** عرض: الاسم التجاري الكامل، العنوان، NIF، رقم RC
- **يجب** الأسعار بالدينار (DZD)
- **يجب** الإعلان المسبق لدى وزارة التجارة

**المصدر**: dig.watch (نص القانون 18-05)، dzbuild.com، digitalpolicyalert.org

---

### 🔥 الاكتشاف #4: أفضل ممارسات MVP لمنصة إيجار

من 4 مصادر مستقلة (LinkedIn, Aalpha, Indent Technologies, Ulan Software):

1. **"Trust is non-negotiable"** — لكن يمكن أن يكون بسيطًا في MVP:
   - تقييمات أساسية (موجود ✅)
   - تحقق بسيط من الهوية (التقاط صورة — موجود ✅)
   - سياسات واضحة (موجود ⚠️ يحتاج مراجعة)
   - **Escrow يمكن أن يكون يدويًا في MVP!**

2. **"Escrow can be manual at MVP stage"** — لا تحتاج أتمتة كاملة من اليوم 1:
   - المرحلة 1: حجز المبلغ في المحفظة (يدوي عند الإلغاء)
   - المرحلة 2: أتمتة الإطلاق بعد 48 ساعة
   - المرحلة 3: أتمتة كاملة مع rules engine

3. **"Focus on must-have features"** — لا تبني 73 صفحة قبل الإطلاق:
   - المستخدم يحتاج: تصفح ← حجز ← دفع ← استلام ← تقييم
   - المورد يحتاج: إضافة منتج ← عرض حجوزات ← استلام المال

---

### الاكتشاف #5: بوابات دفع جزائرية أخرى (بديلات)

| البوابة | الدعم | الملاحظة |
|---|---|---|
| **Chargily Pay** ⭐ | CIB + Edahabia | **الأفضل للبداية** — مجاني، SDK TS، توثيق جيد |
| MR ePay | CIB + Edahabia | بديل جيد — mrpaygo.com |
| SlickPay | CIB + Edahabia | ثالث أكثر استخدامًا |
| Guidini | CIB | متخصص في المدفوعات |
| SATIM مباشر | CIB + Edahabia | الأكثر انتشارًا لكن الأبطأ للتصريح |

**المصدر**: state-of-algeria.dev (استطلاع 2024 — 400+ مطور جزائري)

---

## الخطة المُعدَّلة: من أين نبدأ فعلاً؟

### المنهجية: "الحد الأدنى الحيّ"

بدلاً من 6 مراحل متسلسلة (21 أسبوعًا في الخطة الأصلية)، نُعيد الترتيب حول **3 موجات**:

```
موجة 1: الأساس الحيّ (2-3 أسابيع)
  → النتيجة: منصة يمكن لشخصين إتمام معاملة حقيقية

موجة 2: الثقة والأمان (2-3 أسابيع)  
  → النتيجة: المعاملة آمنة ومحمية

موجة 3: النشر والمراقبة (1-2 أسابيع)
  → النتيجة: المنصة عامة ومُراقَبة
```

---

## 🟢 موجة 1: الأساس الحيّ (2-3 أسابيع)
### "يجب أن يعمل مسار واحد كامل من البداية للنهاية"

### لماذا هذه الموجة أولاً؟

> كل الـ 73 صفحة والـ 95 API لا قيمة لها إذا لم يستطع مستأجر واحد دفع ثمن إيجار حقيقي ويستلم المنتج. هذا هو "The Happy Path".

---

### الخطوة 1.1: تنظيف الديون التقنية (يوم واحد)

**لماذا أولاً؟** لأن الكود الميت والملفات المكررة تُبطئ البناء والنشر.

```
المهمة:
[ ] حذف src/features/ المكررة (6 ملفات)
[ ] حذف public/public/ المكررة
[ ] حذف الملفات الميتة (30+ ملف من 10-TECHNICAL-DEBT.md)
[ ] نقل lib/api.ts → lib/api/*.ts ثم حذفه
[ ] إصلاح 6 مسارات API المكسورة (MASTERPLAN 1.1-1.6)
```

**الأثر المباشر**: تقليل حجم المشروع بـ ~15%، تسريع البناء، إزالة التشتت.

---

### الخطوة 1.2: إصلاح 4 صفحات حرجة (يوم واحد)

الصفحات الـ 4 التي تُشكّل المسار الأساسي:

| الصفحة | ما يجب إصلاحه | السبب |
|---|---|---|
| `/products` | API paths + فلاتر تعمل | المستخدم يجب أن يجد منتج |
| `/products/[id]` | تفاصيل حقيقية + تقييمات | المستخدم يجب أن يقرأ عن المنتج |
| `/cart` + `/checkout` | إزالة bank-card-form، إعداد Chargily | المسار الحيّ إلى الدفع |
| `/bookings/[id]` | عرض حالة حقيقية | المستخدم يجب أن يرى حجزه |

---

### الخطوة 1.3: Chargily Pay — التكامل (2-3 أيام) ⭐

**هذه هي الخطوة الأهم في كل الخطة.**

```
المهمة:
[ ] حساب Chargily (chargily.com — مجاني، سريع)
[ ] الحصول على API key من dev.chargily.com
[ ] تثبيت chargily-pay (npm/bun add chargily-pay)
[ ] إنشاء ChargilyPaymentProvider في lib/payment-provider.ts
[ ] ربط webhook: dev.chargily.com/pay-v2/webhooks
[ ] تحديث checkout page لاستخدام Chargily redirect
[ ] حذف bank-card-form.tsx من المسار الحقيقي
[ ] إزالة payment-security.ts (dead code)
```

**النتيجة**: في 2-3 أيام، STANDARD.Rent يقبل **CIB + Edahabia**. هاتين هما طريقتا الدفع الأوسع انتشارًا في الجزائر (17M+ بطاقة).

**ملاحظة**: Baridimob يمكن إضافته لاحقًا عبر Chargily أو مزود آخر.

---

### الخطوة 1.4: Escrow بسيط (يوم واحد) ⚖️ — مُحدَّث بالتحقيق الميداني + القانون الجزائري

**التحقيق الميداني أُنجز**: قراءة 20+ ملف في المشروع + بحث خارجي في القانون 18-05 و Chargily API.

#### ⚠️ القانون الجزائري — المادة 17 من القانون 18-05 (إلزامية وصل الاستلام):

> *"يجب على المورد الإلكتروني أن يطلب من المستهلك الإلكتروني توقيع وصل استلام عند التسليم الفعلي للمنتوج. لا يمكن المستهلك الإلكتروني أن يرفض توقيع وصل الاستلام. تسلم نسخة من وصل الاستلام وجوبا للمستهلك الإلكتروني."*

> **المصدر**: oraconstantine.com (نص القانون 18-05)، arpce.dz (النص الرسمي)

**الاستنتاج**: زر "تأكيد الاستلام" ليس ميزة اختيارية — هو **التزام قانوني**.

#### ⚠️ القانون الجزائري — المادة 22-23 (حق الاسترداد):
- تسليم متأخر ← المستهلك يُرجع في 4 أيام عمل ← المورد يُردّ المبلغ في 15 يوم
- منتج معيب ← المستهلك يُرجع في 4 أيام عمل ← المورد يُبدّل أو يُردّ المبلغ في 15 يوم

#### ⚠️ Chargily Pay لا يدعم الاسترداد البرمجي:
- تم فحص SDK: `ChargilyPayClient` لديه `expireCheckout()` فقط (إلغاء قبل الدفع)
- **لا يوجد `refund()`** — لا يمكن استرداد المبلغ برمجيًا بعد الدفع
- الاسترداد = تحويل بنكي يدوي من حساب المنصة إلى حساب العميل
- **المصدر**: `node_modules/@chargily/chargily-pay/lib/classes/client.d.ts` + dev.chargily.com

#### 🔍 نتائج التحقيق الميداني — الوضع الراهن:

| البند | الوضع | التفاصيل |
|---|---|---|
| Webhook يضع escrowStatus = 'held' | ✅ يعمل | `handlePaymentSuccess()` يُحدّث Booking + Payment |
| Transaction ESCROW_HELD عند الدفع | ✅ يعمل | webhook يُنشئ EXPENDITURE + ESCROW_HELD |
| زر "تأكيد الاستلام" | ❌ **غير موجود** | لا يوجد في صفحة الحجز ولا في لوحة التحكم |
| API تحرير الضمان (release) | ❌ **غير موجود** | لا يوجد `/api/bookings/[id]/release-escrow` |
| API استرداد الضمان (refund) | ❌ **غير موجود** | لا يوجد `/api/bookings/[id]/refund-escrow` |
| Transaction ESCROW_RELEASED | ❌ **غير مُنشأ أبدًا** | النوع موجود في Schema لكن لا كود يُنشئه |
| Transaction ESCROW_REFUNDED | ❌ **غير مُنشأ أبدًا** | نفس المشكلة |
| إشعار عند التحرير/الاسترداد | ❌ **غير موجود** | لا notifications لهذه الحالات |
| تحديث حالة الحجز عند التأكيد | ❌ **غير موجود** | لا transition: active→completed عند التأكيد |

#### 🐛 مشاكل إضافية مُكتشفة (تُصلح ضمن 1.4):

| # | الشدة | الملف | المشكلة |
|---|---|---|---|
| B1 | 🔴 حرج | `app/bookings/[id]/page.tsx:28-33` | `BookingDetail.id: number` لكن Prisma تستخدم `String (cuid())` — كل الحقول خاطئة |
| B2 | 🔴 حرج | `app/bookings/[id]/page.tsx:33` | `escrow_status: 'HELD'` (uppercase) لكن DB تُستخدم `'held'` (lowercase) — الخريطة معكوسة |
| B3 | 🔴 حرج | `app/bookings/[id]/route.ts:207` | PATCH يسمح بتعديل `escrow_status` مباشرة بدون منطق (ثغرة أمان) |
| B4 | 🟡 متوسط | `app/api/bookings/[id]/cancel/route.ts` | الإلغاء لا يُحدّث `booking.escrowStatus` ولا `payment.escrowStatus` — يبقى 'held' بعد الإلغاء |
| B5 | 🟡 متوسط | `app/api/bookings/[id]/cancel/route.ts:111-113` | الاسترداد يذهب لـ `walletBalance` لكن المال الفعلي في Chargily (لا يمكن استرداده برمجيًا) |
| B6 | 🟡 متوسط | `components/wallet/wallet-dashboard.tsx` | يستخدم "SAR" و "ريال سعودي" بدل "DA" و "دج" — بيانات وهمية بالكامل |
| B7 | 🟡 متوسط | `components/wallet/active-escrow-list.tsx:35` | يعرض `HELD` hardcoded بدل القيمة الحقيقية من DB |
| B8 | 🟠 خفيف | `components/BookingStatusCard.tsx` | كود ميت — غير مستورد في أي مكان |
| B9 | 🟠 خفيف | `lib/api/wallet.ts:25` | يستخدم `/payments/wallet/balance/` (غير موجود) بدل `/wallet` |
| B10 | 🟠 خفيف | `lib/api/bookings.ts:12-13` | `Booking.id: number` يجب أن يكون `string` |

#### 📋 خطة التنفيذ المُحدَّثة (مرتبة تنفيذيًا):

```
المجموعة A: البنية التحتية (Backend — 4 ملفات)
─────────────────────────────────────────────────────
[A1] إنشاء API: POST /api/bookings/[id]/release-escrow
     - التحقق: المستخدم مالك الحجز OR admin
     - التحقق: booking.escrowStatus === 'held' && booking.status === 'confirmed' أو 'active'
     - العمليات في transaction واحدة:
       1. booking.escrowStatus → 'released'
       2. booking.status → 'completed'
       3. payment.escrowStatus → 'released'
       4. transaction: ESCROW_RELEASED (للمستأجر — سجل)
       5. contract.status → 'finalized', isFinalized → true, contractHash (SHA-256)
       6. notification للمستأجر: "تم تحرير المبلغ للمؤجر"
       7. notification للمؤجر (product.vendorId): "تم تحرير مبلغ حجز #X — يرجى التواصل مع الإدارة لاستلامه"
     - ملاحظة: لا نُحوّل المال تلقائيًا (Chargily لا يدعم refund/transfer)
       المال يبقى في حساب المنصة حتى التحويل البنكي اليدوي

[A2] إنشاء API: POST /api/bookings/[id]/refund-escrow
     - التحقق: admin فقط (الاسترداد قرار إداري)
     - التحقق: booking.escrowStatus === 'held'
     - العمليات في transaction واحدة:
       1. booking.escrowStatus → 'refunded'
       2. booking.status → 'cancelled'
       3. payment.escrowStatus → 'refunded', payment.status → 'refunded'
       4. transaction: ESCROW_REFUNDED (للمستأجر)
       5. user.walletBalance += refundAmount (تسجيل في المحفظة الداخلية)
       6. notification: "تم استرداد المبلغ — سيتم التحويل البنكي خلال 48 ساعة"
     - ⚖️ القانون 18-05 مادة 22: الاسترداد خلال 15 يوم
       سنُضيف حقل `refundRequestedAt` و cron يُنبّه Admin عند تجاوز 15 يوم

[A3] إصلاح PATCH /api/bookings/[id] — حذف القدرة على تعديل escrow_status مباشرة
     - السطر 207: حذف `if (body.escrow_status !== undefined)` تمامًا
     - escrow يجب أن يتغير فقط عبر [A1] و [A2]

[A4] إصلاح POST /api/bookings/[id]/cancel — تحديث escrow عند الإلغاء
     - إضافة: booking.escrowStatus → 'refunded' (إذا كان 'held')
     - إضافة: payment.escrowStatus → 'refunded', payment.status → 'refunded'
     - إضافة: transaction: ESCROW_REFUNDED
     - إضافة: log التحذير أن المال الفعلي يحتاج تحويل بنكي يدوي

المجموعة B: الواجهة الأمامية (Frontend — 3 ملفات)
─────────────────────────────────────────────────────
[B1] إصلاح app/bookings/[id]/page.tsx:
     - تغيير interface: id: string (not number), كل الحقول من snake_case مطابقة للـ API
     - إزالة escrowStateMap المعكوسة (API يُرجع lowercase: 'held', 'released', 'refunded')
     - إضافة زر "تأكيد الاستلام" (يظهر فقط عندما:
       booking.status === 'confirmed' || booking.status === 'active'
       && booking.escrow_status === 'held'
       && isOwner)
     - الزر يُنفذ POST /api/bookings/[id]/release-escrow
     - إضافة حالة التحميل + تأكيد dialog
     - إضافة عرض حالة الضمان الحقيقية (held/released/refunded) مع أيقونات
     - استبدال `api.get` بـ `fetch('/api/bookings/${id}', {credentials:'include'})`

[B2] إصلاح EscrowTracker (features/finance/components/escrow-tracker.tsx):
     - عرض الحالة الحقيقية (held/released/refunded) بدل "محمي" دائمًا
     - إضافة ألوان مختلفة لكل حالة
     - إضافة زر الإجراء المناسب (تأكيد/لا شيء/تم التحرير)

[B3] تحديث لوحة الحجوزات (dashboard/bookings/page.tsx):
     - عرض حالة الضمان (Badge: محتجز/محرر/مسترد)
     - إضافة عمود/حقل لـ escrow_status
     - إصلاح `in_use` → `active` (القيمة الصحيحة في Prisma)

المجموعة C: إصلاحات ثانوية (2 ملفات)
─────────────────────────────────────────────────────
[C1] حذف components/BookingStatusCard.tsx (كود ميت)
[C2] إصلاح components/wallet/wallet-dashboard.tsx: SAR → DA, ريال سعودي → دينار جزائري
```

#### ⚖️ التزامات قانونية إضافية للخطوة 1.4:

| المادة | الالتزام | كيف نُلبيه |
|---|---|---|
| مادة 17 | وصل استلام إلزامي | زر "تأكيد الاستلام" = وصل استلام رقمي |
| مادة 22 | استرداد خلال 15 يوم | حقل `refundRequestedAt` + تنبيه Admin |
| مادة 20 | فاتورة لكل معاملة | webhook يُنشئ سجل Payment + Transaction (يُضاف إصدار فاتورة لاحقًا) |
| مادة 27 | دفع عبر منصات مرخصة | Chargily معتمد من بنك الجزائر ✅ |

#### معيار النجاح المُحدَّث:

> 1. المستأجر يرى زر "تأكيد الاستلام" على صفحة الحجز (عندما escrow = 'held')
> 2. النقر على الزر → Booking.escrowStatus = 'released' + Transaction ESCROW_RELEASED
> 3. Admin يستطيع استرداد الضمان عبر API مخصص
> 4. الإلغاء يُحدّث حالة الضمان بشكل صحيح
> 5. كل حالة تغيير تُنشئ Transaction + Notification
> 6. لا يمكن تعديل escrow_status مباشرة عبر PATCH

---

### الخطوة 1.5: بيئة الإنتاج الأساسية (2-3 أيام)

```
المهمة:
[ ] استئجار VPS (Hetzner CX22 — ~€4.5/شهر)
[ ] تهيئة: Ubuntu + Docker + Nginx + PostgreSQL + Redis
[ ] تبديل Prisma من SQLite إلى PostgreSQL
[ ] تشغيل المهاجرات
[ ] SSL (Let's Encrypt)
[ ] DNS: standardrent.dz → Cloudflare → Nginx
[ ] نشر Docker containers
[ ] تفعيل Resend (API key) للبريد الإلكتروني
[ ] تفعيل Cloudinary (API keys) للصور
```

---

### ✅ معيار نجاح الموجة 1

> **يستطيع شخصان (مؤجر + مستأجر) إتمام معاملة حقيقية كاملة:**
> 1. المؤجر يُنشئ منتجًا ويُرفع صوره
> 2. المستأجر يتصفح ويجد المنتج
> 3. يُضيفه للسلة ويُكمل الحجز
> 4. يدفع بـ CIB أو Edahabia عبر Chargily
> 5. المبلغ يُحتجز (escrow)
> 6. المؤجر يُسلّم المنتج
> 7. المستأجر يؤكد الاستلام
> 8. المبلغ يُحرر للمؤجر
> 9. يكتب تقييمًا

**إذا نجح هذا المسار — يمكنك الإطلاق لعدد محدود من المستخدمين.**

---

## 🟡 موجة 2: الثقة والأمان (2-3 أسابيع)
### "المعاملة يجب أن تكون آمنة ومحمية"

### لماذا بعد الموجة 1؟

> لأن الثقة بدون معاملة حقيقية لا قيمة لها. أولاً نتأكد أن المعاملة تعمل، ثم نحميها.

---

### الخطوة 2.1: أمان حرج (يوم واحد) 🔒

```
[ ] إصلاح WebSocket authentication (C3 — notifications-service)
[ ] HMAC verification في webhook (C2)
[ ] IDOR prevention في API routes (H1)
[ ] Rate limiting شامل (H2)
[ ] CSP + Security headers في Nginx (H4)
[ ] Account lockout بعد 10 محاولات فاشلة (M3)
[ ] Cookie SameSite=Strict (M4)
```

**المرجع**: 09-SECURITY-HARDENING.md — كل الثغرات مُوثقة مع كود الإصلاح.

---

### الخطوة 2.2: نظام الثقة الأساسي (3-5 أيام)

**لا نبني النظام الكامل (7 مكونات) من اليوم 1.** نبدأ بالأساس:

```
الحد الأدنى:
[ ] Trust Score بسيط: isVerified(+30) + avgRating(+25) + vouches(+15) = 70 نقطة
[ ] عرض Trust Score على ملف المستخدم والمورّد
[ ] ألوان الثقة (أحمر/أصفر/أخضر) على كل ملف تعريفي
[ ] لا نحتاج: السجل القضائي، Escrow optimization، algorithms معقدة
```

---

### الخطوة 2.3: النزاعات والإرجاع (3 أيام)

```
[ ] إنشاء API routes المفقودة (disputes/[id], disputes/[id]/messages)
[ ] إصلاح مسارات API المكسورة في lib/api.ts (بعد نقلها)
[ ] تدفق النزاع الأساسي: تقديم ← رسائل ← حل
[ ] لا نحتاج: AI Dispute Assistant، الاستئناف المعقد، الوساطة
```

---

### الخطوة 2.4: العقود والتوثيق (3 أيام)

```
[ ] عقد رقمي تلقائي عند تأكيد الحجز (draft → signed)
[ ] محتوى العقد بالعربية (7 أقسام — من 03-TRUST-SAFETY-SYSTEM.md)
[ ] contractHash (SHA-256) للعقد
[ ] التوثيق (KYC) يحتفظ بالحالة الحالية: صورة الوجه + مراجعة مجتمعية
[ ] لا نحتاج: VLM حقيقي (يمكن يدويًا لـ MVP)، السجل القضائي
```

---

### الخطوة 2.5: التأمين والاشتراكات (2 يوم)

```
[ ] ربط التأمين بالحجز (Booking.hasInsurance)
[ ] 3 خطط تأمين (أساسي/متوسط/شامل) مع TVA
[ ] الاشتراكات تعمل مع Chargily (اشتراك غير متكرر — يدوي لـ MVP)
[ ] لا نحتاج: دفع متكرر تلقائي (Chargily لا يدعمه بعد)
```

---

### ✅ معيار نجاح الموجة 2

> **المعاملة الآن محمية بـ 5 طبقات:**
> 1. Trust Score يُعرض على كل ملف
> 2. Escrow يحمي المال
> 3. عقد رقمي يُوثق الشروط
> 4. نظام نزاعات للطوارئ
> 5. تأمين اختياري

---

## 🔵 موجة 3: النشر والمراقبة (1-2 أسابيع)
### "المنصة عامة ومُراقَبة ومُحسَّنة"

---

### الخطوة 3.1: التسجيل القانوني (مُوازي مع الموجة 1-2)

**ملاحظة**: هذا يمكن أن يبدأ فورًا ويستمر بالتوازي.

```
[ ] حجز اسم تجاري من CNRC
[ ] فتح حساب بنكي (CCP أو تجاري)
[ ] حجز نطاق standardrent.dz من NIC.DZ
[ ] إيداع إعلان التجارة الإلكترونية (law 18-05)
[ ] تسجيل Chargily كبائع (أسرع من SATIM)
[ ] مراجعة شروط الاستخدام وسياسة الخصوصية قانونيًا
[ ] إضافة cookie consent banner
[ ] إضافة معلومات الشركة القانونية في الفوتر (NIF, RC)
```

---

### الخطوة 3.2: الامتثال والقانون (يوم واحد)

```
[ ] كل الأسعار شاملة TVA 19% (أو واضحة إن لم تكن)
[ ] إضافة lib/tax.ts لحساب TVA
[ ] عرض TVA في checkout
[ ] فاتورة/إيصال لكل دفع
[ ] حق الحذف (Right to be Forgotten) — API endpoint
```

---

### الخطوة 3.3: المراقبة (يوم واحد)

```
[ ] UptimeRobot (مجاني — ping /api/health كل 5 دقائق)
[ ] Sentry (مجاني — تتبع الأخطاء)
[ ] GA4 أو Plausible (تحليلات)
[ ] Backup يومي (cron + pg_dump)
[ ] Log rotation
```

---

### الخطوة 3.4: الاختبار (3-5 أيام)

```
[ ] اختبار المسار الحي يدويًا (الموجة 1)
[ ] اختبار الأمان (OWASP — من 09-SECURITY-HARDENING.md)
[ ] Lighthouse على 10 صفحات (هدف: 90+)
[ ] اختبار RTL على Chrome + Safari
[ ] اختبار Mobile (iPhone SE + iPhone 14)
[ ] لا نحتاج: اختبارات E2E مؤتمتة بالكامل (يدوي يكفي لـ MVP)
```

---

### الخطوة 3.5: الإطلاق المحدود (Soft Launch)

```
[ ] إطلاق لـ 20-50 مستخدم تجريبي (أصدقاء، عائلة، حرفيون)
[ ] مراقبة الأخطاء والأداء
[ ] جمع الملاحظات
[ ] إصلاح المشاكل الحرجة
[ ] الإطلاق العام بعد أسبوع من النجاح
```

---

## الملخص: ماذا نفعل ومتى؟

### الجدول الزمني الكامل

```
الأسبوع 1-2:        موجة 1 — الأساس الحيّ
  اليوم 1:          تنظيف الديون التقنية
  اليوم 2:          إصلاح 4 صفحات حرجة
  اليوم 3-5:        Chargily Pay تكامل
  اليوم 5:          Escrow بسيط
  اليوم 6-10:       بيئة الإنتاج (توازي مع التسجيل القانوني)

الأسبوع 3-4:        موجة 2 — الثقة والأمان
  اليوم 11:         أمان حرج (7 ثغرات)
  اليوم 12-14:      Trust Score أساسي
  اليوم 15-17:      النزاعات + العقود
  اليوم 18-19:      التأمين + الاشتراكات

الأسبوع 5-6:        موجة 3 — النشر والمراقبة
  اليوم 20:         الامتثال (TVA + cookie consent)
  اليوم 21:         المراقبة (UptimeRobot + Sentry)
  اليوم 22-24:      اختبار شامل
  اليوم 25:         Soft launch (20-50 مستخدم)
  اليوم 32:         🚀 الإطلاق العام!
```

---

### أول 10 أشياء تفعلها غدًا (بدون ترتيب):

```
1.  افتح حساب Chargily (chargily.com) — 5 دقائق
2.  افتح حساب Resend (resend.com) — 5 دقائق
3.  افتح حساب Cloudinary (cloudinary.com) — 5 دقائق
4.  افتح حساب Sentry (sentry.io) — 5 دقائق
5.  احجز نطاق standardrent.dz (nic.dz) — يوم واحد
6.  ابدأ إجراءات CNRC (التسجيل التجاري) — أسبوع واحد
7.  احذف الملفات الميتة (قائمة من 10-TECHNICAL-DEBT.md) — 2 ساعات
8.  أصلح 6 مسارات API المكسورة — 3 ساعات
9.  اقرأ توثيق Chargily API (dev.chargily.com/pay-v2/introduction) — ساعة
10. أنشئ ChargilyPaymentProvider — 4 ساعات
```

---

### ما لا نفعله (تأجيل):

| الميزة | لماذا لا الآن؟ | متى؟ |
|---|---|---|
| SATIM مباشر | بطيء (510 عميل فقط!) + Chargily يُغلّفه | بعد 1000+ معاملة/شهر |
| Baridimob | Chargily لا يدعمه + يحتاج مزود ثاني | بعد الإطلاق بشهر |
| Stripe | للدولي فقط — الجزائر لها CIB/Edahabia | عند التوسع الإقليمي |
| KYC بالذكاء الاصطناعي (VLM) | المراجعة المجتمعية تكفي لـ MVP | بعد 500+ مستخدم |
| السجل القضائي | لا يوجد API رسمي | بعد التسجيل القانوني + محامي |
| اختبارات E2E مؤتمتة | يدوي يكفي لـ MVP | بعد الإطلاق |
| تطبيق جوال | Web PWA يكفي | بعد 5000+ مستخدم نشط |
| نظام Escrow مؤتمت بالكامل | يدوي يكفي لـ MVP | بعد 100+ حجز/شهر |
| BaridiMob | يحتاج مزود منفصل | بعد الإطلاق |
| Google OAuth | البريد يكفي | بعد الإطلاق |

---

### المصادر المستخدمة في البحث

| المصدر | URL | ما استُخرج منه |
|---|---|---|
| Chargily | chargily.com | التسعير (مجاني)، المزايا، SDK |
| Chargily API Docs | dev.chargily.com | التوثيق التقني |
| Chargily GitHub | github.com/Chargily/chargily-pay-javascript | SDK TypeScript |
| State of Algeria | state-of-algeria.dev | ترتيب بوابات الدفع، SATIM stats |
| DZBuild | dzbuild.com | دليل التجار الجزائري، القانون 18-05 |
| Reddit r/algeria | reddit.com/r/algeria | تجارب مطورين واقعية |
| MR ePay | mrpaygo.com | بديل Chargily |
| DevCloud.dz | devcloud.dz | شريك Chargily الرسمي |
| digitalpolicyalert.org | digitalpolicyalert.org | نص قانون 18-05 |
| dig.watch | dig.watch | متطلبات النطاق الجزائري |
| LinkedIn | linkedin.com | أفضل ممارسات MVP marketplace |
| Indent Technologies | indenttechnologies.com | Trust + Escrow MVP strategy |
| Aalpha | aalpha.net | "Escrow can be manual at MVP" |
| Ulan Software | ulansoftware.com | Focus on must-have features |

---

> **هذه الخطة مبنية على بيانات حقيقية، لا تخمينات. كل توصية مدعومة بمصدر.**
> **الخطة الأصلية (00-10) تظل المرجع التفصيلي. هذا الملف هو خريطة الطريق المُحكَمة.**
