#!/bin/bash
set -e

echo "=== Nova Digital Finance Backend Starting ==="

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Configuring Django Site..."
export SITE_DOMAIN=$(echo "${DJANGO_ALLOWED_HOSTS:-novadf.com}" | cut -d',' -f1)
python manage.py shell -c "import os; from django.contrib.sites.models import Site; site, _ = Site.objects.get_or_create(id=1); site.domain = os.environ.get('SITE_DOMAIN', 'novadf.com'); site.name = 'Nova Digital Finance'; site.save(); print('Site configured: ' + site.domain)"

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
