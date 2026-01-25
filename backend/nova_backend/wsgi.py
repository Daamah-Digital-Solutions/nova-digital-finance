"""
WSGI config for nova_backend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/wsgi/

Usage:
    Development: DJANGO_ENV=development gunicorn nova_backend.wsgi:application
    Production:  DJANGO_ENV=production gunicorn nova_backend.wsgi:application
"""

import os

from django.core.wsgi import get_wsgi_application

# Settings module is determined by DJANGO_ENV in settings/__init__.py
# Default: development, Set DJANGO_ENV=production for production
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'nova_backend.settings')

application = get_wsgi_application()
