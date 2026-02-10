from .base import *  # noqa: F401, F403

DEBUG = True

# Frontend URL for OAuth redirects (use localhost for dev, override in .env for production)
FRONTEND_URL = config("FRONTEND_URL", default="http://localhost:3001")
GOOGLE_OAUTH_CALLBACK_URL = f"{FRONTEND_URL}/auth/callback"

# Allauth OAuth settings
LOGIN_REDIRECT_URL = "/api/v1/auth/google/callback/"
ACCOUNT_LOGOUT_REDIRECT_URL = FRONTEND_URL
SOCIALACCOUNT_LOGIN_ON_GET = True

# Email - use SMTP settings from .env (override console backend from base)
EMAIL_BACKEND = config("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")

# Use SQLite for local development when PostgreSQL is not available
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True

# Use real SMTP for email (configured in .env)
# EMAIL_BACKEND is already set above from .env

# Skip email verification in development (user can login without verifying)
ACCOUNT_EMAIL_VERIFICATION = "optional"

# Debug toolbar (optional)
# INSTALLED_APPS += ["debug_toolbar"]
# MIDDLEWARE.insert(0, "debug_toolbar.middleware.DebugToolbarMiddleware")
# INTERNAL_IPS = ["127.0.0.1"]

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
    },
}
