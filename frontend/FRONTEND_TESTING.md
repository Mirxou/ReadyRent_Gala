# دليل اختبارات Frontend - ReadyRent.Gala

**التاريخ**: يناير 2026  
**الحالة**: ✅ جاهز للاستخدام

---

## نظرة عامة

هذا الدليل يوضح كيفية إعداد وتشغيل اختبارات Frontend لمنصة ReadyRent.Gala.

---

## أنواع الاختبارات

### 1. Unit Tests (اختبارات الوحدات)
اختبار المكونات الفردية بشكل منفصل باستخدام Jest و React Testing Library.

**الأدوات**:
- Jest
- React Testing Library
- @testing-library/jest-dom
- @testing-library/user-event

**الملفات**: `__tests__/**/*.test.tsx`

### 2. Integration Tests (اختبارات التكامل)
اختبار تفاعل المكونات مع بعضها البعض ومع APIs.

**الأدوات**:
- Jest
- React Testing Library
- Mock Service Worker (MSW) - للـ API mocking

**الملفات**: `__tests__/integration/**/*.test.tsx`

### 3. E2E Tests (اختبارات End-to-End)
اختبار التطبيق الكامل من منظور المستخدم باستخدام Playwright.

**الأدوات**:
- Playwright
- @playwright/test

**الملفات**: `e2e/**/*.spec.ts`

### 4. Performance Tests (اختبارات الأداء)
قياس أداء التطبيق باستخدام Lighthouse CI.

**الأدوات**:
- Lighthouse CI
- @lhci/cli

**الملفات**: `.lighthouserc.js`

---

## الإعداد

### تثبيت المتطلبات

```bash
cd frontend
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  @lhci/cli \
  jest \
  jest-environment-jsdom \
  @types/jest \
  ts-jest
```

### إعداد Jest

ملف `jest.config.js` موجود ويحتوي على:
- إعدادات Next.js
- Module name mapping
- Coverage thresholds
- Test file patterns

### إعداد Playwright

ملف `playwright.config.ts` موجود ويحتوي على:
- إعدادات المتصفحات (Chrome, Firefox, Safari)
- إعدادات Mobile (Chrome Mobile, Safari Mobile)
- إعدادات Web Server
- Screenshots و Traces

### إعداد Lighthouse CI

ملف `.lighthouserc.js` موجود ويحتوي على:
- URLs للاختبار
- Score thresholds
- Number of runs

---

## تشغيل الاختبارات

### Unit Tests

```bash
# تشغيل جميع الاختبارات
npm run test

# تشغيل في وضع Watch
npm run test:watch

# تشغيل مع Coverage
npm run test:coverage
```

### Integration Tests

```bash
# تشغيل اختبارات التكامل
npm run test -- __tests__/integration
```

### E2E Tests

```bash
# تشغيل جميع اختبارات E2E
npm run test:e2e

# تشغيل مع UI
npm run test:e2e:ui

# تشغيل في وضع Headed (مع عرض المتصفح)
npm run test:e2e:headed

# تشغيل اختبار محدد
npx playwright test e2e/homepage.spec.ts
```

### Performance Tests (Lighthouse)

```bash
# تشغيل Lighthouse CI
npm run test:lighthouse

# ملاحظة: يتطلب تشغيل الخادم أولاً
npm run build
npm run start
# ثم في terminal آخر:
npm run test:lighthouse
```

---

## أمثلة الاختبارات

### Unit Test Example

```typescript
// __tests__/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react'
import ProductCard from '@/components/ProductCard'

describe('ProductCard', () => {
  it('renders product name', () => {
    const product = { name: 'Test Dress', price: 1000 }
    render(<ProductCard product={product} />)
    expect(screen.getByText('Test Dress')).toBeInTheDocument()
  })
})
```

### Integration Test Example

```typescript
// __tests__/integration/cart.test.tsx
import { render, screen } from '@testing-library/react'
import Cart from '@/app/cart/page'

describe('Cart Integration', () => {
  it('displays cart items', async () => {
    render(<Cart />)
    // Test cart functionality
  })
})
```

### E2E Test Example

```typescript
// e2e/homepage.spec.ts
import { test, expect } from '@playwright/test'

test('should load homepage', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/ReadyRent/i)
})
```

---

## Coverage Goals

الهدف هو تحقيق تغطية كود لا تقل عن:
- **Branches**: 60%
- **Functions**: 60%
- **Lines**: 60%
- **Statements**: 60%

---

## CI/CD Integration

تم إعداد GitHub Actions workflows للاختبارات:
- `.github/workflows/frontend-tests.yml` - Unit Tests, E2E Tests, Lighthouse CI

---

## Best Practices

### Unit Tests
1. اختبار سلوك المكون، وليس التنفيذ
2. استخدام `data-testid` للعناصر المهمة
3. Mocking للـ APIs والـ Dependencies
4. اختبار الحالات المختلفة (Success, Error, Loading)

### Integration Tests
1. اختبار التفاعل بين المكونات
2. Mocking للـ APIs باستخدام MSW
3. اختبار تدفقات المستخدم الكاملة

### E2E Tests
1. اختبار السيناريوهات الحقيقية للمستخدم
2. استخدام Page Object Model
3. اختبار على متصفحات متعددة
4. اختبار Responsive Design

### Performance Tests
1. تشغيل Lighthouse على الصفحات الرئيسية
2. مراقبة Core Web Vitals
3. التأكد من Score > 90 في جميع الفئات

---

## Troubleshooting

### مشاكل شائعة

1. **Jest cannot find module**
   - تأكد من إعداد `moduleNameMapper` في `jest.config.js`

2. **Playwright tests timeout**
   - تأكد من تشغيل الخادم قبل الاختبارات
   - زيادة `timeout` في `playwright.config.ts`

3. **Lighthouse CI fails**
   - تأكد من تشغيل الخادم قبل Lighthouse
   - تحقق من `startServerCommand` في `.lighthouserc.js`

---

## المراجع

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)

---

**© 2026 ReadyRent.Gala. جميع الحقوق محفوظة.**

