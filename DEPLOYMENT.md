# دليل النشر - ReadyRent.Gala

## نظرة عامة

هذا الدليل يوضح خطوات نشر منصة ReadyRent.Gala على خادم إنتاج.

## المتطلبات الأساسية

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
CREATE DATABASE readyrent_gala;
CREATE USER readyrent_user WITH PASSWORD 'your_secure_password';
ALTER ROLE readyrent_user SET client_encoding TO 'utf8';
ALTER ROLE readyrent_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE readyrent_user SET timezone TO 'Africa/Algiers';
GRANT ALL PRIVILEGES ON DATABASE readyrent_gala TO readyrent_user;
\q
```

## 3. إعداد Backend (Django)

### استنساخ المشروع

```bash
cd /var/www
git clone <repository-url> ReadyRent_Gala
cd ReadyRent_Gala/backend
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
DB_NAME=readyrent_gala
DB_USER=readyrent_user
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
DEFAULT_FROM_EMAIL=noreply@readyrent.gala

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
BACKUP_DIR=/var/www/ReadyRent_Gala/backups
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
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

## 4. إعداد Frontend (Next.js)

```bash
cd /var/www/ReadyRent_Gala/frontend
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
sudo nano /etc/nginx/sites-available/readyrent
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
        alias /var/www/ReadyRent_Gala/backend/media/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static files
    location /static/ {
        alias /var/www/ReadyRent_Gala/backend/staticfiles/;
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
sudo ln -s /etc/nginx/sites-available/readyrent /etc/nginx/sites-enabled/
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
cd /var/www/ReadyRent_Gala/backend
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
sudo nano /etc/systemd/system/readyrent-backend.service
```

```ini
[Unit]
Description=ReadyRent.Gala Backend (Gunicorn)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ReadyRent_Gala/backend
Environment="PATH=/var/www/ReadyRent_Gala/backend/venv/bin"
ExecStart=/var/www/ReadyRent_Gala/backend/venv/bin/gunicorn config.wsgi:application --config gunicorn_config.py

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start readyrent-backend
sudo systemctl enable readyrent-backend
```

### Daphne (لـ ASGI - WebSocket)

```bash
cd /var/www/ReadyRent_Gala/backend
pip install daphne
```

إنشاء ملف Daphne service:

```bash
sudo nano /etc/systemd/system/readyrent-daphne.service
```

```ini
[Unit]
Description=ReadyRent.Gala Daphne (ASGI/WebSocket)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ReadyRent_Gala/backend
Environment="PATH=/var/www/ReadyRent_Gala/backend/venv/bin"
ExecStart=/var/www/ReadyRent_Gala/backend/venv/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start readyrent-daphne
sudo systemctl enable readyrent-daphne
```

**ملاحظة**: يمكن استخدام Daphne بدلاً من Gunicorn إذا كنت تريد دعم WebSocket فقط، أو استخدامهما معاً (Gunicorn للـ HTTP و Daphne للـ WebSocket).

## 8. إعداد Celery

### إعداد Celery Worker

```bash
sudo nano /etc/systemd/system/readyrent-celery.service
```

```ini
[Unit]
Description=ReadyRent.Gala Celery Worker
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ReadyRent_Gala/backend
Environment="PATH=/var/www/ReadyRent_Gala/backend/venv/bin"
ExecStart=/var/www/ReadyRent_Gala/backend/venv/bin/celery -A config worker -l info

[Install]
WantedBy=multi-user.target
```

### إعداد Celery Beat

```bash
sudo nano /etc/systemd/system/readyrent-celery-beat.service
```

```ini
[Unit]
Description=ReadyRent.Gala Celery Beat
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/ReadyRent_Gala/backend
Environment="PATH=/var/www/ReadyRent_Gala/backend/venv/bin"
ExecStart=/var/www/ReadyRent_Gala/backend/venv/bin/celery -A config beat -l info

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start readyrent-celery
sudo systemctl start readyrent-celery-beat
sudo systemctl enable readyrent-celery
sudo systemctl enable readyrent-celery-beat
```

## 9. إعداد Next.js مع PM2

```bash
cd /var/www/ReadyRent_Gala/frontend
pm2 start npm --name "readyrent-frontend" -- start
pm2 save
pm2 startup
```

## 10. النسخ الاحتياطي التلقائي

النسخ الاحتياطي يتم تلقائياً عبر Celery Beat (يومياً).

للنسخ اليدوي:

```bash
cd /var/www/ReadyRent_Gala/backend
source venv/bin/activate
python manage.py backup_db
python manage.py backup_media
```

## 11. المراقبة والصيانة

### مراقبة الخدمات

```bash
# Backend (Gunicorn)
sudo systemctl status readyrent-backend

# Daphne (WebSocket)
sudo systemctl status readyrent-daphne

# Celery
sudo systemctl status readyrent-celery
sudo systemctl status readyrent-celery-beat

# Frontend
pm2 status
pm2 logs readyrent-frontend

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
sudo journalctl -u readyrent-backend -f

# Daphne logs (WebSocket)
sudo journalctl -u readyrent-daphne -f

# Celery logs
sudo journalctl -u readyrent-celery -f
sudo journalctl -u readyrent-celery-beat -f

# Frontend logs
pm2 logs readyrent-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 12. التحديثات

### تحديث الكود

```bash
cd /var/www/ReadyRent_Gala
git pull origin main

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart readyrent-backend
sudo systemctl restart readyrent-daphne

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart readyrent-frontend
```

## 13. الأمان

- تأكد من تحديث النظام بانتظام
- استخدم كلمات مرور قوية
- فعّل جدار الحماية (UFW)
- راجع أذونات الملفات
- راجع سجلات الأمان بانتظام

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

