# دليل الإعداد والتشغيل - ReadyRent.Gala

**التاريخ**: يناير 2026  
**الحالة**: ✅ ملفات البيئة محدثة

---

## ✅ المهام المكتملة

### 1. تحديث القيم الافتراضية في الكود

- ✅ تحديث `frontend/lib/seo.ts` لاستخدام `NEXT_PUBLIC_WHATSAPP_NUMBER`
- ✅ تحديث `frontend/components/whatsapp-button.tsx` لاستخدام متغيرات البيئة
- ✅ تحديث `frontend/components/footer.tsx` لاستخدام متغيرات البيئة

### 2. ملفات البيئة

- ✅ ملف `backend/.env` موجود ومحدث
- ✅ ملف `frontend/.env.local` موجود ومحدث
- ✅ إضافة جميع المتغيرات المطلوبة

---

## 📋 المهام المتبقية (تحتاج تنفيذ يدوي)

### المرحلة 1: إعداد البيئة والتكوين

#### 1. تحديث القيم الفعلية في ملفات البيئة

**`backend/.env`** - يجب تحديث القيم التالية:

```env
# استبدل هذه القيم بالقيم الفعلية:
SECRET_KEY=your-actual-secret-key-here
OPENAI_API_KEY=your-actual-openai-api-key
GOOGLE_MAPS_API_KEY=your-actual-google-maps-api-key
WHATSAPP_API_TOKEN=your-actual-whatsapp-api-token
WHATSAPP_PHONE_NUMBER_ID=your-actual-whatsapp-phone-number-id
EMAIL_HOST_USER=your-actual-email@example.com
EMAIL_HOST_PASSWORD=your-actual-email-password
SENTRY_DSN=your-actual-sentry-dsn
```

**من أين تحصل على هذه القيم:**

1. **SECRET_KEY**:

   - **التوليد**: استخدم الأمر التالي لتوليد مفتاح آمن:

     ```bash
     python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
     ```

   - أو استخدم [Django Secret Key Generator](https://djecrety.ir/) عبر الإنترنت

2. **OPENAI_API_KEY**:
   - انتقل إلى [OpenAI Platform](https://platform.openai.com/api-keys)
   - سجل الدخول أو أنشئ حساب جديد
   - اضغط على "Create new secret key"
   - انسخ المفتاح (سيظهر مرة واحدة فقط)

3. **GOOGLE_MAPS_API_KEY**:
   - انتقل إلى [Google Cloud Console](https://console.cloud.google.com/)
   - أنشئ مشروع جديد أو اختر مشروع موجود
   - اذهب إلى "APIs & Services" > "Credentials"
   - اضغط "Create Credentials" > "API Key"
   - قم بتقييد المفتاح (اختياري لكن موصى به)
   - انسخ المفتاح

4. **WHATSAPP_API_TOKEN** و **WHATSAPP_PHONE_NUMBER_ID**:
   - انتقل إلى [Meta for Developers](https://developers.facebook.com/)
   - أنشئ تطبيق WhatsApp Business
   - اتبع خطوات الإعداد للحصول على:
     - **Access Token**: من "WhatsApp" > "API Setup"
     - **Phone Number ID**: من "WhatsApp" > "Phone Numbers"
   - **ملاحظة**: يتطلب حساب WhatsApp Business API مدفوع

5. **EMAIL_HOST_USER** و **EMAIL_HOST_PASSWORD**:
   - استخدم بريد إلكتروني فعلي (Gmail، Outlook، إلخ)
   - **لـ Gmail**: استخدم [App Password](https://myaccount.google.com/apppasswords)
   - **لـ Outlook**: استخدم كلمة المرور العادية أو App Password
   - **لـ SMTP آخر**: راجع إعدادات مزود البريد الإلكتروني

6. **SENTRY_DSN** (اختياري - للمراقبة):

   - انتقل إلى [Sentry.io](https://sentry.io/)
   - أنشئ حساب جديد أو سجل الدخول
   - أنشئ مشروع جديد (اختر Django)
   - انسخ DSN من صفحة المشروع

**`frontend/.env.local`** - يجب تحديث القيم التالية:

```env
# استبدل هذه القيم بالقيم الفعلية:
NEXT_PUBLIC_WHATSAPP_NUMBER=+213XXXXXXXXX  # رقم WhatsApp الفعلي
NEXT_PUBLIC_PHONE_NUMBER=+213 XXX XXX XXX  # رقم الهاتف الفعلي
NEXT_PUBLIC_CONTACT_EMAIL=info@readyrent.gala  # البريد الإلكتروني الفعلي
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-google-maps-api-key
NEXT_PUBLIC_GA_TRACKING_ID=your-actual-google-analytics-id
NEXT_PUBLIC_FB_PIXEL_ID=your-actual-facebook-pixel-id
```

**من أين تحصل على هذه القيم:**

1. **NEXT_PUBLIC_WHATSAPP_NUMBER**:
   - استخدم رقم WhatsApp الفعلي للشركة/المنصة
   - الصيغة: `+213XXXXXXXXX` (مع رمز الدولة)
   - مثال: `+213555123456`

2. **NEXT_PUBLIC_PHONE_NUMBER**:
   - استخدم رقم الهاتف الفعلي للشركة/المنصة
   - يمكن استخدام نفس رقم WhatsApp أو رقم مختلف

3. **NEXT_PUBLIC_CONTACT_EMAIL**:
   - استخدم البريد الإلكتروني الفعلي للاتصال
   - مثال: `info@readyrent.gala` أو `contact@readyrent.gala`

4. **NEXT_PUBLIC_GOOGLE_MAPS_API_KEY**:
   - نفس المفتاح المستخدم في `backend/.env`
   - راجع التعليمات أعلاه للحصول على المفتاح

5. **NEXT_PUBLIC_GA_TRACKING_ID**:
   - انتقل إلى [Google Analytics](https://analytics.google.com/)
   - أنشئ حساب جديد أو سجل الدخول
   - أنشئ Property جديد
   - اذهب إلى "Admin" > "Data Streams" > "Web"
   - انسخ "Measurement ID" (يبدأ بـ `G-`)

6. **NEXT_PUBLIC_FB_PIXEL_ID** (اختياري):
   - انتقل إلى [Facebook Business Manager](https://business.facebook.com/)
   - اذهب إلى "Events Manager" > "Data Sources" > "Pixels"
   - اضغط "Create a Pixel" أو اختر Pixel موجود
   - انسخ "Pixel ID" (رقم مكون من 15-16 رقم)

#### 2. تشغيل Docker واختبار الخدمات

```bash
# تشغيل جميع الخدمات
docker-compose up -d

# التحقق من حالة الخدمات
docker-compose ps

# عرض السجلات
docker-compose logs -f

# التحقق من Health Checks
docker-compose ps  # يجب أن تظهر جميع الخدمات "healthy"
```

#### 3. التحقق من Health Checks

```bash
# Backend Health Check
curl http://localhost:8000/api/health/

# Frontend Health Check
curl http://localhost:3001/

# Database Health Check
docker-compose exec db pg_isready -U postgres

# Redis Health Check
docker-compose exec redis redis-cli ping
```

---

### المرحلة 2: البيانات التجريبية

#### 1. إعداد بيئة التطوير (اختياري - باستخدام Script)

**Windows:**

```bash
cd backend
scripts\setup_dev.bat
```

**Linux/Mac:**

```bash
cd backend
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

#### 2. تشغيل Migrations

```bash
# الانتقال إلى مجلد Backend
cd backend

# إنشاء Migrations (إذا لزم الأمر)
python manage.py makemigrations

# أو استخدام Script
scripts\create_migrations.bat  # Windows
# أو
./scripts/create_migrations.sh  # Linux/Mac

# تطبيق Migrations
python manage.py migrate
```

#### 3. إنشاء Admin User

**باستخدام Script (موصى به):**

**Windows:**

```bash
cd backend
scripts\create_admin.bat
```

**Linux/Mac:**

```bash
cd backend
chmod +x scripts/create_admin.sh
./scripts/create_admin.sh
```

**أو يدوياً:**

```bash
# إنشاء Admin User باستخدام Management Command
python manage.py create_demo_admin

# أو إنشاء Superuser يدوياً
python manage.py createsuperuser
```

**ملاحظة**: الافتراضي:

- Email: `admin@readyrent.gala`
- Username: `admin`
- Password: `admin123`

#### 4. إضافة البيانات التجريبية

**باستخدام Script (موصى به):**

**Windows:**

```bash
cd backend
scripts\run_seed_data.bat
```

**Linux/Mac:**

```bash
cd backend
chmod +x scripts/run_seed_data.sh
./scripts/run_seed_data.sh
```

**أو يدوياً:**

```bash
# إضافة بيانات تجريبية شاملة لجميع التطبيقات الـ 21
python manage.py seed_data

# أو مع مسح البيانات الموجودة
python manage.py seed_data --clear
```

**ملاحظة**: راجع [`backend/scripts/README.md`](backend/scripts/README.md) لمزيد من التفاصيل عن الـ Scripts المتوفرة.

#### 4. التحقق من البيانات التجريبية

```bash
# فتح Django Shell
python manage.py shell

# التحقق من البيانات
from apps.products.models import Product, Category
from apps.users.models import User
from apps.bookings.models import Booking

print(f"Products: {Product.objects.count()}")
print(f"Categories: {Category.objects.count()}")
print(f"Users: {User.objects.count()}")
print(f"Bookings: {Booking.objects.count()}")
```

---

### المرحلة 3: الاختبارات

#### 1. إعداد Frontend (اختياري - باستخدام Script)

**Windows:**

```bash
cd frontend
scripts\setup_dev.bat
```

**Linux/Mac:**

```bash
cd frontend
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

#### 2. تشغيل Backend Tests

```bash
cd backend

# تشغيل جميع الاختبارات
pytest

# تشغيل الاختبارات مع Coverage
pytest --cov=. --cov-report=html

# أو استخدام السكريبت المخصص
# Windows:
.\tests\run_tests_with_coverage.bat

# Linux/Mac:
./tests/run_tests_with_coverage.sh
```

#### 3. تشغيل Frontend Tests

```bash
cd frontend

# تشغيل Component Tests
npm test

# تشغيل E2E Tests
npm run test:e2e

# تشغيل Tests مع Coverage
npm run test:coverage
```

**ملاحظة**: راجع [`frontend/scripts/README.md`](frontend/scripts/README.md) لمزيد من التفاصيل عن الـ Scripts المتوفرة.

#### 3. تشغيل Lighthouse CI

```bash
cd frontend

# تشغيل Lighthouse CI
npm run lighthouse

# أو استخدام Lighthouse CI مباشرة
npx lighthouse-ci --config=.lighthouserc.js
```

---

### المرحلة 4: المحتوى والصفحات الثابتة

#### 1. إضافة المحتوى عبر CMS

1. تسجيل الدخول إلى Admin Panel: `http://localhost:8000/admin`
2. الانتقال إلى CMS > Pages
3. إضافة محتوى للصفحات التالية:
   - من نحن (About Us)
   - اتصل بنا (Contact Us)
   - الشروط والأحكام (Terms & Conditions)
   - سياسة الخصوصية (Privacy Policy)
   - سياسة الإرجاع (Return Policy)
   - الأسئلة الشائعة (FAQ)

#### 2. رفع صور المنتجات

1. الانتقال إلى Admin Panel > Products
2. اختيار منتج
3. رفع صور فعلية للمنتج
4. التأكد من تحسين الصور (Image Optimization)

#### 3. التحقق من المحتوى

- [ ] جميع النصوص بالعربية والإنجليزية
- [ ] جميع الصور محسّنة ومضغوطة
- [ ] جميع الروابط تعمل
- [ ] جميع النماذج تعمل

---

### المرحلة 5: التكاملات الخارجية

#### 1. تكوين Google Maps API

1. الحصول على API Key من [Google Cloud Console](https://console.cloud.google.com/)
2. تفعيل APIs التالية:
   - Maps JavaScript API
   - Geocoding API
   - Places API
3. إضافة API Key إلى `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-actual-api-key
   ```

#### 2. تكوين WhatsApp Business API (اختياري)

1. إنشاء حساب WhatsApp Business API
2. الحصول على API Token و Phone Number ID
3. إضافة القيم إلى `backend/.env`:

   ```env
   WHATSAPP_API_TOKEN=your-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
   ```

#### 3. تكوين OpenAI API

1. الحصول على API Key من [OpenAI](https://platform.openai.com/)
2. إضافة API Key إلى `backend/.env`:

   ```env
   OPENAI_API_KEY=your-actual-api-key
   ```

#### 4. تكوين Google Analytics

1. إنشاء حساب Google Analytics
2. الحصول على Tracking ID
3. إضافة Tracking ID إلى `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
   ```

#### 5. تكوين Facebook Pixel (اختياري)

1. إنشاء Facebook Pixel من Facebook Business Manager
2. الحصول على Pixel ID
3. إضافة Pixel ID إلى `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_FB_PIXEL_ID=your-pixel-id
   ```

---

### المرحلة 6: معلومات الاتصال والدعم

#### 1. تحديث معلومات الاتصال عبر CMS

1. تسجيل الدخول إلى Admin Panel
2. الانتقال إلى CMS > Pages > Contact Us
3. تحديث:
   - Contact email
   - Support email
   - WhatsApp number
   - Phone number
   - Address

#### 2. تحديث Social Media Links

1. الانتقال إلى CMS > Pages
2. إضافة روابط Social Media:
   - Instagram
   - Facebook
   - TikTok
   - Twitter/X

---

## 🔍 التحقق النهائي

### Checklist قبل الإطلاق التجريبي

- [ ] جميع ملفات `.env` محدثة بالقيم الفعلية
- [ ] Docker يعمل بشكل صحيح
- [ ] جميع Health Checks تعمل
- [ ] Migrations مطبقة
- [ ] Admin User موجود
- [ ] البيانات التجريبية موجودة
- [ ] جميع الاختبارات تمر
- [ ] Lighthouse Score > 90
- [ ] المحتوى مضاف عبر CMS
- [ ] صور المنتجات مرفوعة
- [ ] التكاملات الخارجية مكونة
- [ ] معلومات الاتصال محدثة

---

## 📞 الدعم

للمساعدة أو الاستفسارات:

- Email: [info@readyrent.gala](mailto:info@readyrent.gala)
- Documentation: راجع [`README.md`](README.md) و [`DEPLOYMENT.md`](DEPLOYMENT.md)

---

**© 2026 ReadyRent.Gala. جميع الحقوق محفوظة.**
