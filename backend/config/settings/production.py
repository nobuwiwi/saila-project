from .base import *  # noqa: F401, F403

DEBUG = False

# Ensure SECRET_KEY is set via environment variable in production
# (base.py already reads from env; this is a safety reminder)

# Security hardening
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
