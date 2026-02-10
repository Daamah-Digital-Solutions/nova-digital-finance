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
    python manage.py shell <<'PYEOF'
import os
from django.contrib.auth import get_user_model
User = get_user_model()
email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "admin@novadf.com")
password = os.environ.get("DJANGO_SUPERUSER_PASSWORD", "admin")
if not User.objects.filter(email=email).exists():
    User.objects.create_superuser(email=email, password=password, first_name="Admin", last_name="Nova")
    print(f"Superuser {email} created successfully")
else:
    print(f"Superuser {email} already exists")
PYEOF
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
