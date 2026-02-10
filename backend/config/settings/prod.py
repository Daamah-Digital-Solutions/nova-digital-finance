import os
from .base import *  # noqa: F401, F403

DEBUG = False

# Frontend URL
FRONTEND_URL = config("FRONTEND_URL", default="https://novadf.com")
GOOGLE_OAUTH_CALLBACK_URL = f"{FRONTEND_URL}/auth/callback"

# Security - SSL handled by nginx reverse proxy
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=False, cast=bool)
SESSION_COOKIE_SECURE = config("SESSION_COOKIE_SECURE", default=True, cast=bool)
CSRF_COOKIE_SECURE = config("CSRF_COOKIE_SECURE", default=True, cast=bool)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
X_FRAME_OPTIONS = "DENY"

# CORS
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = config(
    "CORS_ALLOWED_ORIGINS",
    default="https://novadf.com,https://www.novadf.com",
).split(",")
CORS_ALLOW_CREDENTIALS = True

# CSRF
CSRF_TRUSTED_ORIGINS = config(
    "CSRF_TRUSTED_ORIGINS",
    default="https://novadf.com,https://www.novadf.com",
).split(",")

# Allauth OAuth settings
LOGIN_REDIRECT_URL = "/api/v1/auth/google/callback/"
ACCOUNT_LOGOUT_REDIRECT_URL = FRONTEND_URL
SOCIALACCOUNT_LOGIN_ON_GET = True

# Email - Using SMTP (can be changed to SendGrid/Mailgun/etc.)
# Option 1: Standard SMTP
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = config("EMAIL_HOST", default="smtp.gmail.com")
EMAIL_PORT = config("EMAIL_PORT", default=587, cast=int)
EMAIL_USE_TLS = config("EMAIL_USE_TLS", default=True, cast=bool)
EMAIL_HOST_USER = config("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = config("EMAIL_HOST_PASSWORD", default="")
DEFAULT_FROM_EMAIL = config("DEFAULT_FROM_EMAIL", default="Nova Digital Finance <noreply@novadf.tech>")

# Option 2: SendGrid (uncomment to use)
# EMAIL_BACKEND = "anymail.backends.sendgrid.EmailBackend"
# ANYMAIL = {
#     "SENDGRID_API_KEY": config("SENDGRID_API_KEY", default=""),
# }

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "verbose",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "WARNING",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
        "apps": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
