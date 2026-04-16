# دليل النشر - STANDARD.Rent

## نظرة عامة

هذا الدليل يوضح خطوات نشر منصة STANDARD.Rent على خادم إنتاج.

## المتطلبات الأساسية

### فحوصات ما قبل النشر

قبل البدء في النشر، تأكد من:

1. **فحص متغيرات البيئة**:

   ```bash
   # في مجلد backend
   python -c "import os; from pathlib import Path; from dotenv import load_dotenv; load_dotenv(); from config.settings import *; print('Environment variables OK')"
   ```

2. **فحص اتصال قاعدة البيانات**:

   ```bash
   python manage.py dbshell --command="SELECT 1;"
   ```

3. **فحص اتصال Redis**:

   ```bash
   redis-cli ping
   ```

4. **فحص Celery**:

   ```bash
   celery -A config inspect active
   ```

5. **تشغيل الاختبارات**:

   ```bash
   python manage.py test --settings=config.test_settings
   ```

6. **فحص صحة التطبيق**:

   ```bash
   python manage.py check --deploy
   ```

### المتطلبات على الخادم

- **Python**: 3.11 أو أحدث
- **Node.js**: 18.x أو أحدث
- **PostgreSQL**: 14.x أو أحدث
- **Redis**: 7.x أو أحدث
- **Nginx**: 1.18 أو أحدث
- **Docker & Docker Compose** (اختياري لكن مُوصى به)

### أدوات مساعدة

- Git
- SSL Certificate (Let's Encrypt مُوصى به)

## 1. إعداد الخادم

### تحديث النظام

```bash
sudo apt update
sudo apt upgrade -y
```

### تثبيت المتطلبات

```bash
# Python و pip
sudo apt install python3.11 python3-pip python3-venv -y

# PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Redis
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis

# فحص اتصال Redis
redis-cli ping

# Nginx
sudo apt install nginx -y

# Node.js (استخدم nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# PM2 (لإدارة Next.js)
npm install -g pm2
```

## 2. إعداد قاعدة البيانات

### إنشاء قاعدة البيانات والمستخدم

```bash
sudo -u postgres psql

-- في PostgreSQL prompt:
CREATE DATABASE STANDARD_Rent;
CREATE USER STANDARD_user WITH PASSWORD 'your_secure_password';
ALTER ROLE STANDARD_user SET client_encoding TO 'utf8';
ALTER ROLE STANDARD_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE STANDARD_user SET timezone TO 'Africa/Algiers';
GRANT ALL PRIVILEGES ON DATABASE STANDARD_Rent TO STANDARD_user;
\q
```

## 3. إعداد Backend (Django)

### استنساخ المشروع

```bash
cd /var/www
git clone <repository-url> STANDARD_Rent
cd STANDARD_Rent/backend
```

### إعداد البيئة الافتراضية

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### إعداد متغيرات البيئة

```bash
cp .env.example .env
nano .env
```

أضف/حدث القيم التالية:

```env
# Django Core
DEBUG=False
SECRET_KEY=your-production-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=STANDARD_Rent
DB_USER=STANDARD_user
DB_PASSWORD=your_secure_password
DB_HOST=localhost
DB_PORT=5432

# Redis (for Cache and Sessions)
REDIS_URL=redis://localhost:6379/1
REDIS_HOST=localhost
REDIS_PORT=6379

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Email
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@STANDARD.Rent

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# File Storage (S3 - Optional)
USE_S3=False
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_STORAGE_BUCKET_NAME=your-bucket-name
AWS_S3_REGION_NAME=us-east-1

# Image Optimization
IMAGE_OPTIMIZATION_ENABLED=True
IMAGE_QUALITY=85
CDN_DOMAIN=cdn.yourdomain.com

# Backup
BACKUP_DIR=/var/www/STANDARD_Rent/backups
BACKUP_RETENTION_DAYS=7

# APIs
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
WHATSAPP_API_URL=https://api.whatsapp.com
WHATSAPP_API_TOKEN=your-whatsapp-token
OPENAI_API_KEY=your-openai-key

# Analytics & Monitoring
SENTRY_DSN=your-sentry-dsn
```

### تشغيل Migrations

```bash
# فحص ما قبل الترحيل
python manage.py check
python manage.py makemigrations --dry-run
python manage.py showmigrations

# تطبيق الترحيلات
python manage.py migrate

# فحص ما بعد الترحيل
python manage.py check
python manage.py test --settings=config.test_minimal_settings --keepdb
```

### إعداد Celery Beat

```bash
# فحص إعداد Celery
celery -A config beat --dry-run
```

## 4. إعداد Frontend (Next.js)

```bash
cd /var/www/STANDARD_Rent/frontend
npm install
```

### إعداد متغيرات البيئة

```bash
cp .env.example .env.local
nano .env.local
```

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXT_PUBLIC_GA_TRACKING_ID=your-ga-id
NEXT_PUBLIC_FB_PIXEL_ID=your-pixel-id
NEXT_PUBLIC_WHATSAPP_NUMBER=+213XXXXXXXXX
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
```

### بناء المشروع

```bash
npm run build
```

## 5. إعداد Nginx

### إعداد Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/STANDARD
```

```nginx
# Frontend (Next.js)
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend (HTTP)
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket (Daphne)
    location /ws/ {
        proxy_pass http://localhost:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Media files
    location /media/ {
        alias /var/www/STANDARD_Rent/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static files
    location /static/ {
        alias /var/www/STANDARD_Rent/backend/staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security Headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/STANDARD /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 6. إعداد SSL (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 7. إعداد Gunicorn و Daphne

### Gunicorn (لـ WSGI - HTTP requests)

```bash
cd /var/www/STANDARD_Rent/backend
pip install gunicorn
```

إنشاء ملف Gunicorn:

```bash
nano gunicorn_config.py
```

```python
bind = "127.0.0.1:8000"
workers = 4
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
max_requests = 1000
max_requests_jitter = 50
```

### إنشاء Systemd Service

```bash
sudo nano /etc/systemd/system/STANDARD-backend.service
```

```ini
[Unit]
Description=STANDARD.Rent Backend (Gunicorn)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/STANDARD_Rent/backend
Environment="PATH=/var/www/STANDARD_Rent/backend/venv/bin"
ExecStart=/var/www/STANDARD_Rent/backend/venv/bin/gunicorn config.wsgi:application --config gunicorn_config.py

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start STANDARD-backend
sudo systemctl enable STANDARD-backend
```

### Daphne (لـ ASGI - WebSocket)

```bash
cd /var/www/STANDARD_Rent/backend
pip install daphne
```

إنشاء ملف Daphne service:

```bash
sudo nano /etc/systemd/system/STANDARD-daphne.service
```

```ini
[Unit]
Description=STANDARD.Rent Daphne (ASGI/WebSocket)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/STANDARD_Rent/backend
Environment="PATH=/var/www/STANDARD_Rent/backend/venv/bin"
ExecStart=/var/www/STANDARD_Rent/backend/venv/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start STANDARD-daphne
sudo systemctl enable STANDARD-daphne
```

**ملاحظة**: يمكن استخدام Daphne بدلاً من Gunicorn إذا كنت تريد دعم WebSocket فقط، أو استخدامهما معاً (Gunicorn للـ HTTP و Daphne للـ WebSocket).

## 8. إعداد Celery

### إعداد Celery Worker

```bash
sudo nano /etc/systemd/system/STANDARD-celery.service
```

```ini
[Unit]
Description=STANDARD.Rent Celery Worker
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/STANDARD_Rent/backend
Environment="PATH=/var/www/STANDARD_Rent/backend/venv/bin"
ExecStart=/var/www/STANDARD_Rent/backend/venv/bin/celery -A config worker -l info

[Install]
WantedBy=multi-user.target
```

### إعداد Celery Beat

```bash
sudo nano /etc/systemd/system/STANDARD-celery-beat.service
```

```ini
[Unit]
Description=STANDARD.Rent Celery Beat
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/STANDARD_Rent/backend
Environment="PATH=/var/www/STANDARD_Rent/backend/venv/bin"
ExecStart=/var/www/STANDARD_Rent/backend/venv/bin/celery -A config beat -l info

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start STANDARD-celery
sudo systemctl start STANDARD-celery-beat
sudo systemctl enable STANDARD-celery
sudo systemctl enable STANDARD-celery-beat
```

## 9. إعداد Next.js مع PM2

```bash
cd /var/www/STANDARD_Rent/frontend
pm2 start npm --name "STANDARD-frontend" -- start
pm2 save
pm2 startup
```

## 10. النسخ الاحتياطي التلقائي

النسخ الاحتياطي يتم تلقائياً عبر Celery Beat (يومياً).

للنسخ اليدوي:

```bash
cd /var/www/STANDARD_Rent/backend
source venv/bin/activate
python manage.py backup_db
python manage.py backup_media
```

## 11. المراقبة والصيانة

### مراقبة الخدمات

```bash
# Backend (Gunicorn)
sudo systemctl status STANDARD-backend

# Daphne (WebSocket)
sudo systemctl status STANDARD-daphne

# Celery
sudo systemctl status STANDARD-celery
sudo systemctl status STANDARD-celery-beat

# Frontend
pm2 status
pm2 logs STANDARD-frontend

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql

# Redis
sudo systemctl status redis
```

### سجلات (Logs)

```bash
# Backend logs (Gunicorn)
sudo journalctl -u STANDARD-backend -f

# Daphne logs (WebSocket)
sudo journalctl -u STANDARD-daphne -f

# Celery logs
sudo journalctl -u STANDARD-celery -f
sudo journalctl -u STANDARD-celery-beat -f

# Frontend logs
pm2 logs STANDARD-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 12. التحديثات

### تحديث الكود

```bash
cd /var/www/STANDARD_Rent
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart STANDARD-backend
sudo systemctl restart STANDARD-daphne

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart STANDARD-frontend
```

## 13. الأمان

- تأكد من تحديث النظام بانتظام
- استخدم كلمات مرور قوية
- فعّل جدار الحماية (UFW)
- راجع أذونات الملفات
- راجع سجلات الأمان بانتظام

## 14. ملاحظات التطوير

### توحيد ملفات الإعدادات

يستخدم المشروع متغيرات البيئة للتحكم في سلوك التطبيق عبر البيئات المختلفة:

- `DEBUG`: التحكم في وضع التطوير
- `DATABASE_URL`: إعداد قاعدة البيانات
- `REDIS_URL`: إعداد Redis
- `SECRET_KEY`: مفتاح Django السري

تجنب تعديل ملفات الإعدادات مباشرة؛ استخدم متغيرات البيئة بدلاً من ذلك.

### فحص التوافق

قبل كل تحديث، قم بفحص:

- توافق المتطلبات مع إصدارات Python و Node.js
- تغييرات في قاعدة البيانات (Migrations)
- تحديثات الأمان في التبعيات

```bash
# جدار الحماية
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 14. استكشاف الأخطاء

### مشاكل شائعة

1. **خطأ في الاتصال بقاعدة البيانات**: تحقق من إعدادات `.env` وخدمة PostgreSQL
2. **خطأ 502 Bad Gateway**: تحقق من تشغيل Gunicorn/Daphne و Next.js
3. **مشاكل SSL**: تأكد من صحة شهادات Let's Encrypt
4. **مشاكل Celery**: تحقق من تشغيل Redis والخدمات
5. **مشاكل WebSocket**: تحقق من تشغيل Daphne والاتصال بـ Redis
6. **مشاكل الملفات الثابتة**: تأكد من تشغيل `collectstatic` وأن Nginx يشير للمسار الصحيح

## الدعم

للمزيد من المساعدة، راجع:

- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
