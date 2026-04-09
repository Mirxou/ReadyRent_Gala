# ==============================================================================
# 🧩 STAGE 1: Builder (Heavy Native Dependencies)
# ==============================================================================
FROM python:3.11-slim as builder

WORKDIR /usr/src/app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies as Wheels
COPY backend/requirements.txt .
RUN pip wheel --no-cache-dir --wheel-dir /usr/src/app/wheels -r requirements.txt

# ==============================================================================
# 🚀 STAGE 2: Runner (Lightweight Production Environment)
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Sovereign Guard: Security best practice, never run as root in production
RUN addgroup --system appgroup && adduser --system --group appuser

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=config.settings

# Install minimal runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder stage and install
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .
RUN pip install --no-cache-dir /wheels/* \
    && rm -rf /wheels
RUN python -c "import dj_database_url; print('dj_database_url OK')"

# Copy the backend project
COPY backend/ /app/

ARG SECRET_KEY
# Collect static files
# Use build arg SECRET_KEY if provided; otherwise fallback to a build-only dummy key.
RUN SECRET_KEY="${SECRET_KEY:-dummy-key-for-build}" python manage.py collectstatic --noinput

# Secure permissions for the non-root user
RUN chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

# Start command
CMD sh -c "python manage.py migrate && gunicorn config.wsgi:application --bind 0.0.0.0:8000"
