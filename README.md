# ReadyRent.Gala - منصة كراء الفساتين ومستلزمات المناسبات

منصة متكاملة لكراء الفساتين ومستلزمات المناسبات في قسنطينة والجزائر.

> **المقياس | شعارنا للأبد**  
> Standard | Our Motto Forever

## الرؤية

أن نكون **الخيار الأول في كراء أزياء ومستلزمات المناسبات بمعايير عالية** تواكب تطلعات عام 2026 وما بعده.

## الرسالة

توفير **تجربة كراء راقية، مرنة، وآمنة**، تضع الأناقة في متناول الجميع لكل مناسبة.

## البنية التقنية

- **Backend**: Django 5.0+ (Python) مع Django REST Framework
- **Frontend**: Next.js 16+ (React + TypeScript) مع App Router
- **Database**: PostgreSQL + Redis
- **Deployment**: Docker, Vercel (Frontend), Railway/Render (Backend)

## البدء السريع

### المتطلبات

- Docker & Docker Compose
- Node.js 20+
- Python 3.11+ (للتنمية المحلية بدون Docker)

### التشغيل باستخدام Docker

```bash
# تشغيل جميع الخدمات
docker-compose up

# Backend فقط
docker-compose up backend db redis

# Frontend فقط
docker-compose up frontend
```

### التشغيل المحلي (بدون Docker)

#### Backend

```bash
cd backend

# إنشاء virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# أو
venv\Scripts\activate  # Windows

# تثبيت المتطلبات
pip install -r requirements.txt

# إنشاء migrations
python manage.py makemigrations

# تطبيق migrations
python manage.py migrate

# إنشاء superuser
python manage.py createsuperuser

# تشغيل الخادم
python manage.py runserver
```

#### Frontend

```bash
cd frontend

# تثبيت المتطلبات
npm install

# تشغيل الخادم التطويري
npm run dev
```

## هيكل المشروع

```text
ReadyRent_Gala/
├── backend/          # Django Backend
│   ├── apps/        # التطبيقات
│   ├── config/      # إعدادات Django
│   └── manage.py
├── frontend/        # Next.js Frontend
│   ├── app/         # App Router
│   ├── components/  # مكونات React
│   └── lib/         # Utilities
├── docker-compose.yml
└── README.md
```

## التطبيقات المتوفرة

### Backend Apps (21 تطبيق)

1. **users** - إدارة المستخدمين والمصادقة
2. **products** - كتالوج المنتجات
3. **bookings** - نظام الحجز
4. **inventory** - إدارة المخزون
5. **maintenance** - الصيانة والتنظيف
6. **returns** - الإرجاع والاسترداد
7. **locations** - المواقع والتسليم مع GPS
8. **hygiene** - التعقيم والتتبع
9. **packaging** - نظام التغليف الذكي
10. **warranties** - الضمانات والتأمين
11. **bundles** - الحجز المجمع مع خصومات
12. **local_guide** - دليل المناسبات المحلية
13. **artisans** - قسم الحرفيات المحليات
14. **chatbot** - دعم فني ذكي (OpenAI)
15. **analytics** - التحليلات والتقارير
16. **notifications** - نظام الإشعارات
17. **reviews** - التقييمات والمراجعات
18. **disputes** - إدارة النزاعات
19. **vendors** - إدارة الموردين
20. **branches** - إدارة الفروع المتعددة
21. **cms** - إدارة المحتوى (الصفحات، المدونة، الشعارات، FAQ)

## API Documentation

بعد تشغيل Backend، يمكنك الوصول إلى:

- **Swagger UI**: <http://localhost:8000/api/docs/>
- **ReDoc**: <http://localhost:8000/api/redoc/>

## متغيرات البيئة

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
DB_NAME=readyrent_gala
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
REDIS_URL=redis://localhost:6379/1
OPENAI_API_KEY=your-openai-api-key
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## الميزات الرئيسية

- ✅ كتالوج فساتين متقدم مع صور عالية الجودة
- ✅ نظام بحث وفلترة متقدم (حجم، لون، مناسبة، سعر)
- ✅ تقويم توفر تفاعلي مع نظام Waitlist
- ✅ نظام حجز مجمع (Bundles) مع خصومات
- ✅ نظام توصيل مع تتبع GPS
- ✅ نظام تعقيم وتتبع النظافة
- ✅ دليل المناسبات المحلية
- ✅ قسم الحرفيات المحليات
- ✅ نظام KYC/التحقق من الهوية
- ✅ نظام تقييم الأضرار والتوثيق
- ✅ نظام إدارة النزاعات
- ✅ نظام التأمين المتقدم
- ✅ نظام إدارة الموظفين والأدوار
- ✅ نظام التنبؤ بالطلب
- ✅ نظام CMS شامل

## التكاملات الخارجية

- **Google Maps API** - تحديد المواقع وتتبع GPS
- **WhatsApp Business API** - الإشعارات والتواصل
- **OpenAI API** - Chatbot ذكي للدعم الفني
- **Google Analytics & Facebook Pixel** - التحليلات والتتبع
- **AWS S3/Cloudinary** - تخزين الصور والملفات
- **Sentry** - تتبع الأخطاء ومراقبة الأداء

## الوثائق

### للمطورين
- [دليل الإعداد والتشغيل](SETUP_GUIDE.md) - دليل شامل لإعداد البيئة وتشغيل المشروع ✅
- [دليل النشر](DEPLOYMENT.md) - دليل شامل لنشر المنصة على خادم إنتاج
- [حالة المشروع](PROJECT_STATUS.md) - حالة المشروع الحالية والإنجازات
- [مراجعة الأمان](SECURITY_REVIEW.md) - مراجعة شاملة لأمان المنصة
- [دليل الاختبارات](backend/tests/README.md) - دليل تفصيلي للاختبارات

### للإداريين
- [دليل الإدارة](ADMIN_GUIDE.md) - دليل شامل لإدارة المنصة

## الترخيص

جميع الحقوق محفوظة © 2026 ReadyRent.Gala
