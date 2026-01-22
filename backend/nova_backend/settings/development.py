"""
Django development settings for nova_backend project.

These settings are optimized for local development:
- DEBUG mode enabled
- SQLite database
- Dummy cache (no Redis required)
- Relaxed security settings for localhost
"""

from .base import *
from decouple import config

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-@d(gf(=w@jj@8qeq&9%&qfx%@q6uza08hch4bq*u@nbw=y6oo^')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']

# Development environment identifier
DEPLOYMENT_ENVIRONMENT = 'development'


# Database - SQLite for development
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# CORS - Allow localhost for development
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
]
CORS_ALLOW_CREDENTIALS = True


# Cache - Use dummy cache for development (no Redis required)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}


# Security Settings - Relaxed for development
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_HSTS_SECONDS = 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = False
SECURE_HSTS_PRELOAD = False

# Session settings for development
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
SESSION_COOKIE_AGE = 86400  # 24 hours

# CSRF settings for development
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'


# Email - Use console backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'


# WhiteNoise - Static file serving
STATICFILES_STORAGE = 'whitenoise.storage.CompressedStaticFilesStorage'


# Debug toolbar (optional - uncomment if django-debug-toolbar is installed)
# INSTALLED_APPS += ['debug_toolbar']
# MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
# INTERNAL_IPS = ['127.0.0.1']


# Development-specific logging
LOGGING['handlers']['console']['level'] = 'DEBUG'
LOGGING['loggers']['django']['level'] = 'DEBUG'
LOGGING['loggers']['']['level'] = 'DEBUG'


# Stripe - Use test mode in development
STRIPE_ENABLED = config('STRIPE_ENABLED', default=False, cast=bool)
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='pk_test_placeholder_key')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='sk_test_placeholder_key')


# Frontend URL for development (used in email templates, password reset links, etc.)
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000')
