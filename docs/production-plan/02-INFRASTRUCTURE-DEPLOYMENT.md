# المرحلة 1 — البنية التحتية والنشر
## STANDARD.Rent — Production Readiness Plan

> **المدة التقديرية**: 4 أسابيع
> **المرجع**: PRODUCTION-MIGRATION.md (الـ 21 بند المُنجز كأساس)
> **الأهداف**: خادم إنتاج مستقر + PostgreSQL + Redis + CDN + SSL + CI/CD كامل

---

## 1.1 اختيار مزود الاستضافة

### 1.1.1 المقارنة

| المزود | الموقع | السعر التقريبي | المزايا | العيوب | التقييم |
|---|---|---|---|---|---|
| **Hetzner** | ألمانيا/فنلندا | €4-8/شهر (VPS) | رخيص جدًا، أداء عالي، SSD NVMe | تأخير شبكة من الجزائر (~60ms) | ✅ **موصى به للبداية** |
| **OVH** | فرنسا | €5-10/شهر | شبكة كبيرة، DDoS protection مجاني | دعم فني بطيء | ✅ بديل جيد |
| **DataClub** | الجزائر | ~15,000 DZD/شهر | محلي، تأخير منخفض | سعر أعلى، موارد أقل | ⚠️ للمرحلة المتقدمة |
| **Contabo** | ألمانيا | €5-7/شهر | RAM/CPU كبير | أداء متذبذب | ❌ غير موثوق للإنتاج |
| **AWS** | متعدد | $20-50/شهر | scalable عالي | معقد، فاتورة غير متوقعة | ❌ معقد للبداية |

### 1.1.2 التوصية: Hetzner CX22 أو CPX11

```
المواصفات المطلوبة كحد أدنى:
- CPU: 2 vCPU
- RAM: 4 GB
- Storage: 40 GB SSD NVMe
- Bandwidth: 20 TB
- النظام: Ubuntu 22.04 LTS
- السعر التقريبي: ~€4.5/شهر
```

### 1.1.3 لماذا ليس AWS/السحابة؟

1. **التكلفة**: Hetzner أرخص بـ 5-10x لنفس الأداء
2. **البساطة**: VPS واحد أسهل في الإدارة من Kubernetes/ECS
3. **السيادة**: الخادم الافتراضي الخاص = تحكم كامل
4. **القابلية للتوسع**: يمكن الانتقال لاحقًا لسحابة عند الحاجة

---

## 1.2 إعداد الخادم

### 1.2.1 تهيئة أولية (Ubuntu 22.04)

```bash
# 1. تحديث النظام
sudo apt update && sudo apt upgrade -y

# 2. إنشاء مستخدم التطبيق
sudo adduser standardrent
sudo usermod -aG sudo standardrent

# 3. تثبيت الأساسيات
sudo apt install -y curl git htop ufw fail2ban

# 4. تثبيت Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker standardrent

# 5. تثبيت Docker Compose
sudo apt install -y docker-compose-plugin

# 6. إعداد Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 7. تثبيت Nginx
sudo apt install -y nginx

# 8. تثبيت Certbot (Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

### 1.2.2 الأمان الأساسي للخادم

```bash
# تعطيل root login عبر SSH
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# تعطيل كلمة مرور SSH (مفتاح فقط)
sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

# تغيير منفذ SSH (اختياري لكن موصى به)
sudo sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config

sudo systemctl restart sshd

# إعداد Fail2Ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
# تخصيص: ban time = 1h, max retries = 3
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 1.3 PostgreSQL (بدل SQLite)

### 1.3.1 لماذا PostgreSQL؟

| المعيار | SQLite (الحالي) | PostgreSQL (الإنتاج) |
|---|---|---|
| تعدد الخوادم | ❌ ملف واحد | ✅ connections متعددة |
| التزامن | ❌ write lock على الملف | ✅ MVCC |
| النسخ الاحتياطي | ⚠️ نسخ الملف | ✅ pg_dump + WAL |
| الأداء (قراءة) | ✅ سريع (in-process) | ✅ سريع |
| الأداء (كتابة) | ⚠️ جيد للتنمية | ✅ ممتاز مع indexes |
| Full-text search | ⚠️ محدود | ✅ tsvector + tsquery |
| JSON | ✅ يدعم | ✅ JSONB (أسرع) |

### 1.3.2 التثبيت

```bash
# تثبيت PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# إنشاء قاعدة بيانات ومستخدم
sudo -u postgres psql <<EOF
CREATE USER standardrent WITH PASSWORD 'STRONG_PASSWORD_HERE';
CREATE DATABASE standardrent OWNER standardrent;
GRANT ALL PRIVILEGES ON DATABASE standardrent TO standardrent;
EOF

# أو عبر Docker (مُفضّل — أسهل في الإدارة)
# أضف في docker-compose.yml:
```

### 1.3.3 إضافة PostgreSQL لـ docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: standardrent
      POSTGRES_PASSWORD: <strong-password>
      POSTGRES_DB: standardrent
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U standardrent']
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

### 1.3.4 التبديل في المشروع

```bash
# 1. تغيير provider في prisma/schema.prisma
# provider = "sqlite" → provider = "postgresql"

# 2. تحديث DATABASE_URL
# DATABASE_URL="postgresql://standardrent:password@localhost:5432/standardrent"

# 3. تشغيل المهاجرات
bunx prisma migrate dev

# 4. توليد العميل
bunx prisma generate
```

### 1.3.5 التحسينات المطلوبة لـ PostgreSQL

```sql
-- إضافة indexes مفقودة للبحث
CREATE INDEX idx_products_name_ar ON products(name_ar);
CREATE INDEX idx_products_location ON products(location_name);
CREATE INDEX idx_products_price ON products(price_per_day);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_available ON products(is_available);

CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(start_date, end_date);

CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Full-text search للعربية
CREATE INDEX idx_products_search ON products 
  USING GIN(to_tsvector('arabic', name_ar || ' ' || COALESCE(description, '')));
```

---

## 1.4 Redis (للـ Cache)

### 1.4.1 لماذا Redis؟

- **Cache للـ API**: المنتجات المتصفحة كثيرًا (homepage, categories)
- **Rate Limiting**: عداد الطلبات لكل IP/user
- **Session Store** (مستقبلاً): بديل أسرع من DB sessions

### 1.4.2 التثبيت

```yaml
# في docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'
    restart: unless-stopped
```

### 1.4.3 استبدال lib/cache.ts

```typescript
// الحالي: Map in-memory (يفقد البيانات عند إعادة التشغيل)
// الإنتاج: ioredis مع Redis

import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export async function getCache(key: string): Promise<string | null> {
  return redis.get(key);
}

export async function setCache(key: string, value: string, ttlSeconds: number = 300): Promise<void> {
  await redis.setex(key, ttlSeconds, value);
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
}
```

---

## 1.5 Nginx (Reverse Proxy + SSL)

### 1.5.1 إعداد Nginx

```nginx
# /etc/nginx/sites-available/standardrent.dz
server {
    listen 80;
    server_name standardrent.dz www.standardrent.dz;

    # إعادة توجيه HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name standardrent.dz www.standardrent.dz;

    # SSL (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/standardrent.dz/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/standardrent.dz/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;

    # Next.js app
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }

    # WebSocket (notifications service)
    location /ws/ {
        proxy_pass http://127.0.0.1:3004/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }

    # Static files (caching)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # File uploads
    client_max_body_size 10M;
}
```

### 1.5.2 SSL via Let's Encrypt

```bash
sudo certbot --nginx -d standardrent.dz -d www.standardrent.dz
# إعداد تجديد تلقائي (مُفعَّل افتراضيًا)
sudo certbot renew --dry-run
```

---

## 1.6 CDN (Cloudflare)

### 1.6.1 إعداد Cloudflare

```
1. أنشئ حساب Cloudflare
2. أضف النطاق standardrent.dz
3. غيّر nameservers في NIC.DZ إلى:
   - ns1.cloudflare.com
   - ns2.cloudflare.com
4. انتظر الدعاوى (propagation) — حتى 48 ساعة
```

### 1.6.2 إعدادات Cloudflare

| الإعداد | القيمة | السبب |
|---|---|---|
| SSL/TLS | Full (Strict) | لأن لدينا شهادة Let's Encrypt |
| Always Use HTTPS | ON | إجبار HTTPS |
| Auto Minify | JS + CSS + HTML | تقليل حجم الاستجابة |
| Brotli | ON | ضغط أفضل من Gzip |
| Cache Level | Standard | caching عادي |
| Page Rules: /_next/static/* | Cache Level: Cache Everything, Edge TTL: 1 month | ملفات Next.js ثابتة |
| Page Rules: /api/* | Cache Level: Bypass | API لا يُخزَّن مؤقتًا |
| Security Level | Medium | توازن بين الأمان والتجربة |
| Bot Fight Mode | ON | حماية من البوتات |
| WAF | ON (free plan) | حماية أساسية |

### 1.6.3 Rate Limiting via Cloudflare

```
قاعدة: /api/auth/* — Max 10 requests/min per IP
قاعدة: /api/products/search* — Max 30 requests/min per IP
قاعدة: * — Max 100 requests/min per IP
```

---

## 1.7 CI/CD كامل

### 1.7.1 GitHub Actions — التحسين

الحالي: `.github/workflows/ci.yml` يفعل lint + build فقط.

**المطلوب إضافته**:

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

jobs:
  test:
    # تشغيل اختبارات الوحدة والتكامل
    steps:
      - checkout
      - setup bun
      - bun install
      - bunx prisma generate
      - bun test

  lint:
    # فحص الكود
    steps:
      - bun run lint

  build:
    # التحقق من البناء
    needs: [test, lint]
    steps:
      - bun run build

  deploy-staging:
    # نشر على بيئة staging عند push لفرع staging
    needs: [build]
    if: github.ref == 'refs/heads/staging'
    steps:
      - deploy via SSH to staging server

  deploy-production:
    # نشر على بيئة الإنتاج عند push لفرع main (بعد مراجعة)
    needs: [build]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    steps:
      - deploy via SSH to production server
      - run health check
      - notify team
```

### 1.7.2 عملية النشر

```bash
# على الخادم — سكريبت النشر
#!/bin/bash
# /home/standardrent/deploy.sh

set -e

echo "📦 Pulling latest code..."
cd /home/standardrent/app
git pull origin main

echo "📦 Installing dependencies..."
bun install --production

echo "📦 Generating Prisma client..."
bunx prisma generate

echo "📦 Running migrations..."
bunx prisma migrate deploy

echo "📦 Rebuilding containers..."
docker compose up -d --build

echo "📦 Waiting for health check..."
sleep 10
curl -f http://localhost:3000/api/health || exit 1

echo "✅ Deployment complete!"
```

---

## 1.8 النسخ الاحتياطي (Backup)

### 1.8.1 قاعدة البيانات

```bash
#!/bin/bash
# /home/standardrent/backup-db.sh
# يعمل يوميًا عبر cron

BACKUP_DIR="/home/standardrent/backups/db"
DATE=$(date +%Y-%m-%d_%H%M%S)
FILE="$BACKUP_DIR/standardrent_$DATE.sql.gz"

mkdir -p $BACKUP_DIR

# PostgreSQL backup
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U standardrent standardrent | gzip > $FILE

# الاحتفاظ بآخر 30 نسخة
ls -t $BACKUP_DIR/*.sql.gz | tail -n +31 | xargs rm -f

echo "Backup completed: $FILE"
```

```cron
# cron job: كل يوم الساعة 3 صباحًا
0 3 * * * /home/standardrent/backup-db.sh >> /var/log/backup.log 2>&1
```

### 1.8.2 Cloudinary (الصور)
- Cloudinary يخزن الصور بـ CDN خاص — لا تحتاج نسخ احتياطي إضافي
- **لكن**: احتفظ بنسخة من الـ `publicIds` في قاعدة البيانات (موجود بالفعل في `Product.images`)

---

## 1.9 مراقبة البنية التحتية

| الأداة | الغرض | التكلفة | الإعداد |
|---|---|---|---|
| **UptimeRobot** | مراقبة وقت التشغيل | مجاني (50 monitor) | ping /api/health كل 5 دقائق |
| **Sentry** | تتبع الأخطاء | مجاني (5K events/شهر) | `@sentry/nextjs` SDK |
| **Axiom** | تجميع السجلات | مجاني (500MB/شهر) | Log drain من Docker |
| **Plausible** | تحليلات (بدون cookies) | $9/شهر | script في layout.tsx |

---

## 1.10 إصلاح المسارات المكسورة (من MASTERPLAN)

### 1.10.1 أولويات الإصلاح (حرجة)

| المهمة | الملف | المشكلة | الحل |
|---|---|---|---|
| 1.1 | `lib/api.ts` | `/disputes/disputes/` مزدوج | إزالة التكرار |
| 1.2 | `lib/api/contracts.ts` | `/contracts/digital/[id]/` خاطئ | `/contracts/[id]/` |
| 1.3 | `lib/api.ts` | `/bundles/bundles/` مزدوج | إزالة التكرار |
| 1.4 | `lib/api.ts` | `/bookings/bookings/` مزدوج | إزالة التكرار |
| 1.5 | `lib/api.ts` | `/bookings/cart/items/` خاطئ | `/bookings/cart/` |
| 1.6 | `lib/api.ts` | `/returns/returns/` مزدوج | إزالة التكرار |

### 1.10.2 API routes مفقودة

| المسار المطلوب | الوظيفة | الأولوية |
|---|---|---|
| `GET /api/disputes/[id]` | تفاصيل نزاع واحد | 🔴 حرج |
| `POST /api/disputes/[id]/messages` | إرسال رسالة في نزاع | 🔴 حرج |
| `GET /api/contracts/[id]` | تفاصيل عقد واحد | 🟡 مهم |

---

## 1.11 مخطط البنية التحتية النهائية

```
                    ┌─────────────────┐
                    │   Cloudflare    │
                    │   (CDN + WAF)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Nginx (SSL)   │
                    │   :443          │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼─────┐ ┌─────▼──────┐ ┌────▼──────────┐
     │  Next.js     │ │  WebSocket  │ │  Static Files  │
     │  :3000       │ │  Service    │ │  (CDN cached) │
     │  (Docker)    │ │  :3004      │ │                │
     └──────┬──────┘ └─────┬──────┘ └────────────────┘
            │              │
     ┌──────┼──────────────┼──────┐
     │      │              │      │
┌────▼──┐ ┌▼──────┐ ┌─────▼──┐ │
│PostgreSQL│ │Redis  │ │Send    │ │
│:5432   │ │:6379  │ │Grid    │ │
│(Docker)│ │(Docker)│ │(Email) │ │
└────────┘ └───────┘ └────────┘ │
                                  │
                          ┌───────▼──────┐
                          │  Cloudinary   │
                          │  (Images CDN) │
                          └──────────────┘
```

---

## 1.12 المهام — قائمة مراجعة المرحلة

```
[ ] اختيار وتأجير الخادم (Hetzner CX22)
[ ] تهيئة الخادم (Ubuntu 22.04 + Docker + Nginx + Fail2Ban)
[ ] تثبيت PostgreSQL + إنشاء قاعدة بيانات
[ ] تثبيت Redis
[ ] تبديل Prisma من SQLite إلى PostgreSQL
[ ] تشغيل المهاجرات على PostgreSQL
[ ] إضافة PostgreSQL و Redis لـ docker-compose.yml
[ ] إعداد Nginx reverse proxy + SSL
[ ] تسجيل النطاق وتوجيهه
[ ] إعداد Cloudflare (DNS + caching + security)
[ ] استبدال lib/cache.ts بـ ioredis
[ ] إصلاح 6 مسارات API المكسورة (MASTERPLAN 1.1-1.6)
[ ] إنشاء API routes المفقودة (disputes/[id], contracts/[id])
[ ] تحسين CI/CD pipeline (tests + deploy)
[ ] إعداد النسخ الاحتياطي اليومي
[ ] إعداد المراقبة (UptimeRobot + Sentry + Axiom)
[ ] إضافة indexes لـ PostgreSQL
[ ] اختبار النشر الكامل على الخادم
[ ] قياس أداء الصفحة الرئيسية (Lighthouse)
```

---

> **المرحلة التالية**: `03-TRUST-SAFETY-SYSTEM.md` — بناء نظام الثقة الشامل.