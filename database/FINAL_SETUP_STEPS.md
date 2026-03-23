# 🔗 خطوات الربط النهائية بـ Supabase

## ✅ تم تحديث الملفات

1. ✅ `config/settings.py` - تم التحديث لاستخدام PostgreSQL
2. ✅ `backend/.env` - تم إضافة معلومات الاتصال

---

## 🔑 الخطوة المهمة: كلمة المرور

**أنت بحاجة لكلمة مرور قاعدة البيانات من Supabase:**

1. افتح [Supabase Dashboard](https://supabase.com/dashboard/project/mwmpdpwjokdwcnifopxs/settings/database)
2. اذهب إلى **Settings** → **Database**
3. ابحث عن **Database Password** أو **Connection Pooling**
4. انسخ الباسورد

### عدّل ملف `.env`:

```env
DB_PASSWORD=الصق_الباسورد_هنا
```

---

## 🚀 بعد إضافة الباسورد

شغّل هذه الأوامر في Terminal:

```bash
cd backend

# 1. إيقاف السيرفر الحالي (Ctrl+C)

# 2. تثبيت مكتبة PostgreSQL (إذا لم تكن مثبتة)
pip install psycopg2-binary

# 3. تشغيل Migrations لإنشاء الجداول في Supabase
python manage.py migrate

# 4. إنشاء مستخدم Admin جديد
python manage.py createsuperuser

# 5. تشغيل السيرفر
python manage.py runserver
```

---

## 🔍 التحقق من النجاح

بعد `python manage.py migrate`، يجب أن ترى:

```
Running migrations:
  Applying products.0001_initial... OK
  Applying bookings.0001_initial... OK
  ...
```

✅ **الآن يمكنك تطبيق RLS Policies** في Supabase SQL Editor!

---

## ⚠️ إذا حدثت مشاكل

### خطأ: "Connection refused"
- تأكد من كلمة المرور صحيحة
- استخدم Connection Pooling بدلاً من Direct Connection

### خطأ: "FATAL: no pg_hba.conf entry"
- تأكد من `sslmode: require` في settings.py (تم إضافته)

---

**بعدها مباشرةً:**
1. 🔐 تطبيق RLS Policies
2. 🖼️ بناء Image Firewall
3. 🎯 تفعيل Risk Score
