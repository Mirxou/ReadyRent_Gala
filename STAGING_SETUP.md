# دليل إعداد بيئة Staging - STANDARD.Rent

**التاريخ**: يناير 2026

---

## نظرة عامة

هذا الدليل يشرح كيفية إعداد بيئة Staging للمنصة. بيئة Staging تستخدم للاختبار قبل النشر على Production.

---

## المتطلبات

- خادم VPS أو حساب على منصة Cloud (Railway, Render, DigitalOcean, etc.)
- Domain name لـ Staging (مثال: staging.STANDARD.Rent)
- إمكانية الوصول إلى قاعدة بيانات PostgreSQL
- إمكانية الوصول إلى Redis

---

## الخيارات المتاحة

### الخيار 1: Railway (موصى به للبداية السريعة)

#### المميزات:
- ✅ سهل الإعداد
- ✅ دعم PostgreSQL و Redis مدمج
- ✅ Deploy تلقائي من GitHub
- ✅ SSL مجاني

#### الخطوات:

1. **إنشاء حساب Railway**:
   - انتقل إلى [railway.app](https://railway.app)
   - سجل حساب جديد

2. **إعداد المشروع**:
   ```bash
   # تثبيت Railway CLI
   npm i -g @railway/cli
   
   # تسجيل الدخول
   railway login
   
   # إنشاء مشروع جديد
   railway init
   ```

3. **إضافة Services**:
   - PostgreSQL Database
   - Redis
   - Backend (Django)
   - Frontend (Next.js)

4. **إعداد Environment Variables**:
   - في Railway Dashboard، أضف جميع المتغيرات من `backend/.env.example`
   - تأكد من تغيير `DEBUG=False` و `ALLOWED_HOSTS`

5. **ربط GitHub**:
   - في Railway Dashboard، اربط Repository
   - اختر Branch: `develop`
   - Railway سيقوم بـ Deploy تلقائياً عند push

---

### الخيار 2: Render

#### المميزات:
- ✅ مجاني للبداية
- ✅ دعم PostgreSQL و Redis
- ✅ SSL مجاني

#### الخطوات:

1. **إنشاء حساب Render**:
   - انتقل إلى [render.com](https://render.com)
   - سجل حساب جديد

2. **إنشاء PostgreSQL Database**:
   - New > PostgreSQL
   - اختر Plan (Free tier متاح)
   - انسخ Connection String

3. **إنشاء Redis Instance**:
   - New > Redis
   - اختر Plan

4. **Deploy Backend**:
   - New > Web Service
   - اربط GitHub Repository
   - Branch: `develop`
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn config.wsgi:application`
   - Environment Variables: أضف جميع المتغيرات

5. **Deploy Frontend**:
   - New > Static Site
   - اربط GitHub Repository
   - Branch: `develop`
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `.next`

---

### الخيار 3: VPS (خادم خاص)

#### المتطلبات:
- Ubuntu 20.04+ أو Debian 11+
- 2GB RAM على الأقل
- 20GB Storage على الأقل

#### الخطوات:

1. **إعداد الخادم**:
   ```bash
   # تحديث النظام
   sudo apt update && sudo apt upgrade -y
   
   # تثبيت المتطلبات الأساسية
   sudo apt install -y python3-pip python3-venv postgresql postgresql-contrib redis-server nginx git
   ```

2. **إعداد PostgreSQL**:
   ```bash
   sudo -u postgres psql
   CREATE DATABASE STANDARD_staging;
   CREATE USER STANDARD_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE STANDARD_staging TO STANDARD_user;
   \q
   ```

3. **إعداد Redis**:
   ```bash
   sudo systemctl enable redis-server
   sudo systemctl start redis-server
   ```

4. **Deploy Backend**:
   ```bash
   # إنشاء مجلد للمشروع
   sudo mkdir -p /var/www/STANDARD-staging
   sudo chown $USER:$USER /var/www/STANDARD-staging
   
   # Clone المشروع
   cd /var/www/STANDARD-staging
   git clone https://github.com/yourusername/STANDARD_Rent.git .
   git checkout develop
   
   # إعداد Backend
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   
   # إعداد Environment Variables
   cp .env.example .env
   nano .env  # عدل القيم
   
   # Migrations
   python manage.py migrate
   python manage.py collectstatic --noinput
   
   # إعداد Gunicorn
   pip install gunicorn
   ```

5. **إعداد Systemd Service**:
   ```bash
   sudo nano /etc/systemd/system/STANDARD-backend-staging.service
   ```
   
   ```ini
   [Unit]
   Description=STANDARD Backend Staging
   After=network.target
   
   [Service]
   User=www-data
   Group=www-data
   WorkingDirectory=/var/www/STANDARD-staging/backend
   Environment="PATH=/var/www/STANDARD-staging/backend/venv/bin"
   ExecStart=/var/www/STANDARD-staging/backend/venv/bin/gunicorn config.wsgi:application --bind 127.0.0.1:8000
   
   [Install]
   WantedBy=multi-user.target
   ```
   
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable STANDARD-backend-staging
   sudo systemctl start STANDARD-backend-staging
   ```

6. **Deploy Frontend**:
   ```bash
   cd /var/www/STANDARD-staging/frontend
   npm install
   npm run build
   
   # إعداد PM2
   npm install -g pm2
   pm2 start npm --name "STANDARD-frontend-staging" -- start
   pm2 save
   pm2 startup
   ```

7. **إعداد Nginx**:
   ```bash
   sudo nano /etc/nginx/sites-available/STANDARD-staging
   ```
   
   ```nginx
   server {
       listen 80;
       server_name staging.STANDARD.Rent;
       
       # Frontend
       location / {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
       
       # Backend API
       location /api/ {
           proxy_pass http://localhost:8000;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # Media files
       location /media/ {
           alias /var/www/STANDARD-staging/backend/media/;
           expires 30d;
       }
       
       # Static files
       location /static/ {
           alias /var/www/STANDARD-staging/backend/staticfiles/;
           expires 30d;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/STANDARD-staging /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

8. **إعداد SSL**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d staging.STANDARD.Rent
   ```

---

## Environment Variables

### Backend (.env)

```env
# Django Settings
DEBUG=False
SECRET_KEY=your-staging-secret-key
ALLOWED_HOSTS=staging.STANDARD.Rent,staging-backend.STANDARD.Rent

# Database
DB_NAME=STANDARD_staging
DB_USER=STANDARD_user
DB_PASSWORD=your-db-password
DB_HOST=localhost
DB_PORT=5432

# Redis
REDIS_URL=redis://localhost:6379/1

# API Keys (استخدم keys منفصلة لـ Staging)
OPENAI_API_KEY=your-staging-openai-key
GOOGLE_MAPS_API_KEY=your-staging-google-maps-key

# Email (استخدم SMTP test أو Mailtrap)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_HOST_USER=your-mailtrap-user
EMAIL_HOST_PASSWORD=your-mailtrap-password

# Other
SENTRY_DSN=your-staging-sentry-dsn
```

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=https://staging-backend.STANDARD.Rent/api
NEXT_PUBLIC_BASE_URL=https://staging.STANDARD.Rent
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-staging-google-maps-key
NEXT_PUBLIC_WHATSAPP_NUMBER=+213XXXXXXXXX
NEXT_PUBLIC_PHONE_NUMBER=+213 XXX XXX XXX
NEXT_PUBLIC_CONTACT_EMAIL=staging@STANDARD.Rent
```

---

## CI/CD Integration

### GitHub Actions

تأكد من إضافة Secrets في GitHub:

1. انتقل إلى Repository Settings > Secrets and variables > Actions
2. أضف Secrets التالية:
   - `STAGING_SERVER_HOST`: عنوان الخادم
   - `STAGING_SERVER_USER`: اسم المستخدم
   - `STAGING_SSH_KEY`: SSH private key
   - `STAGING_DB_PASSWORD`: كلمة مرور قاعدة البيانات

### Deploy Script

أنشئ ملف `scripts/deploy_staging.sh`:

```bash
#!/bin/bash
set -e

echo "Deploying to Staging..."

# Pull latest code
git pull origin develop

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
sudo systemctl restart STANDARD-backend-staging

# Frontend
cd ../frontend
npm install
npm run build
pm2 restart STANDARD-frontend-staging

echo "Deployment completed!"
```

---

## البيانات التجريبية

لإضافة بيانات تجريبية لـ Staging:

```bash
cd backend
source venv/bin/activate
python manage.py seed_data
python manage.py create_demo_admin
```

---

## Monitoring

### Health Checks

- Backend: `https://staging-backend.STANDARD.Rent/api/health/`
- Frontend: `https://staging.STANDARD.Rent/`

### Logs

```bash
# Backend logs
sudo journalctl -u STANDARD-backend-staging -f

# Frontend logs
pm2 logs STANDARD-frontend-staging

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Checklist قبل الإطلاق

- [ ] جميع Environment Variables محدثة
- [ ] قاعدة البيانات منفصلة عن Production
- [ ] SSL Certificate مثبت
- [ ] Health checks تعمل
- [ ] البيانات التجريبية موجودة
- [ ] Monitoring مفعّل
- [ ] Backup strategy جاهزة
- [ ] CI/CD مربوط

---

**© 2026 STANDARD.Rent. جميع الحقوق محفوظة.**


