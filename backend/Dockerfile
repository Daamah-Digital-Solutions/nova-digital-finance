# Production Dockerfile for Nova Finance Backend
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        build-essential \
        libpq-dev \
        curl \
        netcat-traditional \
        libmagic1 \
        libffi-dev \
        libssl-dev \
        supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn==21.2.0 \
    && pip install psycopg2-binary==2.9.9

# Copy project
COPY . .

# Create necessary directories
RUN mkdir -p /app/logs /app/media /app/static

# Set permissions
RUN adduser --disabled-password --gecos '' appuser \
    && chown -R appuser:appuser /app

# Create supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy entrypoint script
COPY docker-entrypoint.sh .
RUN chmod +x docker-entrypoint.sh

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health/ || exit 1

# Expose port
EXPOSE 8000

USER appuser

# Run entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]