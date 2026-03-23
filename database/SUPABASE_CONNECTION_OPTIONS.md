# ============================================
# خيارات ربط STANDARD.Rent بـ Supabase
# ============================================

## 📊 الوضع الحالي

Django يستخدم **SQLite محلي** (`db.sqlite3`)، بينما Supabase جاهز ولكن غير متصل.

---

## 🎯 الحل: ثلاثة خيارات

### الخيار 1: ✅ الربط المباشر بـ Supabase (الموصى به)
**المدة:** 10 دقائق  
**الأثر:** قاعدة بيانات إنتاجية فوراً

#### الخطوات:

1. **احصل على معلومات الاتصال من Supabase:**
   - افتح [Supabase Dashboard](https://supabase.com/dashboard)
   - اذهب إلى **Project Settings** → **Database**
   - انسخ **Connection String** (Direct Connection) أو:
     - Host: `db.<project-ref>.supabase.co`
     - Database: `postgres`
     - User: `postgres`
     - Password: `<your-password>`
     - Port: `5432`

2. **عدل ملف `.env`:**
   ```env
   # استبدل هذه القيم بقيم Supabase الحقيقية:
   DATABASE_URL=postgresql://postgres:<PASSWORD>@db.<PROJECT-REF>.supabase.co:5432/postgres
   
   # أو بالتفصيل:
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=<YOUR-SUPABASE-PASSWORD>
   DB_HOST=db.<PROJECT-REF>.supabase.co
   DB_PORT=5432
   ```

3. **شغل الترحيلات (Migrations):**
   ```bash
   cd backend
   python manage.py migrate
   ```

4. **الآن شغل RLS Policies:**
   الصق كود `supabase_rls_policies.sql` في Supabase SQL Editor.

---

### الخيار 2: 🔄 نسخ البيانات من SQLite إلى Supabase
**المدة:** 20 دقيقة  
**الاستخدام:** إذا كان لديك بيانات مهمة في SQLite

#### الخطوات:

1. **صدّر البيانات من SQLite:**
   ```bash
   python manage.py dumpdata --natural-foreign --natural-primary > data_backup.json
   ```

2. **غيّر إعدادات الاتصال في `.env`** (كما في الخيار 1)

3. **شغل Migrations:**
   ```bash
   python manage.py migrate
   ```

4. **استورد البيانات:**
   ```bash
   python manage.py loaddata data_backup.json
   ```

---

### الخيار 3: 🏠 البقاء مع PostgreSQL المحلي
**المدة:** 5 دقائق  
**الاستخدام:** للتطوير فقط

#### الخطوة:

1. **عدل `settings.py`:**
   ```python
   DATABASES = {
       'default': {
           'ENGINE': 'django.db.backends.postgresql',
           'NAME': env('DB_NAME'),
           'USER': env('DB_USER'),
           'PASSWORD': env('DB_PASSWORD'),
           'HOST': env('DB_HOST'),
           'PORT': env('DB_PORT'),
       }
   }
   ```

2. **تأكد من تشغيل PostgreSQL محلياً:**
   ```bash
   # Windows
   pg_ctl -D "C:\Program Files\PostgreSQL\<version>\data" start
   ```

3. **شغل Migrations:**
   ```bash
   python manage.py migrate
   ```

> ⚠️ **لا تطبق RLS هنا** - RLS خاص بـ Supabase فقط

---

## 🚀 التوصية النهائية

**اختر الخيار 1** (Supabase المباشر) لأنه:
- ✅ يتماشى مع الخطة الاستراتيجية (STANDARD.Rent.txt § 2.2)
- ✅ يفعّل RLS Policies فوراً
- ✅ قاعدة بيانات سحابية جاهزة للإنتاج
- ✅ لا حاجة لإدارة خادم PostgreSQL محلي

---

## 📝 الخطوة التالية

بعد ما تختار، أخبرني وسأساعدك في التطبيق! 🎯

