#!/bin/bash
set -e

echo "Starting Nova Finance Backend..."

# Wait for database
echo "Waiting for PostgreSQL..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 0.1
done
echo "PostgreSQL is available"

# Wait for Redis
echo "Waiting for Redis..."
while ! nc -z $REDIS_HOST 6379; do
  sleep 0.1
done
echo "Redis is available"

# Run migrations
echo "Running database migrations..."
python manage.py migrate --no-input

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --no-input

# Create cache table
echo "Creating cache table..."
python manage.py createcachetable || true

# Create superuser if specified
if [ "$CREATE_SUPERUSER" = "true" ]; then
    echo "Creating superuser..."
    python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='$DJANGO_SUPERUSER_USERNAME').exists():
    User.objects.create_superuser('$DJANGO_SUPERUSER_USERNAME', '$DJANGO_SUPERUSER_EMAIL', '$DJANGO_SUPERUSER_PASSWORD')
    print('Superuser created successfully')
else:
    print('Superuser already exists')
"
fi

# Load initial data if specified
if [ "$LOAD_INITIAL_DATA" = "true" ]; then
    echo "Loading initial data..."
    python manage.py loaddata fixtures/currencies.json || true
    python manage.py loaddata fixtures/initial_settings.json || true
fi

# Start the main process
exec "$@"