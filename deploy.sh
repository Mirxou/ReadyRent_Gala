#!/bin/bash
# ============================================
# RENTILY PRODUCTION DEPLOYMENT SCRIPT
# ============================================

set -e

echo "🚀 Starting Enterprise Deployment..."

# 1. Build Production Images
echo "📦 Building images..."
docker-compose -f docker-compose.production.yml build

# 2. Start Services (Gradual)
echo "🔋 Starting Infrastructure (DB/Redis/PgBouncer)..."
docker-compose -f docker-compose.production.yml up -d db redis pgbouncer

echo "⏳ Waiting for Database readiness..."
sleep 10

# 3. Apply Migrations
echo "🔄 Running Migrations..."
docker-compose -f docker-compose.production.yml run --rm backend python manage.py migrate --noinput

# 4. Collect Static Files
echo "🎨 Collecting Static..."
docker-compose -f docker-compose.production.yml run --rm backend python manage.py collectstatic --noinput

# 5. Start Backend & Ingress
echo "⚡ Starting Backend & Nginx..."
docker-compose -f docker-compose.production.yml up -d backend celery_worker celery_beat nginx

# 6. Verify Health
echo "🛡️ Running Health Checks..."
docker-compose -f docker-compose.production.yml run --rm backend python scripts/check_redis.py
docker-compose -f docker-compose.production.yml run --rm backend python scripts/check_pgbouncer.py

echo "✅ DEPLOYMENT COMPLETE"
