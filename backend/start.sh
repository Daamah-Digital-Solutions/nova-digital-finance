#!/bin/bash
set -e

echo "=== Nova Digital Finance Backend Starting ==="

echo "Running database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if enabled
if [ "$CREATE_SUPERUSER" = "true" ]; then
    echo "Creating superuser..."
    python manage.py createsuperuser --noinput 2>/dev/null || echo "Superuser already exists."
fi

# Configure Django Site domain for OAuth callbacks
echo "Configuring Django Site domain..."
python manage.py shell <<'PYEOF'
from django.contrib.sites.models import Site
site = Site.objects.get_or_create(id=1, defaults={"domain": "novadf.com", "name": "Nova Digital Finance"})[0]
if site.domain != "novadf.com":
    site.domain = "novadf.com"
    site.name = "Nova Digital Finance"
    site.save()
    print("Site domain updated to novadf.com")
else:
    print("Site domain already set to novadf.com")
PYEOF

echo "Starting Gunicorn on port 8000..."
exec gunicorn config.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile -
