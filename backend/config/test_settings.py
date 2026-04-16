"""
Test Settings for ReadyRent CI/CD Pipeline
────────────────────────────────────────────
- Uses SQLite in-memory (no PostgreSQL/Redis services needed)
- Mocks heavy AI/ML libraries
- Disables migrations for speed
- Safe defaults for all cryptographic keys
"""
import sys
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────────────────────────────────────────
# 1. Mock heavy libraries BEFORE any other import
# ─────────────────────────────────────────────────────────────────────────────
class MockLib:
    def __getattr__(self, name):
        if name in ('__file__', '__name__', '__path__'):
            return '/mock/path' if name in ('__file__', '__path__') else 'mock_module'
        return MockLib()
    def __call__(self, *args, **kwargs): return MockLib()
    def __bool__(self): return False
    def __iter__(self): return iter([])
    def __int__(self): return 0
    def __float__(self): return 0.0
    def __str__(self): return ''

sys.modules['deepface'] = MockLib()
sys.modules['sentence_transformers'] = MockLib()
sys.modules['torch'] = MockLib()
sys.modules['cv2'] = MockLib()

# ─────────────────────────────────────────────────────────────────────────────
# 2. Provide required env vars BEFORE importing settings.py
#    (settings.py raises RuntimeError if SECRET_KEY or JWT_SIGNING_KEY are missing)
# ─────────────────────────────────────────────────────────────────────────────
_TEST_DEFAULTS = {
    'SECRET_KEY':             os.environ.get('SECRET_KEY',             'test-secret-key-for-ci-only-do-not-use-in-prod'),
    'JWT_SIGNING_KEY':        os.environ.get('JWT_SIGNING_KEY',        'test-jwt-signing-key-for-ci-must-differ-from-secret'),
    'QR_SIGNING_KEY':         os.environ.get('QR_SIGNING_KEY',         'test-qr-signing-key-for-ci'),
    'PII_HASH_KEY':           os.environ.get('PII_HASH_KEY',           'c292ZXJlaWduX3Rlc3RfaG1hY19rZXlfMTY4Yjg4OGI='),
    'IP_HASH_KEY':            os.environ.get('IP_HASH_KEY',            'test-ip-hash-key-for-ci'),
    'PII_ENCRYPTION_KEY_V1':  os.environ.get('PII_ENCRYPTION_KEY_V1',  'Lf9-nDW20eI5Br59Fw7FE79krO54UCEraMVMzaBByxo='),
    'DATABASE_URL':           os.environ.get('DATABASE_URL',           'sqlite:///test_db.sqlite3'),
    'REDIS_URL':              os.environ.get('REDIS_URL',              'redis://localhost:6379/1'),
    'DEBUG':                  'True',
    'ALLOWED_HOSTS':          'localhost,127.0.0.1',
}

for key, value in _TEST_DEFAULTS.items():
    if key not in os.environ:
        os.environ[key] = value

# ─────────────────────────────────────────────────────────────────────────────
# 3. Load base settings
# ─────────────────────────────────────────────────────────────────────────────
from .settings import *  # noqa: F401, F403, E402

# ─────────────────────────────────────────────────────────────────────────────
# 4. Force DEBUG = True (prevents production-only checks from running)
# ─────────────────────────────────────────────────────────────────────────────
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]', 'testserver']

# ─────────────────────────────────────────────────────────────────────────────
# 5. Remove heavy INSTALLED_APPS not needed in tests
# ─────────────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [app for app in INSTALLED_APPS if app not in [
    'drf_spectacular',
    'constance',
    'constance.backends.database',
    'picklefield',
]]

# ─────────────────────────────────────────────────────────────────────────────
# 6. Strip middleware that requires external services or custom setups
# ─────────────────────────────────────────────────────────────────────────────
_MIDDLEWARE_BLOCKLIST = [
    'RLSMiddleware',
    'SovereignSafetyMiddleware',
    'JudicialLockoutMiddleware',
    'SovereignResponseMiddleware',
    'WhiteNoiseMiddleware',
    'MaintenanceModeMiddleware',
    'SovereignGuardMiddleware',
    'CSPMiddleware',
    'TribunalSovereigntyMiddleware',
]
MIDDLEWARE = [m for m in MIDDLEWARE if not any(x in m for x in _MIDDLEWARE_BLOCKLIST)]

# ─────────────────────────────────────────────────────────────────────────────
# 7. SQLite in-memory database (fast, no external services)
# ─────────────────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
        'TEST': {
            'NAME': ':memory:',
        },
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 8. In-memory cache (no Redis needed)
# ─────────────────────────────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-cache',
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ─────────────────────────────────────────────────────────────────────────────
# 9. Speed optimizations
# ─────────────────────────────────────────────────────────────────────────────
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']

# ─────────────────────────────────────────────────────────────────────────────
# 10. Celery runs synchronously in tests
# ─────────────────────────────────────────────────────────────────────────────
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# ─────────────────────────────────────────────────────────────────────────────
# 11. Safe cryptographic keys (CI-only, not used in production)
# ─────────────────────────────────────────────────────────────────────────────
PII_HASH_KEY = os.environ.get('PII_HASH_KEY', 'c292ZXJlaWduX3Rlc3RfaG1hY19rZXlfMTY4Yjg4OGI=')
PII_CURRENT_KEY_VERSION = 1
PII_ENCRYPTION_KEYS = {
    "1": os.environ.get('PII_ENCRYPTION_KEY_V1', 'Lf9-nDW20eI5Br59Fw7FE79krO54UCEraMVMzaBByxo='),
}

# ─────────────────────────────────────────────────────────────────────────────
# 12. Disable AI/ML features
# ─────────────────────────────────────────────────────────────────────────────
SOVEREIGN_AI = {
    'USE_MOCK': True,
    'USE_SEMANTIC_SEARCH': False,
    'MODEL_NAME': 'mock',
}

# ─────────────────────────────────────────────────────────────────────────────
# 13. Disable django-migrations (use direct schema creation from models)
# ─────────────────────────────────────────────────────────────────────────────
class DisableMigrations:
    def __contains__(self, item): return True
    def __getitem__(self, item): return None

MIGRATION_MODULES = DisableMigrations()

# ─────────────────────────────────────────────────────────────────────────────
# 14. Constance — memory backend (safe for tests, no DB table needed)
# ─────────────────────────────────────────────────────────────────────────────
CONSTANCE_BACKEND = 'constance.backends.memory.MemoryBackend'
CONSTANCE_CONFIG = {}

# ─────────────────────────────────────────────────────────────────────────────
# 15. Disable HTTPS enforcement
# ─────────────────────────────────────────────────────────────────────────────
SECURE_SSL_REDIRECT = False
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
AUTH_COOKIE_SECURE = False
