# المرحلة 3 — الدفع والامتثال المالي في الجزائر
## STANDARD.Rent — Production Readiness Plan

> **المدة التقديرية**: 4 أسابيع
> **المرجع**: `lib/payment-provider.ts`, `app/api/payments/*`, `components/payment/*`
> **الهدف**: كل معاملة مالية تتم بأمان وقانونية

---

## 3.1 مشهد الدفع الإلكتروني في الجزائر

### 3.1.1 الخيارات المتاحة

| الطريقة | الانتشار | التكلفة للبائع | الدعم التقني | الملاءمة |
|---|---|---|---|---|
| **CIB (Carte d'Identité Bancaire)** | ~10M بطاقة | 1-2% | SATIM API | ✅ **أساسي** |
| **Edahabia** | ~7M بطاقة | مجاني | Baridimob API | ✅ **أساسي** |
| **Baridimob (تحويل فوري)** | 6M+ مستخدم | مجاني (للمستخدم) | Algérie Postale API | ✅ **مهم** |
| **CCP (حوالة بريدية)** | تقليدي | مجاني | يدوي | ⚠️ بدائي |
| **Visa/Mastercard** | محدود (دولي) | 2-3% | Stripe | ✅ للسياح/مغتربين |
| **Apple Pay/Google Pay** | ناشئ | 2-3% | عبر CIB 3D Secure | ⚠️ مستقبلاً |

### 3.1.2 ما يجب دعمه عند الإطلاق

```
المرحلة 1 (الإطلاق):
  ✅ CIB (SATIM) — الأوسع انتشارًا
  ✅ Edahabia — الأسرع نموًا
  ⚠️ Baridimob — إضافته سريعًا

المرحلة 2 (بعد 3 أشهر):
  ✅ Visa/Mastercard عبر Stripe (للمغتربين)
  ✅ Apple Pay / Google Pay
```

---

## 3.2 التسجيل كبائع CIB/Edahabia

### 3.2.1 المتطلبات

1. **شركة مسجلة** (RC + NIF) — من المرحلة 0
2. **حساب بنكي تجاري** — من المرحلة 0
3. **التسجيل لدى SATIM** (Société Algérienne de Monétique):
   - زيارة الموقع: `www.satim.dz`
   - تقديم ملف التسجيل كتاجر إلكتروني (e-commerce)
   - الحصول على `TPE Virtuel` (Terminal de Paiement Electronique Virtuel)
   - Merchant ID + Certificate SSL
4. **اختبار البيئة التجريبية (Sandbox)**
5. **الانتقال للبيئة الحقيقية (Production)**

### 3.2.2 عملية التسجيل (تقديرية)

```
الأسبوع 1: تقديم الملف لـ SATIM
الأسبوع 2-3: مراجعة الملف والموافقة
الأسبوع 4: استلام بيانات الاختبار (Sandbox)
الأسبوع 5-6: التطوير والاختبار
الأسبوع 7: الانتقال للإنتاج
```

**التكلفة**: ~50,000 - 150,000 DZD (رسوم التسجيل + الشهادة السنوية)

---

## 3.3 تكامل CIB/Edahabia

### 3.3.1 البنية التقنية

```
STANDARD.Rent Backend
    ↓
طلب دفع إلى SATIM API
    ↓
SATIM يُعيد redirect URL
    ↓
المستخدم يُحوَّل لصفحة SATIM الآمنة
    ↓
المستخدم يدخل بيانات البطاقة
    ↓
SATIM يُعيد webhook إلى STANDARD.Rent
    ↓
التحقق من HMAC signature
    ↓
تحديث حالة الدفع في قاعدة البيانات
```

### 3.3.2 إعادة كتابة lib/payment-provider.ts

```typescript
interface CIBConfig {
  merchantId: string;
  merchantKey: string;      // HMAC key
  terminalId: string;
  environment: 'test' | 'production';
  baseUrl: string;          // SATIM endpoint
}

class CIBPaymentProvider implements PaymentProvider {
  private config: CIBConfig;

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    // 1. إنشاء طلب دفع عند SATIM
    // 2. توقيع الطلب بـ HMAC-SHA256
    // 3. حفظ Payment record في DB (status: 'pending', escrowStatus: 'none')
    // 4. إرجاع redirect URL
  }

  async verifyPayment(transactionId: string, signature: string): Promise<PaymentVerifyResult> {
    // 1. التحقق من HMAC signature
    // 2. التحقق من المبلغ (لا يتم التلاعب بالسعر)
    // 3. تحديث Payment status → 'completed'
    // 4. تحديث Booking status → 'confirmed'
    // 5. تحديث Payment escrowStatus → 'held'
    // 6. إنشاء عقد رقمي
    // 7. إرسال إشعارات
  }
}
```

### 3.3.3 الأمان الحاسم

```
⚠️ لا تخزن أرقام البطاقات أبداً — SATIM يتعامل مع ذلك
⚠️ تحقق دائمًا من HMAC في webhook — منع التلاعب بالحالة
⚠️ تحقق من المبلغ — منع هجوم Price Manipulation
⚠️ استخدم HTTPS فقط — لا تنقل بيانات دفع عبر HTTP
⚠️ سجّل كل عملية دفع في ActivityLog — للتدقيق
```

### 3.3.4 إصلاح PCI-DSS

**المشكلة المُوثَّقة**: `components/payment/bank-card-form.tsx` يُرسل رقم البطاقة (PAN) و CVV للخادم الخلفي.

**الحل**: لا تستخدم هذا النموذج أبدًا في الإنتاج.

```
❌ الحالي: المستخدم يدخل البطاقة في صفحتنا → نرسلها لخادمنا → نرسلها لـ SATIM
   هذا يخالف PCI-DSS لأن خادمنا يلمس بيانات البطاقة!

✅ المطلوب: المستخدم يُحوَّل لصفحة SATIM/Edahabia الآمنة → يدخل البطاقة هناك
   خادمنا لا يرى أبدًا بيانات البطاقة → متوافق مع PCI-DSS
```

**الإجراءات**:
1. احتفظ بـ `bank-card-form.tsx` فقط كـ UI placeholder (لا يُرسل بيانات حقيقية)
2. في الدفع الحقيقي: استخدم `redirectUrl` من SATIM
3. أضف تعليق واضح: `// DEPRECATED: Do not collect card data. Use SATIM hosted checkout.`

---

## 3.4 تكامل Edahabia

### 3.4.1 الفرق عن CIB

| البُعد | CIB | Edahabia |
|---|---|---|
| النوع | بطاقة بنكية | محفظة إلكترونية |
| الرصيد | مرتبط بالحساب البنكي | رصيد مُسبق الدفع |
| التحقق | 3D Secure (SMS OTP) | OTP من Baridimob |
| الرسوم | 1-2% للبائع | مجاني للبائع |
| API | SATIM | Algérie Postale |

### 3.4.2 التكامل التقني

- مماثل لـ CIB مع اختلافات بسيطة في الـ API
- نفس نمط: redirect → payment → webhook → verification
- **مطلوب**: التسجيل أيضًا في Algérie Postale كتاجر

---

## 3.5 Baridimob (التحويل الفوري)

### 3.5.1 الوضع الحالي

```typescript
// components/payment/baridimob-form.tsx — نموذج باريديموب (موجود)
// ❌ يحتاج لإصلاح: verifyOtp() كان يُرسل args خاطئة (مُصلح في worklog)
```

### 3.5.2 تدفق Baridimob

```
المستخدم يختار Baridimob
    ↓
يدخل رقم الهاتف المرتبط بحساب باريديموب
    ↓
يُرسل SYSTEME un OTP لبريديموب
    ↓
المستخدم يدخل OTP
    ↓
التحقق من الـ OTP (API provider)
    ↓
خصم المبلغ من رصيد باريديموب
    ↓
إشعار نجاح/فشل
```

### 3.5.3 مزود خدمة Baridimob

- لا يوجد API رسمي مفتوح من Algérie Postale لـ Baridimob
- **البدائل**:
  1. تكامل مع مزود دفع يدعم Baridimia (مثل ChargaTech أو Paymee)
  2. التعامل مع Algérie Postale مباشرة (يتطلب عقد مؤسسي)

---

## 3.6 Stripe (للدولي)

### 3.6.1 لماذا Stripe؟

- للمغتربين الجزائريين الذين لديهم بطاقات Visa/Mastercard دولية
- للسياح الأجانب الذين يزورون الجزائر
- **ليس** الوسيط الرئيسي — CIB/Edahabia هما الأساس

### 3.6.2 التكامل

```typescript
class StripePaymentProvider implements PaymentProvider {
  private stripe: Stripe;

  async createPayment(params: CreatePaymentParams): Promise<PaymentResult> {
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'dzd',  // Stripe يدعم DZD
          product_data: { name: params.productName },
          unit_amount: params.amount,  // في سنتات
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${params.baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_id}`,
      cancel_url: `${params.baseUrl}/checkout/cancel`,
      metadata: {
        bookingId: params.bookingId,
        userId: params.userId,
      },
    });

    return { redirectUrl: session.url!, transactionId: session.id };
  }

  async verifyPayment(sessionId: string): Promise<PaymentVerifyResult> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId);
    return {
      success: session.payment_status === 'paid',
      transactionId: session.id,
      amount: session.amount_total!,
    };
  }
}
```

### 3.6.3 Webhook handling حقيقي

```typescript
// app/api/payments/webhook/route.ts — الحالي stub، يجب إكماله

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  // 1. التحقق من التوقيع
  const event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);

  // 2. معالجة الأحداث
  switch (event.type) {
    case 'checkout.session.completed':
      // تحديث Payment → completed, Booking → confirmed
      // إنشاء عقد رقمي
      // إطلاق Escrow
      break;
    case 'checkout.session.expired':
      // Payment → failed, Booking → cancelled
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## 3.7 نظام المحفظة (Wallet)

### 3.7.1 الوضع الحالي

```prisma
model User {
  walletBalance Int @default(0) // رصيد المحفظة بالدينار
}

model Transaction {
  type: String // INCOME, EXPENDITURE, ESCROW_HELD, ESCROW_RELEASED,
                // ESCROW_REFUNDED, DEPOSIT, WITHDRAWAL, TRANSFER
  amount: Int
}
```

```
API:
  GET  /api/wallet — الرصيد والمعاملات
  POST /api/wallet/deposit — إيداع
  POST /api/wallet/withdraw — سحب
  POST /api/wallet/transfer — تحويل

الصفحات:
  /wallet — محفظة المستخدم
  /dashboard/wallet — محفظة في الداشبورد
```

### 3.7.2 التكامل مع الدفع

```
المستأجر يودع في المحفظة (CIB/Edahabia/Baridimob)
    ↓
Transaction { type: 'DEPOSIT', amount: X }
User.walletBalance += X
    ↓
المستأجر يدفع حجز من المحفظة
    ↓
Transaction { type: 'EXPENDITURE', amount: Y }
User.walletBalance -= Y
Booking { escrowStatus: 'held' }
    ↓
نهاية الحجز → إطلاق Escrow
    ↓
Transaction { type: 'INCOME', amount: Y - commission } (للمؤجر)
Transaction { type: 'ESCROW_RELEASED', amount: Y } (للمنصة)
```

### 3.7.3 السحب (Withdrawal)

```
المؤجر يطلب سحب
    ↓
الحد الأدنى: 5,000 DZD
    ↓
Transaction { type: 'WITHDRAWAL', amount: Z, status: 'pending' }
    ↓
مراجعة يدوية (أو تلقائية بعد 24 ساعة)
    ↓
تحويل عبر CCP/حوالة بنكية
    ↓
Transaction status → 'completed'
```

---

## 3.8 TVA (ضريبة القيمة المضافة)

### 3.8.1 المعدلات في الجزائر

| المعدل | التطبيق |
|---|---|
| 19% | المعدل العام (معظم السلع والخدمات) |
| 9% | السلع الأساسية والخدمات المصرفية |
| 0% | الصادرات |

### 3.8.2 التطبيق على STANDARD.Rent

- **إيجار المنتجات**: TVA 19%
- **عمولة المنصة**: TVA 19% على العمولة
- **اشتراكات**: TVA 19%
- **تأمين**: TVA 9% (خدمة مالية)

### 3.8.3 إعداد TVA في الكود

```typescript
// lib/tax.ts
export const TAX_RATES = {
  STANDARD: 19,    // عام
  REDUCED: 9,     // خدمات مالية
  ZERO: 0,         // صادرات
} as const;

export function calculateWithTax(amount: number, rate: number = TAX_RATES.STANDARD) {
  const tax = Math.round(amount * rate / 100);
  return { subtotal: amount, tax, total: amount + tax };
}

export function extractTax(total: number, rate: number = TAX_RATES.STANDARD) {
  const subtotal = Math.round(total / (1 + rate / 100));
  const tax = total - subtotal;
  return { subtotal, tax, total };
}
```

---

## 3.9 الهيكل المحاسبي

### 3.9.1 تدفق الأموال

```
المستأجر يدفع 10,000 DZD (إيجار) + 5,000 DZD (وديعة)
    ↓
15,000 DZD → حساب STANDARD.Rent (Escrow)
    ↓
نهاية الحجز (بدون مشاكل):
    5,000 DZD → إرجاع وديعة للمستأجر
    9,500 DZD → تحويل للمؤجر (10,000 - 5% عمولة)
      500 DZD → عمولة STANDARD.Rent
      95 DZD → TVA على العمولة (19% of 500)
```

### 3.9.2 حسابات بنكية مطلوبة

| الحساب | الغرض |
|---|---|
| حساب Escrow | استقبال المدفوعات (مؤقت) |
| حساب عمولة | استقبال العمولات |
| حساب TVA | فصل TVA للتصريح الضريبي |
| حساب المؤجرين | صرف أرباح المؤجرين |

---

## 3.10 قائمة المهام — المرحلة 3

```
[ ] التسجيل في SATIM كبائع CIB/Edahabia
[ ] الحصول على بيانات Sandbox
[ ] إعادة كتابة CIBPaymentProvider بـ SATIM API الحقيقي
[ ] إعادة كتابة webhook handling بـ HMAC verification
[ ] إزالة bank-card-form.tsx من مسار الدفع الحقيقي
[ ] تكامل Edahabia API
[ ] البحث عن مزود Baridimob (ChargaTech أو Paymee)
[ ] تكامل Stripe Checkout Sessions
[ ] إضافة TVA في كل الأسعار المعروضة
[ ] إنشاء lib/tax.ts
[ ] ربط المحفظة (Wallet) بـ CIB/Edahabia
[ ] تنفيذ تدفق السحب (Withdrawal)
[ ] تنفيذ Escrow الكامل مع الحركات المالية
[ ] فتح حسابات بنكية منفصلة (Escrow + عمولة + TVA)
[ ] اختبار كل تدفق دفع في Sandbox
[ ] اختبار كل تدفق دفع في Production
```

---

> **المرحلة التالية**: `05-TESTING-QA-PLAN.md` — خطة الاختبار الشامل.
