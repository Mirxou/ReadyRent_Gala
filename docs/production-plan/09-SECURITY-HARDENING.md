# 09 — تقوية الأمان (Security Hardening)
## STANDARD.Rent — Production Readiness Plan

> **المرجع**: MASTERPLAN Section 8 + فحص الكود المصدري + OWASP Top 10
> **الهدف**: تقليل سطح الهجوم إلى الحد الأدنى

---

## 9.1 الثغرات المُكتشفة حاليًا

### 9.1.1 حرجة (Critical)

| # | الثغرة | الملف | الأثر | الحل |
|---|---|---|---|---|
| C1 | **PCI-DSS violation**: bank-card-form.tsx يُرسل PAN/CVV للخادم | `components/payment/bank-card-form.tsx` | مستخدم ضار يمكن سرقة بيانات البطاقة | استخدم SATIM hosted checkout فقط |
| C2 | **Webhook بدون HMAC**: أي شخص يمكنه إرسال webhook مزوّر | `app/api/payments/webhook/route.ts` | تحرير Escrow بدون دفع حقيقي | تنفيذ HMAC-SHA256 verification |
| C3 | **WebSocket يثق بالـ userId من العميل** | `mini-services/notifications-service/index.ts` | مستخدم يمكنه قراءة إشعارات غيره | التحقق من session token على الـ socket |

### 9.1.2 عالية (High)

| # | الثغرة | الملف | الأثر | الحل |
|---|---|---|---|---|
| H1 | **IDOR محتمل**: بعض API routes لا تتحقق من ملكية المورد | عدة API routes | مستخدم يرى/يُعدّل بيانات غيره | إضافة ownership check في كل route |
| H2 | **Rate limiting محدود**: فقط على login و forgot-password | `lib/rate-limiter.ts` | brute force على endpoints أخرى | إضافة rate limiting لكل API route |
| H3 | **CORS permissive**: قد يسمح لأي origin | `next.config.ts` أو middleware | XSS من موقع خارجي | تقييد على `standardrent.dz` |
| H4 | **لا يوجد CSP (Content Security Policy)** | Nginx / headers | XSS من حقول الإدخال | إضافة CSP header صارم |
| H5 | **payment-security.ts هو dead code** | `lib/payment-security.ts` | وهم الأمان (موجود لكن غير مُستدعى) | استخدمه أو احذفه |

### 9.1.3 متوسطة (Medium)

| # | الثغرة | الأثر | الحل |
|---|---|---|---|
| M1 | Password hash rounds غير محدد | قد يكون أقل من 12 | التأكد من bcrypt rounds >= 12 |
| M2 | Session token entropy | تعتمد على crypto.randomUUID — كافي لكن يمكن تحسينه | استخدام crypto.randomBytes(32) |
| M3 | لا يوجد account lockout بعد N محاولات فاشلة | brute force ممكن على مدى طويل | قفل الحساب بعد 10 محاولات فاشلة |
| M4 | لا يوجد cookie SameSite | CSRF ممكن | `SameSite=Strict` أو `Lax` |
| M5 | File upload: يمكن رفع ملفات SVG (تحتوي JS) | Stored XSS | حظر SVG، السماح فقط بـ jpg/png/webp/gif |
| M6 | Error messages قد تكشف معلومات داخلية | Information disclosure | رسائل عامة في Production |
| M7 | لا يوجد request size limit على API body | DoS via large payload | إضافة `body-parser` limit في Nginx |

---

## 9.2 الحلول التفصيلية

### 9.2.1 C1: إصلاح PCI-DSS

```typescript
// ❌ لا تستخدم أبداً في الإنتاج:
// components/payment/bank-card-form.tsx

// ✅ الحل: التوجيه لصفحة SATIM الآمنة
// في checkout page:
const response = await fetch('/api/payments/create', {
  method: 'POST',
  body: JSON.stringify({ bookingId, amount }),
});
const { redirectUrl } = await response.json();
window.location.href = redirectUrl; // صفحة SATIM الآمنة
```

**الإجراء الفوري**: أضف تعليق في `bank-card-form.tsx`:
```
// ⚠️ PRODUCTION WARNING: This component collects card data client-side.
// In production, use SATIM/Edahabia hosted checkout instead.
// This component should only be used for UI prototyping.
// NEVER call the API with real card numbers.
```

### 9.2.2 C2: HMAC Verification للـ Webhooks

```typescript
// app/api/payments/webhook/route.ts
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('x-payment-signature');
  
  if (!signature) {
    return NextResponse.json(
      { error: { message: 'Missing signature', code: 'MISSING_SIGNATURE' } },
      { status: 400 }
    );
  }

  // حساب HMAC expected
  const expectedSignature = crypto
    .createHmac('sha256', process.env.PAYMENT_HMAC_SECRET!)
    .update(body)
    .digest('hex');

  // مقارنة آمنة (timing-safe)
  if (!crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )) {
    logger.warn('Payment webhook: invalid signature', { signature });
    return NextResponse.json(
      { error: { message: 'Invalid signature', code: 'INVALID_SIGNATURE' } },
      { status: 401 }
    );
  }

  // الآن فقط نعالج الـ webhook
  const data = JSON.parse(body);
  // ... process webhook
}
```

### 9.2.3 C3: إصلاح WebSocket Authentication

```typescript
// mini-services/notifications-service/index.ts
import { createClient } from '@libsql/client'; // أو pg

const VALID_SESSIONS = new Map(); // cache in-memory, validate from DB

io.on('connection', async (socket) => {
  // لا تقبل أي حدث قبل المصادقة
  socket.on('authenticate', async (token: string) => {
    try {
      // التحقق من token في قاعدة البيانات
      const session = await db.session.findUnique({
        where: { token },
        include: { user: { select: { id: true, role: true } } },
      });

      if (!session || session.expiresAt < new Date()) {
        socket.disconnect(true);
        return;
      }

      // التحقق ناجح — ربط socket بالـ userId
      socket.data.userId = session.user.id;
      socket.data.role = session.user.role;
      socket.join(`user-${session.user.id}`);

      // إرسال الإشعارات غير المقروءة
      const unread = await db.notification.count({
        where: { userId: session.user.id, isRead: false },
      });
      socket.emit('unread-count', unread);

    } catch (error) {
      socket.disconnect(true);
    }
  });

  // فصل الاتصال بعد 10 ثوانٍ بدون مصادقة
  setTimeout(() => {
    if (!socket.data.userId) socket.disconnect(true);
  }, 10000);
});
```

### 9.2.4 H1: IDOR Prevention

```typescript
// middleware pattern لكل API route يحتاج ownership check
async function requireOwnership(
  request: Request,
  resourceUserId: string
): Promise<boolean> {
  const session = await getSessionFromRequest(request);
  if (!session) return false;
  if (session.userId !== resourceUserId && session.user.role !== 'admin') {
    return false;
  }
  return true;
}

// مثال الاستخدام:
// GET /api/bookings/[id]
const booking = await db.booking.findUnique({ where: { id: params.id } });
if (!booking || !await requireOwnership(request, booking.userId)) {
  return NextResponse.json(
    { error: { message: 'غير مصرح', code: 'FORBIDDEN' } },
    { status: 403 }
  );
}
```

### 9.2.5 H2: Rate Limiting شامل

```typescript
// lib/rate-limiter.ts — تحسين
const RATE_LIMITS: Record<string, { windowMs: number; maxRequests: number }> = {
  'auth:login': { windowMs: 60_000, maxRequests: 5 },
  'auth:register': { windowMs: 60_000, maxRequests: 3 },
  'auth:forgot-password': { windowMs: 60_000, maxRequests: 3 },
  'api:general': { windowMs: 60_000, maxRequests: 100 },
  'api:search': { windowMs: 60_000, maxRequests: 30 },
  'api:upload': { windowMs: 60_000, maxRequests: 10 },
  'api:create': { windowMs: 60_000, maxRequests: 20 },
};

// في كل API route:
await checkRateLimit(request, 'api:general');
```

### 9.2.6 H4: Content Security Policy

```nginx
# في Nginx config
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https://res.cloudinary.com https://*.google-analytics.com;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://resend.com https://*.google-analytics.com wss:;
  frame-src 'self' https://www.youtube.com;
" always;
```

### 9.2.7 M4: Cookie Security

```typescript
// lib/auth-server.ts — تعديل createSession
// عند إرجاع الـ token كـ cookie:
const cookieOptions = {
  httpOnly: true,          // لا يمكن الوصول من JS
  secure: true,            // HTTPS فقط
  sameSite: 'strict' as const,  // CSRF protection
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 أيام
};

// أو إذا أُرسل في header (الحالي):
// أضف SameSite في middleware أو Nginx
```

---

## 9.3 Security Headers الكاملة (Nginx)

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(self), microphone=(), geolocation=(self), payment=(self)" always;
add_header Content-Security-Policy "[CSP هنا]" always;
add_header X-Robots-Tag "noarchive" always;  # لا تخزن نسخة cache في محركات البحث
```

---

## 9.4 قائمة المهام — الأمان

```
[ ] إصلاح C1: إزالة bank-card-form من مسار الدفع الحقيقي
[ ] إصلاح C2: HMAC verification في webhook
[ ] إصلاح C3: Authentication في notifications-service
[ ] إصلاح H1: IDOR prevention في كل API route
[ ] إصلاح H2: Rate limiting شامل
[ ] إصلاح H3: CORS تقييدي
[ ] إصلاح H4: CSP header
[ ] إصلاح H5: حذف أو تفعيل payment-security.ts
[ ] إصلاح M1: bcrypt rounds >= 12
[ ] إصلاح M3: Account lockout
[ ] إصلاح M4: Cookie SameSite
[ ] إصلاح M5: حظر SVG في upload
[ ] إصلاح M6: رسائل خطأ عامة في Production
[ ] إصلاح M7: Request size limit
[ ] تشغيل OWASP ZAP scan
[ ] مراجعة يدوية لكل API route
```

---

## 9.5 جدول المخاطر الأمنية

| المخاطر | الاحتمال | الأثر | الأولوية | التخفيف |
|---|---|---|---|---|
| اختراق حساب عبر brute force | متوسط | عالٍ | 🔴 | Rate limiting + lockout + 2FA |
| XSS في تعليقات/تقييمات | متوسط | متوسط | 🔴 | CSP + React escaping + sanitization |
| SQL injection | منخفض | حرج | 🟡 | Prisma parameterized queries |
| CSRF | متوسط | عالٍ | 🔴 | SameSite cookies + CSRF token |
| تلاعب بالدفع (fake webhook) | متوسط | حرج | 🔴 | HMAC verification |
| تسريب بيانات المستخدمين | منخفض | حرج | 🔴 | Encryption at rest + access control |
| DDoS | متوسط | عالٍ | 🟡 | Cloudflare + rate limiting |
| IDOR | عالٍ | متوسط | 🟡 | Ownership checks |

---

> **الملف التالي**: `10-TECHNICAL-DEBT.md`
