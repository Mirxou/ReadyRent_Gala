FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . .

# Copy entrypoint script and make it executable
RUN chmod +x entrypoint.sh

EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["./entrypoint.sh"]

# Default command
CMD ["gunicorn", "config.wsgi:application", "--config", "gunicorn_config.py"]
