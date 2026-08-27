# المرحلة 4 — خطة الاختبار الشامل (Testing & QA)
## STANDARD.Rent — Production Readiness Plan

> **المدة التقديرية**: 4 أسابيع
> **الهدف**: 0 عيوب حرجة (Critical) عند الإطلاق
> **المعيار**: 70%+ تغطية اختبارية للكود الحرج

---

## 4.1 إعداد بيئة الاختبار

### 4.1.1 الأدوات المطلوبة

```bash
# اختبارات الوحدة والتكامل
bun add -d vitest @testing-library/react @testing-library/jest-dom

# Mocking
bun add -d msw # Mock Service Worker — لـ API mocking

# E2E
bun add -d @playwright/test

# Coverage
bun add -d @vitest/coverage-v8
```

### 4.1.2 إعداد Vitest

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: [
        'lib/**/*.ts',
        'app/api/**/*.ts',
      ],
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

---

## 4.2 اختبارات الوحدة (Unit Tests)

### 4.2.1 الأولوية 1: Lib Functions (حرج)

| الملف | الوظيفة | اختبارات مطلوبة |
|---|---|---|
| `lib/auth-server.ts` | createSession, validateSession, destroySession | إنشاء، تحقق صالح، تحقق منتهي، تدمير، session غير موجود |
| `lib/payment-provider.ts` | createPayment, verifyPayment | كل provider (CIB, Stripe)، حالة نجاح/فشل، env vars مفقودة |
| `lib/rate-limiter.ts` | checkRateLimit | ضمن الحد، تجاوز الحد، إعادة تعيين |
| `lib/cache.ts` | getCache, setCache, invalidateCache | تخزين، استرجاع، انتهاء TTL، إبطال بالـ pattern |
| `lib/upload.ts` | uploadImage, deleteImage | رفع صالح، نوع مرفوض، حجم كبير، حذف |
| `lib/email.ts` | sendEmail | إرسال ناجح، API key مفقود، خطأ شبكة |
| `lib/api-response.ts` | success, error, paginate | كل أنواع الاستجابة |
| `lib/validators.ts` | كل دالة تحقق | مدخلات صالحة، غير صالحة، فارغة |
| `lib/i18n.ts` | الترجمة | مفاتيح موجودة، مفقودة،RTL/LTR |

### 4.2.2 الأولوية 2: Business Logic (مهم)

| الوظيفة | اختبارات |
|---|---|
| Trust Score calculation | كل مكون (KYC, reviews, disputes, vouches), حدود (0-100), حالات حافة |
| TVA calculation | معدلات مختلفة، أرقام صحيحة، تقريب |
| Booking price calculation | يوم واحد، عدة أيام، خصم bundle، وديعة + إيجار |
| Escrow flow | hold → release → refund، حالات خطأ |
| Subscription limits | ضمن الحد، تجاوز الحد، unlimited |
| Search & filters | فلتر واحد، متعدد، فارغ، بدون نتائج |

### 4.2.3 قالب اختبار مثالي

```typescript
// lib/__tests__/auth-server.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createSession, validateSession, destroySession } from '../auth-server';

describe('auth-server', () => {
  describe('createSession', () => {
    it('ينشئ جلسة صالحة مع token و userId', async () => {
      const session = await createSession('user-123');
      expect(session.token).toBeTruthy();
      expect(session.userId).toBe('user-123');
      expect(session.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('validateSession', () => {
    it('يرجع صحيح لجلسة موجودة وغير منتهية', async () => {
      const session = await createSession('user-123');
      const result = await validateSession(session.token);
      expect(result).toBeTruthy();
      expect(result!.userId).toBe('user-123');
    });

    it('يرجع null لـ token غير موجود', async () => {
      const result = await validateSession('invalid-token');
      expect(result).toBeNull();
    });

    it('يحذف الجلسة المنتهية ويرجع null', async () => {
      // Create session with very short TTL for testing
      const session = await createSession('user-123', -1); // expired
      const result = await validateSession(session.token);
      expect(result).toBeNull();
    });
  });
});
```

---

## 4.3 اختبارات التكامل (Integration Tests)

### 4.3.1 API Routes — الأولوية حسب الأهمية

#### 🔴 حرج (يجب أن يعمل 100%)

| مجموعة | Routes | اختبارات |
|---|---|---|
| **المصادقة** | `/api/auth/login`, `/register`, `/logout`, `/forgot-password`, `/reset-password` | تسجيل ناجح، بريد مكرر، كلمة مرور خاطئة، logout يُبطل الجلسة |
| **المنتجات** | `/api/products`, `/api/products/[id]`, `/api/products/search-suggestions` | قائمة، تفاصيل، بحث، لا يوجد نتائج |
| **الحجوزات** | `/api/bookings/create`, `/api/bookings/[id]`, `/api/bookings/[id]/status` | إنشاء حجز، تحديث حالة، حجز غير موجود، بدون مصادقة |
| **السلة** | `/api/bookings/cart`, `/api/bookings/cart/items/[id]` | إضافة، حذف، تحديث كميات |

#### 🟡 مهم (يجب أن يعمل 90%+)

| مجموعة | Routes | اختبارات |
|---|---|---|
| **النزاعات** | `/api/disputes/create`, `/api/disputes/[id]`, `/api/disputes/[id]/messages` | إنشاء، إرسال رسالة، تحديث حالة |
| **العقود** | `/api/contracts`, `/api/contracts/[id]`, `/api/contracts/[id]/sign` | إنشاء، عرض، توقيع |
| **التقييمات** | `/api/reviews/create`, `/api/reviews`, `/api/reviews/[id]/moderate` | إنشاء تقييم، عرض، إشراف |
| **المحفظة** | `/api/wallet`, `/api/wallet/deposit`, `/api/wallet/withdraw` | عرض رصيد، إيداع، سحب، رصيد غير كافي |

#### 🟢 ثانوي (يجب أن يعمل 80%+)

| مجموعة | Routes | اختبارات |
|---|---|---|
| **المفضلة** | `/api/products/wishlist` | إضافة، إزالة، عرض |
| **الإشعارات** | `/api/notifications`, `/api/notifications/[id]`, `/api/notifications/read-all` | عرض، تحديد كمقروء، حذف |
| **التوثيق** | `/api/verification/submit`, `/api/verification/status`, `/api/verification/vote` | تقديم، حالة، تصويت |
| **الاشتراكات** | `/api/subscriptions`, `/api/subscriptions/subscribe`, `/api/subscriptions/cancel` | قائمة الخطط، اشتراك، إلغاء |

### 4.3.2 اختبار API عام

```typescript
// app/api/auth/login/__tests__/route.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('POST /api/auth/login', () => {
  it('يرجع 200 و token عند بيانات صحيحة', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeTruthy();
    expect(data.user.email).toBe('test@example.com');
  });

  it('يرجع 401 عند كلمة مرور خاطئة', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });
    expect(res.status).toBe(401);
  });

  it('يرجع 401 عند بريد غير موجود', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@example.com', password: 'password123' }),
    });
    expect(res.status).toBe(401);
  });

  it('يرجع 429 بعد تجاوز rate limit', async () => {
    // أرسل 10 طلبات سريعة
    for (let i = 0; i < 10; i++) {
      await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
      });
    }
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    });
    expect(res.status).toBe(429);
  });
});
```

---

## 4.4 اختبارات E2E (Playwright)

### 4.4.1 إعداد Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Desktop Chrome', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

### 4.4.2 المسارات الحرجة (10 Critical Paths)

```
المسار 1: التسجيل والدخول
  1. زيارة /register
  2. تعبئة البيانات
  3. إنشاء حساب
  4. التأكد من تسجيل الدخول التلقائي
  5. تسجيل الخروج
  6. تسجيل الدخول من /login

المسار 2: تصفح المنتجات
  1. زيارة /
  2. النقر على فئة
  3. فلترة بالسعر
  4. النقر على منتج
  5. التأكد من عرض التفاصيل

المسار 3: الحجز الكامل
  1. تسجيل الدخول كمستأجر
  2. إضافة منتج للسلة
  3. فحص السلة
  4. الانتقال للدفع
  5. اختيار طريقة الدفع
  6. تأكيد الحجز

المسار 4: التوثيق (KYC)
  1. تسجيل الدخول
  2. زيارة /verification
  3. السماح بالكاميرا
  4. التقاط صورة
  5. تقديم الطلب
  6. التأكد من حالة 'pending'

المسار 5: نظام النزاعات
  1. تسجيل الدخول كمستأجر
  2. إنشاء نزاع من /disputes
  3. إرفاق الأدلة
  4. التأكد من عرض النزاع
  5. إرسال رسالة في النزاع

المسار 6: التقيمات
  1. تسجيل الدخول كمستأجر (بعد انتهاء حجز)
  2. زيارة /bookings/[id]
  3. كتابة تقييم
  4. التأكد من ظهور التقييم على صفحة المنتج

المسار 7: المحفظة
  1. تسجيل الدخول
  2. زيارة /wallet
  3. التأكد من عرض الرصيد
  4. عرض سجل المعاملات

المسار 8: لوحة التحكم
  1. تسجيل الدخول
  2. زيارة /dashboard
  3. عرض الحجوزات
  4. عرض الإشعارات
  5. تغيير الإعدادات

المسار 9: لوحة الإدارة
  1. تسجيل الدخول كـ admin
  2. زيارة /admin/dashboard
  3. عرض الإحصائيات
  4. إدارة منتج
  5. إدارة مستخدم

المسار 10: Dark/Light Mode
  1. زيارة /
  2. التأكد من الوضع الافتراضي (light)
  3. النقر على زر تبديل السمة
  4. التأكد من تحول كل العناصر
  5. إعادة التبديل
  6. التأكد من الرجوع للوضع السابق
```

### 4.4.3 مثال E2E Test

```typescript
// e2e/registration.spec.ts
import { test, expect } from '@playwright/test';

test('مسار التسجيل الكامل', async ({ page }) => {
  await page.goto('/register');

  // التأكد من RTL
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  // تعبئة النموذج
  await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'SecurePass123!');
  await page.fill('input[name="confirmPassword"]', 'SecurePass123!');

  // اختيار الدور
  await page.click('text=مستأجر');

  // إرسال
  await page.click('button[type="submit"]');

  // التأكد من التحويل
  await expect(page).toHaveURL(/\//);
  // أو رسالة نجاح
  await expect(page.locator('text=تم إنشاء الحساب')).toBeVisible();
});
```

---

## 4.5 اختبار الأمان (Security Testing)

### 4.5.1 OWASP Top 10 — Check List

| # | الثغرة | الفحص | الحالة الحالية | الإصلاح |
|---|---|---|---|---|
| A01 | Broken Access Control | اختبار الوصول بدون auth لصفحات/API محمية | ⚠️ بعض الصفحات بدون auth guard | إضافة auth guards (مُصلح جزئيًا) |
| A02 | Cryptographic Failures | فحص كلمات المرور (bcrypt round count), session token entropy | ✅ bcrypt | زيادة rounds لـ 12+ |
| A03 | Injection | SQL injection, NoSQL injection | ✅ Prisma (parameterized) | اختبار XSS في المدخلات |
| A04 | Insecure Design | Escrow flow, dispute resolution | ⚠️ يحتاج مراجعة | مراجعة التصميم في 03-TRUST-SAFETY |
| A05 | Security Misconfiguration | CORS, headers, exposed secrets | ⚠️ CORS permissive | تقييد CORS، إزالة secrets من الكود |
| A06 | Vulnerable Components | `npm audit` | ✅ 0 CVEs (بعد الترقية) | مراقبة مستمرة |
| A07 | Auth Failures | Brute force, session fixation | ✅ rate limiting موجود | اختبار Session fixation |
| A08 | Data Integrity Failures | Payment signature verification | ❌ webhook بدون HMAC | تنفيذ HMAC verification |
| A09 | Logging Failures | Audit logging | ✅ auditLog() موجود | التأكد من تسجيل كل عملية مالية |
| A10 | SSRF | Upload URL, webhook URL | ⚠️ لم يُختبر | اختبار SSRF في upload و webhook |

### 4.5.2 اختبارات أمان محددة

```bash
# 1. SQL Injection
# أرسل: ' OR '1'='1 في حقول البحث
# المتوقع: لا نتائج (ليس خطأ 500)

# 2. XSS
# أرسل: <script>alert('xss')</script> في حقول النص
# المتوقع: يُعرض كنص، لا يُنفذ

# 3. CSRF
# أرسل POST من domain مختلف
# المتوقع: 403 أو 401

# 4. Rate Limiting
# أرسل 100 طلب login في دقيقة
# المتوقع: 429 بعد 5-10 محاولات

# 5. IDOR (Insecure Direct Object Reference)
# سجّل دخول كـ user-1، اطلب /api/bookings/booking-of-user-2
# المتوقع: 403

# 6. Session Fixation
# ضع session token يدوي قبل تسجيل الدخول
# المتوقع: token جديد بعد الدخول
```

---

## 4.6 اختبار الأداء (Performance)

### 4.6.1 أهداف Lighthouse

| المقياس | الهدف | الصفحة الرئيسية الحالية | الإجراء |
|---|---|---|---|
| Performance | > 90 | ? (يجب القياس) | تحسين الصور، lazy loading |
| Accessibility | > 90 | ? | إضافة ARIA labels |
| Best Practices | > 90 | ? | إصلاح console errors |
| SEO | > 95 | ✅ (SSR) | إضافة structured data |

### 4.6.2 اختبار الحمل (Load Testing)

```bash
# باستخدام k6
# load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 50 },   // ramp up
    { duration: '5m', target: 100 },  // sustained
    { duration: '2m', target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% under 500ms
    http_req_failed: ['rate<0.01'],   // <1% failures
  },
};

export default function () {
  const res = http.get('http://localhost:3000/api/products');
  check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
```

---

## 4.7 اختبار التوافق

### 4.7.1 المتصفحات المدعومة

| المتصفح | النسخة | الجهاز | الأولوية |
|---|---|---|---|
| Chrome | آخر 2 إصدارات | Android + Desktop | ✅ P0 |
| Safari | آخر 2 إصدارات | iOS + macOS | ✅ P0 |
| Firefox | آخر إصدار | Desktop | ⚠️ P1 |
| Samsung Internet | آخر إصدار | Android | ⚠️ P1 |
| Edge | آخر إصدار | Desktop | 🟢 P2 |

### 4.7.2 أحجام الشاشة (RTL!)

| الحجم | الوصف | النقاط للتحقق |
|---|---|---|
| 375×667 | iPhone SE | navbar، cards، footer، modal |
| 390×844 | iPhone 14 | كل الصفحات |
| 768×1024 | iPad | tablet layout، sidebar |
| 1440×900 | Desktop | كل الصفحات |
| 1920×1080 | Full HD | كل الصفحات، admin panel |

---

## 4.8 جدول الاختبار — التسلسل

| الأسبوع | النشاط | الهدف |
|---|---|---|
| 1 | إعداد Vitest + كتابة اختبارات الوحدة لـ lib/ | 50%+ تغطية lib/ |
| 2 | اختبارات التكامل لـ API routes (الأولوية 1+2) | كل API حرج يمر |
| 3 | اختبارات E2E (10 مسارات) + أمان | 10/10 مسارات تمر |
| 4 | أداء + توافق + إصلاح الأخطاء | Lighthouse 90+، 0 critical bugs |

---

## 4.9 قائمة المهام — المرحلة 4

```
[ ] تثبيت Vitest + Testing Library + Playwright + MSW
[ ] إعداد vitest.config.ts + playwright.config.ts
[ ] كتابة 30+ اختبار وحدة لـ lib/ functions
[ ] كتابة 40+ اختبار تكامل لـ API routes
[ ] كتابة 10 اختبارات E2E للمسارات الحرجة
[ ] اختبار OWASP Top 10
[ ] تشغيل Lighthouse على 10 صفحات رئيسية
[ ] تشغيل load test (k6)
[ ] اختبار التوافق (Chrome + Safari, Mobile + Desktop)
[ ] اختبار RTL rendering على كل صفحة
[ ] إصلاح كل critical و high bugs المكتشفة
[ ] الوصول لـ 70%+ تغطية اختبارية
```

---

> **المرحلة التالية**: `06-GO-LIVE-CHECKLIST.md` — قائمة الإطلاق النهائية (200+ نقطة).