# المرحلة 2 — نظام الثقة والأمان الشامل
## STANDARD.Rent — Production Readiness Plan

> **المدة التقديرية**: 6 أسابيع
> **المرجع**: نماذج Prisma (User.trustScore, IdentityVerification, VerificationVote, SocialVouch, Dispute)
> **الهدف**: نظام الثقة هو القيمة الأساسية لـ STANDARD.Rent — ما يميزه عن كل المنصات الأخرى

---

## فلسفة نظام الثقة

> **المشكلة في السوق الجزائري**: عدم الثقة هو العائق الأول. المستأجر يخاف ألّا يُسترجَع مبلغ الوديعة. المؤجر يخاف أن يُتلف المنتج. الوسيط (إن وُجد) مجهول ولا يتحمل مسؤولية.
>
> **حل STANDARD.Rent**: طبقات ثقة متعددة — كل طبقة تُضيف مستوى من الحماية.

```
┌─────────────────────────────────────────────────┐
│                 نظام الثقة الشامل                │
├─────────────────────────────────────────────────┤
│                                                   │
│  الطبقة 5: التأمين (Insurance)                    │
│  ┌─────────────────────────────────────────┐     │
│  │  الطبقة 4: العقود الرقمية (Contracts)    │     │
│  │  ┌───────────────────────────────────┐   │     │
│  │  │  الطبقة 3: Escrow (الحجز الآمن)    │   │     │
│  │  │  ┌─────────────────────────────┐  │   │     │
│  │  │  │  الطبقة 2: التوثيق (KYC)     │  │   │     │
│  │  │  │  ┌───────────────────────┐  │  │   │     │
│  │  │  │  │  الطبقة 1: التقييم    │  │  │   │     │
│  │  │  │  │  والتصويت المجتمعي   │  │  │   │     │
│  │  │  │  └───────────────────────┘  │  │   │     │
│  │  │  └─────────────────────────────┘  │   │     │
│  │  └───────────────────────────────────┘   │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  ⊕ Trust Score: خوارزمية تصنيف شاملة            │
└─────────────────────────────────────────────────┘
```

---

## 2.1 Trust Score — خوارزمية درجة الثقة

### 2.1.1 المكونات المقترحة

| المكون | الوزن | المصدر | الحساب |
|---|---|---|---|
| التوثيق (KYC) | 30% | `User.isVerified` | مُتحقق = 30 نقطة |
| السجل القضائي | 15% | فحص خارجي | نظيف = 15 نقطة |
| تقييمات إيجابية | 25% | `Review.rating` (avg × count) | min(25, avg × 5 × log(count+1)) |
| النزاعات الخاسرة | -10% | `Dispute.status = 'closed'` | كل نزاع = -5 نقاط (max -30) |
| الودائع المحتجزة | -10% | `Payment.escrowStatus = 'refunded'` | كل إرجاع = -3 نقاط |
| العمر والحجز | 5% | `User.createdAt` | +5 بعد 6 أشهر |
| التصويت المجتمعي | 15% | `SocialVouch` count | min(15, vouches × 3) |

### 2.1.2 مستويات الثقة

| النطاق | المستوى | اللون | المزايا |
|---|---|---|---|
| 0-20 | غير موثوق | 🔴 أحمر | لا يمكنه استئجار/تأجير بدون تأمين إجباري |
| 21-40 | مبتدئ | 🟡 أصفر | حجز محدود (3 في نفس الوقت) |
| 41-60 | موثوق | 🟢 أخضر | حجز عادي + عرض في نتائج البحث أولاً |
| 61-80 | موثوق بدرجة عالية | 🟢 أخضر + ✨ | عمولة أقل + badge خاص |
| 81-100 | موثوق تمامًا | 🟢 أخضر + 🏆 | عمولة أقل كثيرًا + دعم مُفضّل |

### 2.1.3 تنفيذ الخوارزمية

```typescript
// lib/trust-score.ts
export function calculateTrustScore(user: {
  isVerified: boolean;
  createdAt: Date;
  reviews: { rating: number }[];
  disputes: { status: string }[];
  payments: { escrowStatus: string }[];
  receivedVouches: unknown[];
  judicialRecordClean: boolean;
}): number {
  let score = 0;

  // 1. KYC (30%)
  if (user.isVerified) score += 30;

  // 2. Judicial record (15%)
  if (user.judicialRecordClean) score += 15;

  // 3. Reviews (25%)
  if (user.reviews.length > 0) {
    const avg = user.reviews.reduce((s, r) => s + r.rating, 0) / user.reviews.length;
    score += Math.min(25, avg * 5 * Math.log10(user.reviews.length + 1));
  }

  // 4. Lost disputes (-10%)
  const lostDisputes = user.disputes.filter(d => d.status === 'closed').length;
  score -= Math.min(30, lostDisputes * 5);

  // 5. Refunded escrows (-10%)
  const refunded = user.payments.filter(p => p.escrowStatus === 'refunded').length;
  score -= Math.min(30, refunded * 3);

  // 6. Account age (5%)
  const months = (Date.now() - user.createdAt.getTime()) / (30 * 24 * 60 * 60 * 1000);
  if (months >= 6) score += 5;

  // 7. Community vouches (15%)
  score += Math.min(15, user.receivedVouches.length * 3);

  return Math.max(0, Math.min(100, Math.round(score)));
}
```

### 2.1.4 متى تُحدَّث؟

- **فوريًا**: عند إكمال توثيق، عند تقديم تقييم، عند فحص سجل قضائي
- **مُجدوَل**: Cron job كل ساعة لإعادة حساب درجات المستخدمين النشطين
- **عند الطلب**: عند عرض ملف تعريفي (lazy recalculation)

---

## 2.2 نظام التوثيق (KYC)

### 2.2.1 الوضع الحالي

```
app/verification/page.tsx — صفحة التوثيق (1,532 سطر → مُقلَّص إلى 351 سطر)
app/verification/_components/camera-stage.tsx — التقاط الصورة
app/verification/_components/use-verification.ts — منطق التوثيق
app/api/verification/submit/route.ts — تقديم طلب التوثيق
app/api/verification/status/route.ts — حالة التوثيق
app/api/verification/vote/route.ts — التصويت المجتمعي
app/api/verification/pending/route.ts — الطلبات المعلقة
```

### 2.2.2 مراحل التوثيق المطلوبة

```
المرحلة 1: التقاط صورة الوجه (Camera)
    ↓
المرحلة 2: تحليل AI (VLM)
    ├─→ ai_approved → المرحلة 3
    └─→ ai_rejected → رفض مع السبب
    ↓
المرحلة 3: مراجعة مجتمعية (5 أصوات)
    ├─→ 5+ approve → verified
    ├─→ 3+ reject → rejected
    └─→ لم يكتمل → يبقى في community_review
    ↓
المرحلة 4: موافقة إدارية (اختياري للحالات الحدودية)
```

### 2.2.3 تكامل VLM الحقيقي

```typescript
// app/api/verification/submit/route.ts — تحسين
async function analyzeFace(base64Image: string): Promise<{
  approved: boolean;
  score: number;
  analysis: string;
}> {
  // استخدم VLM skill لتحليل صورة الوجه
  // الفحوصات:
  // 1. هل يوجد وجه في الصورة؟
  // 2. هل الوجه واضح (not blurry)?
  // 3. هل الإضاءة كافية؟
  // 4. هل يوجد أكثر من وجه؟ (يجب أن يكون وجه واحد)
  // 5. هل الصورة حقيقية (not a photo of a photo)?
}
```

### 2.2.4 فحص السجل القضائي (الجزائر)

> **ملاحظة واقعية**: لا يوجد API رسمي مفتوح لفحص السجل القضائي الجزائري.

**البدائل المقترحة**:

| الطريقة | الموثوقية | التكلفة | التنفيذ |
|---|---|---|---|
| رفع وثيقة السجل القضائي (PDF) | متوسطة | مجاني | المستخدم يرفع PDF + موظف يتحقق يدويًا |
| تكامل مع محامي/مكتب | عالية | مدفوعة | API خاص بين STANDARD.Rent والمكتب |
| طلب رسمي للعدلية | عالية جدًا | بطيء | لا يمكن أتمتته بالكامل |
| **Skip للمرحلة الأولى** | — | — | ابدأ بالتقييمات والتصويت المجتمعي فقط |

**التوصية للمرحلة الأولى**: ابدأ بـ KYC بالوجه + التصويت المجتمعي. أضف السجل القضائي لاحقًا عند التمكن من تكامل رسمي.

---

## 2.3 نظام Escrow (الحجز الآمن)

### 2.3.1 تدفق Escrow

```
المستأجر يدفع
    ↓
Payment.escrowStatus = 'held' (محتجز في حساب المنصة)
    ↓
المؤجر يُسلّم المنتج
    ↓
المستأجر يؤكد الاستلام
    ↓
Payment.escrowStatus = 'released' (يُحوَّل للمؤجر - ناقص العمولة)
```

### 2.3.2 حالات Escrow في النظام الحالي

```prisma
model Payment {
  escrowStatus String? // none, held, released, refunded
}

model Booking {
  escrowStatus String // none, held, released, refunded
}
```

### 2.3.3 ما يجب تنفيذه

1. **عند إنشاء الدفع**: `escrowStatus = 'held'`
2. **عند تأكيد الاستلام من المستأجر**:
   - تحديث `Payment.escrowStatus = 'released'`
   - تحديث `Booking.escrowStatus = 'released'`
   - إضافة `Transaction` للمؤجر (INCOME)
   - إضافة `Transaction` لـ STANDARD.Rent (عمولة)
3. **عند إلغاء/نزاع**:
   - تحديث `escrowStatus = 'refunded'`
   - إضافة `Transaction` للمستأجر (REFUND)
4. **آليًا بعد 48 ساعة من نهاية الحجز** (إذا لم يؤكد المستأجر):
   - إرسال إشعار تذكير
   - بعد 24 ساعة إضافية: تحرير تلقائي

### 2.3.4 API Endpoint مطلوب

```
POST /api/payments/escrow/release
  Body: { bookingId: string }
  المنطق: تحرير Escrow + تحويل للمؤجر + خصم العمولة

POST /api/payments/escrow/refund
  Body: { bookingId: string, reason: string }
  المنطق: إرجاع المبلغ للمستأجر

POST /api/payments/escrow/auto-release (cron)
  المنطق: فحص الحجوزات المنتهية ولم تُحرَّر
```

---

## 2.4 العقود الرقمية

### 2.4.1 الوضع الحالي

```prisma
model Contract {
  status         String // draft, signed, finalized, expired
  contractHash   String? // SHA-256 hash
  parties        String  // JSON array
  renterSignature String?
  signedAt       DateTime?
  snapshot       String? // JSON — snapshot of booking data at signing
}
```

### 2.4.2 تدفق العقد الكامل

```
الحجز يُؤكَّد
    ↓
إنشاء عقد تلقائي (status: 'draft')
  - parties: [renter, vendor, platform]
  - terms: شروط الإيجار + شروط الإرجاع + شروط الضمان
  - snapshot: نسخة من بيانات الحجز (منتج، سعر، تواريخ)
  - contractHash: SHA-256(all terms + snapshot)
    ↓
إرسال إشعار للمستأجر: "وقّع العقد الرقمي"
    ↓
المستأجر يوقّع (click/button)
  - renterSignature = HMAC(userSessionToken, contractHash)
  - signedAt = now()
  - status = 'signed'
    ↓
إرسال إشعار للمؤجر: "تم توقيع العقد"
    ↓
بعد نهاية الحجز + تأكيد الاستلام
  - status = 'finalized'
    ↓
العقد محفوظ بشكل ثابت (immutable)
```

### 2.4.3 محتوى العقد (بالعربية)

```typescript
const contractTerms = {
  title: 'عقد إيجار رقمي — STANDARD.Rent',
  sections: [
    {
      title: 'بيانات الأطراف',
      content: 'المؤجر: [vendor name] — المستأجر: [user name]'
    },
    {
      title: 'المنتج المؤجر',
      content: '[product name] — [description] — [serial/identifier]'
    },
    {
      title: 'مدة الإيجار',
      content: 'من [start date] إلى [end date] — [total days] يوم'
    },
    {
      title: 'التكلفة',
      content: 'الإيجار اليومي: [price] DZD — الإجمالي: [total] DZD — الوديعة: [deposit] DZD'
    },
    {
      title: 'شروط الاستخدام',
      content: 'يتعهد المستأجر باستخدام المنتج وفقًا للغرض المحدد...'
    },
    {
      title: 'شروط الإرجاع',
      content: 'يُرجَع المنتج في نفس الحالة...'
    },
    {
      title: 'حالة الضمان',
      content: 'إذا تم شراء تأمين...'
    },
    {
      title: 'حل النزاعات',
      content: 'في حالة نزاع، يُلجأ لنظام النزاعات في STANDARD.Rent...'
    },
    {
      title: 'التوقيع الرقمي',
      content: 'بتوقيع هذا العقد، يوافق الطرفان على جميع الشروط المذكورة أعلاه.'
    }
  ]
};
```

---

## 2.5 نظام النزاعات

### 2.5.1 الوضع الحالي

```
API Routes:
  POST /api/disputes/create — إنشاء نزاع
  GET  /api/disputes — قائمة النزاعات
  GET  /api/disputes/[id] — ❌ مفقود
  POST /api/disputes/[id]/messages — ❌ مفقود
  POST /api/disputes/[id]/appeal — استئناف
  GET  /api/disputes/[id]/history — سجل التغييرات

الصفحات:
  /disputes — قائمة النزاعات
  /disputes/[id] — تفاصيل النزاع
  /disputes/[id]/appeal — صفحة الاستئناف
  /dashboard/disputes — نزاعاتي
  /dashboard/disputes/[id] — تفاصيل نزاعي
```

### 2.5.2 تدفق النزاع الكامل

```
تقديم النزاع
  → status: 'filed'
  → يُنشأ تلقائيًا Escrow hold على المبلغ (إذا لم يكن محتجزًا)
    ↓
مراجعة أولية (AI أو موظف)
  → status: 'under_review'
  → AI يحلل الأدلة ويقترح حلاً
    ↓
الوساطة
  → status: 'mediation'
  → تبادل الرسائل بين الطرفين
  → عرض حل مقترح
    ↓
├─→ حل ودي (موافقة الطرفين)
│    → status: 'resolved'
│    → تحرير/إرجاع Escrow حسب الاتفاق
│
├─→ استئناف
│    → status: 'appealed'
│    → مراجعة من إدارة أعلى
│    → القرار نهائي
│    → status: 'closed'
│
└─→ إغلاق (عدم استجابة)
     → status: 'closed'
     → Escrow يُحرَّر للمؤجر (افتراضيًا)
```

### 2.5.3 AI Dispute Assistant

```typescript
// التحقق الموجود في المشروع:
// components/disputes/AIDisputeAssistant.tsx
// app/api/disputes/create/route.ts (يستخدم AI لتحليل النزاع)

// المطلوب إكماله:
// 1. تحليل الأدلة المرفقة (صور) باستخدام VLM
// 2. مقارنة حالة المنتج قبل وبعد الإيجار
// 3. اقتراح حل عادل بناءً على:
//    - نوع النزاع (تلف، عدم تسليم، جودة...)
//    - قيمة المنتج
//    - تاريخ الطرفين (trust scores)
//    - سابقات النزاعات المشابهة
```

---

## 2.6 نظام الإرجاع (Returns)

### 2.6.1 الوضع الحالي

```
API:
  POST /api/returns/create — إنشاء طلب إرجاع
  GET  /api/returns — قائمة طلبات الإرجاع

الصفحات:
  /returns — صفحة الإرجاع

النموذج:
  ReturnRequest { status: pending, approved, rejected, completed }
```

### 2.6.2 تدفق الإرجاع المطلوب

```
المستأجر يطلب إرجاع
  → status: 'pending'
  → سبب: تلف، عدم مطابقة، تغيير رأي
    ↓
فحص حالة المنتج (صور + AI analysis)
    ↓
├─→ مقبول → status: 'approved'
│    → إرجاع الوديعة للمستأجر
│    → خصم تكلفة الإصلاح (إن وُجدت) من المؤجر
│    → تحديث trust scores
│    → status: 'completed'
│
└─→ مرفوض → status: 'rejected'
     → إرسال سبب الرفض
     → يمكن الاستئناف عبر نظام النزاعات
```

---

## 2.7 نظام الضمان (Insurance)

### 2.7.1 الوضع الحالي

```
API:
  GET  /api/insurance — قائمة خطط التأمين
  POST /api/insurance/purchase — شراء تأمين

النموذج:
  InsurancePlan { nameAr, nameEn, price, coverageAr, coverageEn }

الصفحات:
  /insurance — صفحة التأمين
  components/insurance-selector.tsx — اختيار خطة التأمين
```

### 2.7.2 ما يجب إكماله

1. **ربط التأمين بالحجز**: `Booking.hasInsurance` موجود لكن لا يتم تحديثه
2. **حساب سعر التأمين**: نسبة من قيمة المنتج (مثلاً 5-10%)
3. **شروط التغطية**: واضحة ومحددة لكل خطة
4. **تقديم مطالبة تأمين**: ربط مع نظام النزاعات/الإرجاع

### 2.7.3 خطط التأمين المقترحة

| الخطة | السعر | التغطية | المناسبة |
|---|---|---|---|
| أساسي | 3% من الإيجار | سرقة فقط | منتجات رخيصة |
| متوسط | 7% من الإيجار | سرقة + تلف عرضي | أغلب المنتجات |
| شامل | 12% من الإيجار | سرقة + تلف + مسؤولية طرف ثالث | سيارات + إلكترونيات |

---

## 2.8 التصويت المجتمعي (Social Vouch)

### 2.8.1 الوضع الحالي

```prisma
model SocialVouch {
  senderId   String
  receiverId String
  @@unique([senderId, receiverId]) // تصويت واحد لكل شخص
}

API:
  POST /api/social/vouch/[userId] — تقديم/إزالة تصويت
  GET  /api/social/score/[userId] — درجة الثقة الاجتماعية
```

### 2.8.2 القواعد المطلوبة

1. **فقط المستخدمون المُتحقَّقون يمكنهم التصويت** (isVerified = true)
2. **لا يمكن التصويت لنفسك**
3. **لا يمكن التصويت مرتين لنفس الشخص** (موجود via unique constraint)
4. **الحد الأقصى**: 20 تصويت مستلم (لمنع التلاعب)
5. **تقارب الأصدقاء**: لا يمكن التصويت لمن تشارك معه نفس العنوان IP

---

## 2.9 الإشعارات في الوقت الفعلي

### 2.9.1 الوضع الحالي

```
mini-services/notifications-service/index.ts — Socket.IO server على port 3004
components/notifications/realtime-notifications.tsx — WebSocket client

المشكلة: notifications-service يثق بالـ userId من العميل! (security issue)
```

### 2.9.2 الإصلاح الأمني المطلوب

```typescript
// ❌ الحالي: العميل يرسل userId
socket.on('join', (userId) => {
  socket.join(`user-${userId}`);
});

// ✅ المطلوب: التحقق من الـ session token
socket.on('authenticate', async (token) => {
  const session = await validateSession(token);
  if (!session) {
    socket.disconnect();
    return;
  }
  socket.data.userId = session.userId;
  socket.join(`user-${session.userId}`);
});
```

### 2.9.3 أحداث الإشعارات المطلوبة

| الحدث | المشغل | المستلم |
|---|---|---|
| `booking.confirmed` | تأكيد حجز | المستأجر |
| `booking.cancelled` | إلغاء حجز | المؤجر + المستأجر |
| `booking.completed` | انتهاء حجز | المؤجر + المستأجر |
| `payment.received` | استلام دفع | المؤجر |
| `escrow.released` | تحرير escrow | المؤجر |
| `escrow.refunded` | إرجاع escrow | المستأجر |
| `dispute.filed` | تقديم نزاع | الطرف الآخر |
| `dispute.message` | رسالة في نزاع | كلا الطرفين |
| `dispute.resolved` | حل نزاع | كلا الطرفين |
| `verification.approved` | توثيق مُقبول | المستخدم |
| `review.new` | تقييم جديد | المؤجر |
| `return.approved` | قبول إرجاع | المستأجر |
| `contract.signed` | توقيع عقد | المؤجر |

---

## 2.10 قائمة المهام — المرحلة 2

```
[ ] تنفيذ خوارزمية trust-score (lib/trust-score.ts)
[ ] إنشاء cron job لتحديث درجات الثقة
[ ] عرض درجة الثقة على كل ملف تعريفي
[ ] إصلاح authentication في notifications-service
[ ] إصلاح مسارات API المكسورة (disputes, contracts)
[ ] إنشاء API routes مفقودة (disputes/[id], disputes/[id]/messages)
[ ] تكامل VLM حقيقي لتحليل الوجه في KYC
[ ] تنفيذ نظام Escrow الكامل (hold → release → refund)
[ ] إنشاء عقود رقمية تلقائية عند تأكيد الحجز
[ ] تنفيذ تدفق النزاعات الكامل مع AI
[ ] ربط التأمين بالحجوزات
[ ] إضافة قواعد التصويت المجتمعي
[ ] إصلاح إشعارات WebSocket (13 حدث)
[ ] إضافة ألوان ومستويات الثقة في UI
[ ] تنفيذ تدفق الإرجاع الكامل
```

---

> **المرحلة التالية**: `04-PAYMENT-LEGAL-ALGERIA.md` — التكاملات المالية الحقيقية.