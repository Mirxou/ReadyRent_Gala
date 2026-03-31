# ==============================================================================
# 🧩 STAGE 1: Builder (Heavy Native Dependencies)
# ==============================================================================
FROM python:3.11-slim as builder

WORKDIR /usr/src/app

# Set environment variables for builder
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for building Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    python3-dev \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies as Wheels (pre-compiled binaries)
COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /usr/src/app/wheels -r requirements.txt


# ==============================================================================
# 🚀 STAGE 2: Runner (Lightweight Production Environment)
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Sovereign Guard: Security best practice, never run as root
RUN addgroup --system appgroup && adduser --system --group appuser

# Set environment variables for runtime
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1
ENV HOME=/app
ENV APP_HOME=/app

# Install minimal runtime dependencies (postgresql-client for DB checks/migrations)
RUN apt-get update && apt-get install -y --no-install-recommends \
    postgresql-client \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy pre-built wheels from builder stage and install
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .
RUN pip install --no-cache /wheels/* \
    && rm -rf /wheels

# Copy project files
COPY . $APP_HOME

# Secure permissions for the non-root user
RUN chown -R appuser:appgroup $APP_HOME
RUN chmod +x $APP_HOME/entrypoint.sh

# Drop root privileges
USER appuser

EXPOSE 8000

# Use entrypoint script to handle DB migrations & readiness
ENTRYPOINT ["./entrypoint.sh"]

# Default production server
CMD ["gunicorn", "config.wsgi:application", "--config", "gunicorn_config.py"]
