"""
Nova Backend Settings Package

Settings are split into:
- base.py: Common settings shared across all environments
- development.py: Development-specific settings (DEBUG=True, local database)
- production.py: Production settings (DEBUG=False, PostgreSQL, security hardening)

Usage:
    Set DJANGO_SETTINGS_MODULE environment variable:
    - Development: nova_backend.settings.development
    - Production: nova_backend.settings.production

    Or use --settings flag:
    python manage.py runserver --settings=nova_backend.settings.development
"""

import os

# Default to development settings if not specified
environment = os.environ.get('DJANGO_ENV', 'development')

if environment == 'production':
    from .production import *
else:
    from .development import *
