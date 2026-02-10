#!/bin/bash
set -e

echo "=== Nova Digital Finance Backend Starting ==="

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Configuring Django Site..."
python manage.py shell -c "
from django.contrib.sites.models import Site
site = Site.objects.get_or_create(id=1)[0]
site.domain = '${DJANGO_ALLOWED_HOSTS:-novadf.com}'.split(',')[0]
site.name = 'Nova Digital Finance'
site.save()
print(f'Site configured: {site.domain}')
"

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if enabled
if [ "$CREATE_SUPERUSER" = "true" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput 2>/dev/null || echo "Superuser already exists."
fi

echo "Starting Gunicorn on port 8000..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
