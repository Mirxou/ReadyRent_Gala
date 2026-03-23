# 🔐 دليل تطبيق سياسات RLS في Supabase

## 📋 الخطوات

### 1. الوصول إلى Supabase SQL Editor

1. افتح لوحة تحكم Supabase: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. اختر مشروع **ReadyRent-DB**
3. من القائمة الجانبية، اختر **SQL Editor**

### 2. تنفيذ السياسات

1. انسخ محتوى الملف [`supabase_rls_policies.sql`](file:///c:/Users/pc/Desktop/ReadyRent_Gala/database/supabase_rls_policies.sql)
2. الصق الكود في SQL Editor
3. اضغط **Run** (أو Ctrl+Enter)

### 3. التحقق من النجاح

بعد التنفيذ، شغّل هذا الاستعلام للتحقق:

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename IN ('products', 'bookings', 'smart_agreements', 'reviews', 'disputes');
```

**النتيجة المتوقعة:** `rowsecurity = true` لكل الجداول.

---

## ⚠️ ملاحظات مهمة

### 1. تحديث Django Settings

بعد تفعيل RLS، يجب التأكد من أن Django يمرر `user_id` في الطلبات. تحقق من:

```python
# في settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'OPTIONS': {
            'options': f'-c search_path=public -c role=authenticated'
        }
    }
}
```

### 2. اختبار من Frontend

بعد التطبيق، جرب:
1. تسجيل دخول كـ User A
2. محاولة تعديل منتج يملكه User B
3. **النتيجة المتوقعة:** `403 Forbidden` أو لا يحدث شيء

---

## 🔄 التراجع (Rollback)

إذا حدثت مشاكل، شغّل:

```sql
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
```

---

## ✅ التالي

بعد تفعيل RLS، الأولوية التالية هي:
- 🔴 **Image Firewall** (EXIF Removal + Compression)
- 🟡 **Risk Score Calculator** (Automated Trust)
