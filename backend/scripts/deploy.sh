#!/bin/bash

# STANDARD.Rent - Backend Deployment Script
# Usage: ./deploy.sh [environment]
# Environment: 'staging' or 'production' (default: staging)

set -e  # Exit on error

ENV=${1:-staging}
APP_DIR=""
SERVICE_NAME=""

if [ "$ENV" = "production" ]; then
    APP_DIR="/var/www/ReadyRent_Gala/backend"
    SERVICE_NAME="readyrent-backend"
    echo "🚀 Deploying to PRODUCTION..."
else
    APP_DIR="/var/www/readyrent-staging/backend"
    SERVICE_NAME="readyrent-backend-staging"
    echo "🚀 Deploying to STAGING..."
fi

# 1. Navigate to directory
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
else
    echo "❌ Error: Directory $APP_DIR does not exist."
    exit 1
fi

# 2. Pull latest code
echo "⬇️ Pulling latest changes..."
git pull origin $ENV || {
    echo "⚠️ Git pull failed. Trying to fetch and reset..."
    git fetch origin
    git reset --hard origin/$ENV
}

# 3. Activate Virtual Environment
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
else
    echo "❌ Error: Virtual environment not found."
    exit 1
fi

# 4. Install Dependencies
echo "📦 Installing requirements..."
pip install -r requirements.txt

# 5. Run Migrations
echo "🗄️ Running migrations..."
python manage.py migrate

# 6. Collect Static Files
echo "🎨 Collecting static files..."
python manage.py collectstatic --noinput

# 7. Restart Service
echo "🔄 Restarting service..."
sudo systemctl restart $SERVICE_NAME

echo "✅ Deployment to $ENV completed successfully!"
