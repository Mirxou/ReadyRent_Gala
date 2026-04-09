"""
Forensic Test Settings — Hardened for Sovereign Verification.
Decouples all external infrastructure (Redis, Hiredis, PgBouncer).
"""
from config.settings import *

# 🛡️ SOVEREIGN DATABASE: Force local SQLite bypass
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db_forensic_audit.sqlite3',
    }
}

# 🛡️ CACHE HARDENING: Pure in-memory locmem. No Redis. No Hiredis.
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'sovereign-forensic-vault',
    }
}

# Disable all Redis/Celery features to prevent initialization errors
REDIS_URL = None
USE_REDIS = False
CELERY_BROKER_URL = None
CELERY_RESULT_BACKEND = None

# 🛡️ SOVEREIGN BYPASS: Prevent django-redis from ever trying to load HiredisParser
# We override any global dictionary that might have been populated by config.settings
try:
    for cache_name in CACHES:
        if 'OPTIONS' in CACHES[cache_name]:
            CACHES[cache_name]['OPTIONS'].pop('PARSER_CLASS', None)
            CACHES[cache_name]['OPTIONS'].pop('CLIENT_CLASS', None)
except Exception:
    pass

# Ensure sessions don't use cache if it was configured for Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# Disable AI semantic features for logic tests to avoid resource overhead
SOVEREIGN_AI = {
    'USE_MOCK': True,
    'USE_SEMANTIC_SEARCH': False,
}
