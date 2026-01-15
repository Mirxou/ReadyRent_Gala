# Scripts مساعدة - Frontend

هذا المجلد يحتوي على scripts مساعدة لتسهيل إعداد وتشغيل المشروع.

## Scripts المتوفرة

### Windows (.bat)

#### `setup_dev.bat`
إعداد بيئة التطوير:
- تثبيت المتطلبات (npm install)
- عرض الخطوات التالية

**الاستخدام:**
```bash
cd frontend
scripts\setup_dev.bat
```

### Linux/Mac (.sh)

#### `setup_dev.sh`
إعداد بيئة التطوير:
- تثبيت المتطلبات (npm install)
- عرض الخطوات التالية

**الاستخدام:**
```bash
cd frontend
chmod +x scripts/setup_dev.sh
./scripts/setup_dev.sh
```

## ترتيب الاستخدام المقترح

1. **إعداد البيئة:**
   ```bash
   scripts\setup_dev.bat  # Windows
   # أو
   ./scripts/setup_dev.sh  # Linux/Mac
   ```

2. **تحديث ملف .env.local:**
   - افتح `frontend/.env.local`
   - استبدل القيم الافتراضية بالقيم الفعلية

3. **تشغيل خادم التطوير:**
   ```bash
   npm run dev
   ```

## ملاحظات

- تأكد من تحديث ملف `.env.local` قبل تشغيل المشروع
- تأكد من تثبيت Node.js 20+ قبل تشغيل الـ scripts

---

**© 2026 ReadyRent.Gala. جميع الحقوق محفوظة.**

