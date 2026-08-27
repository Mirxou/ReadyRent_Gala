# 10 — الديون التقنية وتحديد الأولويات
## STANDARD.Rent — Production Readiness Plan

> **الهدف**: تحديد كل دين تقني وتصنيفه حسب الأولوية
> **المرجع**: فحص الكود المصدري + worklog + lint output

---

## ما هو الدين التقني؟

كل اختصار أو حل مؤقت أو كود ميت يُبطئ التطوير ويُضعف الجودة.

---

## 10.1 Code Duplication (التكرار)

### 10.1.1 UI Components المكررة

| المكون | الموقع 1 | الموقع 2 | الحل |
|---|---|---|---|
| Button | `components/ui/button.tsx` | `shared/components/sovereign/sovereign-button.tsx` | توحيد في واحد |
| Badge | `components/ui/badge.tsx` | `shared/components/ui/badge.tsx` | حذف الأقدم |
| Calendar | `components/ui/calendar.tsx` | `shared/components/ui/calendar.tsx` | حذف الأقدم |
| Sheet | `components/ui/sheet.tsx` | `components/ui/sheet.tsx` (نسختين?) | تحقق + حذف مكرر |
| Glass Panel | `components/sovereign/glass-panel.tsx` | `shared/components/sovereign/glass-panel.tsx` | توحيد |
| Identity Shield | `components/sovereign/identity-shield.tsx` | `shared/components/sovereign/identity-shield.tsx` | توحيد |
| Sovereign Sparkle | `components/sovereign/sovereign-sparkle.tsx` | `shared/components/sovereign/sovereign-sparkle.tsx` | توحيد |

### 10.1.2 Hooks المكررة

| Hook | الموقع 1 | الموقع 2 | الحل |
|---|---|---|---|
| `useToast` | `src/hooks/use-toast.ts` | `hooks/use-toast.ts` | حذف أحدهما |
| `useCreateCommunityProduct` | `hooks/useCreateCommunityProduct.ts` | — | مراجعة الاستخدام |

### 10.1.3 Lib المكررة

| الملف | الموقع 1 | الموقع 2 | الحل |
|---|---|---|---|
| `utils.ts` | `src/lib/utils.ts` | `lib/utils.ts` | توحيد |
| `db.ts` | `src/lib/db.ts` | `lib/db.ts` | توحيد |
| `analytics.tsx` | `lib/analytics.tsx` | — | مراجعة هل يُستخدم |
| `api.ts` | `lib/api.ts` | `lib/api/*.ts` (مُقسَّم) | حذف `api.ts` بعد إصلاح المسارات |

### 10.1.4 Feature Components المكررة

```
features/analytics/components/predictive-pulse.tsx
  → و src/features/analytics/components/predictive-pulse.tsx
  → نفس الملف في مكانين!

features/social/components/social-feed.tsx
  → و src/features/social/components/social-feed.tsx

features/finance/components/escrow-tracker.tsx
  → و src/features/finance/components/escrow-tracker.tsx

features/logistics/components/logistics-progress.tsx
  → و src/features/logistics/components/logistics-progress.tsx

features/judicial/components/high-court-monitor.tsx
  → و src/features/judicial/components/high-court-monitor.tsx

features/judicial/components/judicial-ledger.tsx
  → و src/features/judicial/components/judicial-ledger.tsx
```

**الحل**: حذف نسخ `src/features/` واستخدام نسخ الجذر فقط.

---

## 10.2 Code Mort (الكود الميت)

### 10.2.1 ملفات ميتة تمامًا

| الملف | الحجم التقديري | السبب |
|---|---|---|
| `lib/payment-security.ts` | ~50 سطر | لا يُستورد أبدًا |
| `lib/webrtc.ts` | ~100 سطر | لا يُستورد — WebRTC لم يُنفَّذ |
| `lib/ab-testing.ts` | ~80 سطر | لا يُستخدم فعليًا |
| `lib/conversion-funnel.ts` | ~60 سطر | لا يُستورد |
| `lib/push-notifications.ts` | ~100 سطر | لا يُستورد (خدمة إشعارات Push) |
| `lib/image-optimizer.ts` | ~50 سطر | لا يُستورد (يُستخدم Cloudinary بدلاً) |
| `lib/dz-data.ts` | ~200 سطر | بيانات ويلات/مدن — هل يُستخدم؟ |
| `lib/mock-data.ts` | ~300 سطر | بيانات تجريبية — حذف من الإنتاج |
| `contexts/SovereignContext.tsx` | ~100 سطر | هل يُستخدم؟ |
| `components/CommunityProductForm.tsx` | ~200 سطر | لا يُستورد من أي صفحة |
| `components/chatbot.tsx` | ~300 سطر | بديله `app/api/chatbot/chat/route.ts` موجود |
| `components/analytics.tsx` | ~150 سطر | لا يُستورد |
| `components/contract/contract-timeline.tsx` | ~100 سطر | هل يُستخدم في `contracts/[id]`؟ |
| `components/communication/call-interface.tsx` | ~200 سطر | WebRTC — لم يُفعَّل |
| `components/gps-tracker.tsx` | ~100 سطر | تتبع GPS — لم يُفعَّل |
| `components/forecast-chart.tsx` | ~150 سطر | هل يُستخدم في admin/forecasting؟ |
| `components/hijri-calendar.tsx` | ~100 سطر | تقويم هجري — زخرفي؟ |
| `components/AgreementRecorder.tsx` | ~100 سطر | لا يُستورد |
| `components/dispute-form.tsx` | ~200 سطر | بديله `components/disputes/dispute-form.tsx` موجود |
| `components/product-card.tsx` | ~100 سطر | بديله `components/product/product-card.tsx` موجود |
| `hooks/useOfflineSync.ts` | ~100 سطر | PWA sync — هل يُستخدم؟ |
| `hooks/useCreateCommunityProduct.ts` | ~100 سطر | لا يُستخدم |
| `components/ui/3d-card.tsx` | ~80 سطر | زخرفي — هل يُستخدم؟ |
| `components/ui/tilt-card.tsx` | ~80 سطر | زخرفي — هل يُستخدم؟ |
| `components/ui/particle-field.tsx` | ~80 سطر | زخرفي — هل يُستخدم؟ |
| `components/ui/spotlight.tsx` | ~60 سطر | زخرفي — هل يُستخدم؟ |
| `components/ui/magnetic-button.tsx` | ~60 سطر | زخرفي — هل يُستخدم؟ |
| `components/ui/page-transition.tsx` | ~60 سطر | هل يُستخدم في كل صفحة؟ |

### 10.2.2 الملفات المستخدمة في Sovereign فقط

```
components/sovereign/sovereign-ledger.tsx
components/sovereign/sovereign-audit-trail.tsx
components/sovereign/sovereign-heartbeat.tsx
components/sovereign/sovereign-seal.tsx
components/sovereign/mode-switcher.tsx
components/sovereign/sovereign-calendar.tsx
components/sovereign/system-halt-banner.tsx
components/sovereign/sovereign-oracle.tsx
components/sovereign/sovereign-radar.tsx
components/sovereign/hygiene-profile.tsx
components/sovereign/trust-assurance-chips.tsx
components/sovereign/2fa-enrollment.tsx
components/sovereign/vouch-button.tsx
components/sovereign/justice-receipt.tsx
```

**هذه مكونات عرض — احتفظ بها إذا تُستخدم في أي صفحة. احذفها فقط إذا لم تُستورد.**

---

## 10.3 الملفات المكررة في `public/`

```
public/icons/icon-512x512.png
public/public/icons/icon-512x512.png  ← مكرر

public/manifest.json
public/public/manifest.json  ← مكرر

public/images/manifesto/*
public/public/images/manifesto/*  ← مكرر

public/reports/*
public/public/reports/*  ← مكرر
```

**الحل**: احذف كل ما تحت `public/public/` — نسخ مكررة.

---

## 10.4 API Client Architecture

### 10.4.1 المشكلة

```
lib/api.ts          ← ملف واحد كبير يحتوي كل API calls
lib/api/auth.ts      ← ملف مُقسَّم (أحدث، أفضل)
lib/api/products.ts
lib/api/bookings.ts
lib/api/disputes.ts
lib/api/contracts.ts
lib/api/payments.ts
lib/api/reviews.ts
lib/api/notifications.ts
lib/api/wallet.ts
lib/api/admin.ts
lib/api/logistics.ts
lib/api/appeals.ts
lib/api/innovation.ts
lib/api/sovereign-client.ts
```

**المشكلة**: `lib/api.ts` يحتوي مسارات مكسورة. `lib/api/*.ts` أحدث وأفضل.

### 10.4.2 الحل

1. مراجعة كل دالة في `lib/api.ts`
2. نقل كل دالة للملف المقسَّم المناسب
3. إصلاح المسارات المكسورة أثناء النقل
4. حذف `lib/api.ts` نهائيًا
5. تحديث كل الاستيرادات في الصفحات

---

## 10.5 لغة الكود (اللغات المستخدمة)

| اللغة | النسبة التقديرية | الملاحظة |
|---|---|---|
| TypeScript | 95%+ | ✅ جيد |
| CSS (Tailwind) | 3% | ✅ جيد |
| SQL (Prisma) | 1% | ✅ جيد |
| Arabic (strings) | 1% | ✅ مطلوب (السوق الجزائري) |

---

## 10.6 تصنيف الأولويات

### 🔴 قبل الإطلاق (ح阻塞)

```
[ ] حذف src/features/ المكررة (6 ملفات)
[ ] حذف public/public/ المكررة
[ ] حذف lib/api.ts بعد النقل لـ lib/api/*.ts
[ ] حذف lib/payment-security.ts أو تفعيله
[ ] حذف lib/mock-data.ts من الإنتاج
```

### 🟡 الشهر الأول بعد الإطلاق

```
[ ] حذف المكونات الميتة (26+ ملف)
[ ] توحيد UI components المكررة
[ ] توحيد lib files المكررة
[ ] حذف webrtc.ts و call-interface.tsx (ليس في الأولوية)
[ ] مراجعة ab-testing.ts و conversion-funnel.ts (هل نحتاجهم؟)
```

### 🟢 تحسينات مستقبلية

```
[ ] مراجعة المكونات الزخرفية (3d-card, tilt-card, particle-field)
[ ] توحيد components/sovereign/ بين الجذر و shared/
[ ] مراجعة contexts/SovereignContext.tsx
[ ] تحسين بنية lib/ (مجلدات فرعية: auth/, payment/, trust/)
```

---

## 10.7 الملخص

| الفئة | العدد | الإجراء |
|---|---|---|
| ملفات مكررة (features) | 6 | حذف النسخ المكررة |
| ملفات مكررة (public) | ~10 | حذف public/public/ |
| ملفات مكررة (UI) | 6 | توحيد |
| ملفات مكررة (lib) | 2 | توحيد |
| كود ميت (lib) | 8 | حذف أو تفعيل |
| كود ميت (components) | 20+ | حذف أو تفعيل |
| كود ميت (hooks) | 2 | حذف |
| API architecture | 1 ملف كبير | تقسيم ونقل |
| **الإجمالي** | **~55 ملف** | — |

> **تقدير الجهد**: 2-3 أيام عمل مركّز لتنظيف كل الديون التقنية.
> **الأثر**: تقليل حجم المشروع بـ ~15-20%، تسهيل الصيانة، تسريع البناء.

---

> **نهاية خطة الجاهزية للإنتاج.**
> الرجوع إلى `00-MASTER-PLAN.md` للنظرة الشاملة.