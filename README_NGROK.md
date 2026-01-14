# إعداد ngrok للتجريب

## تثبيت ngrok

### Windows
1. قم بتحميل ngrok من: https://ngrok.com/download
2. قم بفك الضغط عن الملف
3. أضف ngrok إلى PATH أو ضع الملف في مجلد المشروع

أو استخدم Chocolatey:
```powershell
choco install ngrok
```

### macOS
```bash
brew install ngrok/ngrok/ngrok
```

### Linux
```bash
# Download and install
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

## تسجيل الدخول إلى ngrok

1. قم بإنشاء حساب مجاني على: https://dashboard.ngrok.com/signup
2. احصل على authtoken من: https://dashboard.ngrok.com/get-started/your-authtoken
3. قم بتسجيل الدخول:
```bash
ngrok config add-authtoken YOUR_AUTHTOKEN
```

## تشغيل ngrok

### الطريقة 1: استخدام السكريبت (موصى به)

**Windows (PowerShell):**
```powershell
.\start_ngrok.ps1
```

**Linux/macOS:**
```bash
chmod +x start_ngrok.sh
./start_ngrok.sh
```

### الطريقة 2: تشغيل يدوي

```bash
# تأكد من أن Django يعمل على المنفذ 8000
python manage.py runserver

# في terminal آخر، قم بتشغيل ngrok
ngrok http 8000
```

## الحصول على الرابط العام

بعد تشغيل ngrok، ستحصل على رابط مثل:
```
https://abc123.ngrok-free.app
```

يمكنك أيضاً فتح: http://localhost:4040 لرؤية واجهة ngrok

## تحديث الإعدادات

### 1. تحديث `.env` file:
```env
BACKEND_URL=https://abc123.ngrok-free.app
FRONTEND_URL=https://abc123.ngrok-free.app
```

### 2. Webhook URLs للبوابات:

**BaridiMob:**
```
https://abc123.ngrok-free.app/api/payments/webhooks/baridimob/
```

**Bank Card Gateway:**
```
https://abc123.ngrok-free.app/api/payments/webhooks/bank-card/
```

## ملاحظات مهمة

1. **الرابط يتغير**: في النسخة المجانية، الرابط يتغير في كل مرة تقوم بتشغيل ngrok
2. **لرابط ثابت**: تحتاج إلى خطة مدفوعة من ngrok
3. **HTTPS**: ngrok يوفر HTTPS تلقائياً
4. **Web Interface**: افتح http://localhost:4040 لرؤية جميع الطلبات

## اختبار Webhooks

يمكنك استخدام curl لاختبار webhooks:

```bash
curl -X POST https://abc123.ngrok-free.app/api/payments/webhooks/baridimob/ \
  -H "Content-Type: application/json" \
  -H "X-BaridiMob-Signature: test-signature" \
  -d '{
    "event_type": "payment.completed",
    "transaction_id": "test-123",
    "amount": 1000
  }'
```

## إيقاف ngrok

اضغط `Ctrl+C` في terminal الذي يعمل فيه ngrok
