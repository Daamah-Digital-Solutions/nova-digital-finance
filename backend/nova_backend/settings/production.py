"""
Django production settings for nova_backend project.

These settings are optimized for production deployment:
- DEBUG disabled
- PostgreSQL database
- Redis cache
- Full security hardening
- Sentry error tracking
"""

from .base import *
from decouple import config
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

# SECURITY: Secret key must be set in environment
SECRET_KEY = config('SECRET_KEY')

# SECURITY: Debug must be False in production
DEBUG = False

# Production environment identifier
DEPLOYMENT_ENVIRONMENT = 'production'

# Allowed hosts - configure for your domain
_allowed_hosts = config('ALLOWED_HOSTS', default='novadf.com,www.novadf.com,localhost')
ALLOWED_HOSTS = [host.strip() for host in _allowed_hosts.split(',') if host.strip()]


# Database - PostgreSQL for production
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('DB_NAME', default='nova_finance'),
        'USER': config('DB_USER', default='nova_user'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'OPTIONS': {
            'connect_timeout': 10,
            'sslmode': config('DB_SSLMODE', default='prefer'),
        },
    }
}


# Cache - Redis for production
# Build Redis URL directly from components - no override allowed
REDIS_HOST = config('REDIS_HOST', default='redis')
REDIS_PORT = config('REDIS_PORT', default='6379')
REDIS_PASSWORD = config('REDIS_PASSWORD', default='')
REDIS_DB = config('REDIS_DB', default='1')

# Construct Redis URL - format: redis://:password@host:port/db
# Note: REDIS_HOST defaults to 'redis' which is the Docker service name
if REDIS_PASSWORD:
    REDIS_URL = f'redis://:{REDIS_PASSWORD}@{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'
else:
    REDIS_URL = f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}'

# Debug output during startup
import sys
print(f"[SETTINGS DEBUG] Redis URL: {REDIS_URL}", file=sys.stderr)

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'RETRY_ON_TIMEOUT': True,
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            },
        },
        'KEY_PREFIX': 'nova_finance',
        'TIMEOUT': 300,
    }
}

# Session backend using Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'


# CORS - Production domains only
_cors_origins = config('CORS_ALLOWED_ORIGINS', default='https://novadf.com,https://www.novadf.com')
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in _cors_origins.split(',') if origin.strip()]
CORS_ALLOW_CREDENTIALS = True


# Security Settings - Full hardening
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
# Exempt health check endpoints from SSL redirect (for internal container health checks)
SECURE_REDIRECT_EXEMPT = [r'^api/health/?$', r'^api/ready/?$']

SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Strict'
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_AGE = 3600  # 1 hour

CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Strict'
CSRF_USE_SESSIONS = True
_csrf_origins = config('CSRF_TRUSTED_ORIGINS', default='https://novadf.com,https://www.novadf.com')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in _csrf_origins.split(',') if origin.strip()]

# HSTS Settings
SECURE_HSTS_SECONDS = 31536000  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Additional security
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
X_FRAME_OPTIONS = 'DENY'


# Static files - WhiteNoise compression
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# Email - Production SMTP
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.hostinger.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')


# Stripe - Production mode
STRIPE_ENABLED = True
STRIPE_PUBLISHABLE_KEY = config('STRIPE_PUBLISHABLE_KEY', default='pk_test_placeholder')
STRIPE_SECRET_KEY = config('STRIPE_SECRET_KEY', default='sk_test_placeholder')
STRIPE_WEBHOOK_SECRET = config('STRIPE_WEBHOOK_SECRET', default='whsec_placeholder')


# Frontend URL for production
FRONTEND_URL = config('FRONTEND_URL', default='https://novadf.com')


# Sentry Error Tracking
SENTRY_DSN = config('SENTRY_DSN', default='')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
                signals_spans=True,
            ),
        ],
        # Set traces_sample_rate to 1.0 to capture 100% of transactions for performance monitoring.
        # Reduce in production to 0.1 or lower.
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
        # Set profiles_sample_rate to 1.0 to profile 100% of sampled transactions.
        # Reduce in production to 0.1 or lower.
        profiles_sample_rate=config('SENTRY_PROFILES_SAMPLE_RATE', default=0.1, cast=float),
        # Send user info to Sentry (anonymized)
        send_default_pii=False,
        # Environment name
        environment=DEPLOYMENT_ENVIRONMENT,
        # Release version
        release=config('APP_VERSION', default='1.0.0'),
    )


# Production logging - More restrictive, JSON format for log aggregation
LOGGING['handlers']['console']['level'] = 'WARNING'
LOGGING['loggers']['django']['level'] = 'WARNING'
LOGGING['loggers']['']['level'] = 'INFO'

# Add Sentry handler for error logging
if SENTRY_DSN:
    LOGGING['handlers']['sentry'] = {
        'level': 'ERROR',
        'class': 'sentry_sdk.integrations.logging.EventHandler',
    }
    LOGGING['loggers']['django']['handlers'].append('sentry')
    LOGGING['loggers']['']['handlers'].append('sentry')


# Rate limiting - Stricter in production
REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
    'anon': '50/hour',
    'user': '500/hour',
    'auth': '3/minute',  # Strict for login attempts
}


# File storage - AWS S3 for production (optional)
USE_S3 = config('USE_S3', default=False, cast=bool)
if USE_S3:
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    AWS_DEFAULT_ACL = 'private'
    AWS_QUERYSTRING_AUTH = True
    AWS_QUERYSTRING_EXPIRE = 3600

    # Static files on S3
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'

    # Media files on S3
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
