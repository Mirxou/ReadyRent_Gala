#!/bin/bash

# ReadyRent.Gala Backend Entrypoint Script

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting Production Entrypoint..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Apply database migrations
echo "⚙️ Applying Database Migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting Static Files..."
python manage.py collectstatic --noinput

# Check for specific startup tasks (e.g., creating cache tables if needed)
# python manage.py createcachetable || true

echo "🔥 Launching Gunicorn..."
# Execute the command passed to docker run
exec "$@"
