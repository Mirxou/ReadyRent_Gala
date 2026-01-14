# Scripts مساعدة - Backend

هذا المجلد يحتوي على scripts مساعدة لتسهيل إعداد وتشغيل المشروع.

## Scripts المتوفرة

### Windows (.bat)

#### `setup_dev.bat`
إعداد بيئة التطوير:
- إنشاء virtual environment (إذا لم يكن موجوداً)
- تثبيت المتطلبات
- عرض الخطوات التالية

**الاستخدام:**
```bash
cd backend
scripts\setup_dev.bat
```

#### `create_migrations.bat`
إنشاء migrations لجميع التطبيقات.

**الاستخدام:**
```bash
cd backend
scripts\create_migrations.bat
```

#### `create_admin.bat`
إنشاء admin user تجريبي.

**الاستخدام:**
```bash
cd backend
scripts\create_admin.bat
```

**البيانات الافتراضية:**
- Email: `admin@readyrent.gala`
- Password: `admin123`

#### `run_seed_data.bat`
تشغيل seed_data لإضافة بيانات تجريبية.

**الاستخدام:**
```bash
cd backend
scripts\run_seed_data.bat
```

### Linux/Mac (.sh)

#### `setup_dev.sh`
إعداد بيئة التطوير:
- إنشاء virtual environment (إذا لم يكن موجوداً)
- تثبيت المتطلبات
- عرض الخطوات التالية

**الاستخدام:**
```bash
cd backend
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

#### `create_migrations.sh`
إنشاء migrations لجميع التطبيقات.

**الاستخدام:**
```bash
cd backend
chmod +x scripts/create_migrations.sh
./scripts/create_migrations.sh
```

#### `create_admin.sh`
إنشاء admin user تجريبي.

**الاستخدام:**
```bash
cd backend
chmod +x scripts/create_admin.sh
./scripts/create_admin.sh
```

**البيانات الافتراضية:**
- Email: `admin@readyrent.gala`
- Password: `admin123`

#### `run_seed_data.sh`
تشغيل seed_data لإضافة بيانات تجريبية.

**الاستخدام:**
```bash
cd backend
chmod +x scripts/run_seed_data.sh
./scripts/run_seed_data.sh
```

## ترتيب الاستخدام المقترح

1. **إعداد البيئة:**
   ```bash
   scripts\setup_dev.bat  # Windows
   # أو
   ./scripts/setup_dev.sh  # Linux/Mac
   ```

2. **تحديث ملف .env:**
   - افتح `backend/.env`
   - استبدل القيم الافتراضية بالقيم الفعلية

3. **إنشاء Migrations:**
   ```bash
   python manage.py makemigrations
   ```

4. **تطبيق Migrations:**
   ```bash
   python manage.py migrate
   ```

5. **إنشاء Admin User:**
   ```bash
   scripts\create_admin.bat  # Windows
   # أو
   ./scripts/create_admin.sh  # Linux/Mac
   ```

6. **إضافة البيانات التجريبية:**
   ```bash
   scripts\run_seed_data.bat  # Windows
   # أو
   ./scripts/run_seed_data.sh  # Linux/Mac
   ```

## ملاحظات

- تأكد من تحديث ملف `.env` قبل تشغيل أي script
- جميع الـ scripts تتطلب تفعيل virtual environment أولاً
- بعض الـ scripts تقوم بتفعيل virtual environment تلقائياً

---

**© 2026 ReadyRent.Gala. جميع الحقوق محفوظة.**

