"""
Test settings for ReadyRent.Gala
"""
# Import all settings from the main settings module
import importlib.util
import sys
from pathlib import Path

# Load the settings.py module directly
settings_path = Path(__file__).resolve().parent / 'settings.py'
spec = importlib.util.spec_from_file_location('config.settings', settings_path)
settings_module = importlib.util.module_from_spec(spec)
sys.modules['config.settings'] = settings_module
spec.loader.exec_module(settings_module)

# Copy all settings to this module's namespace
for attr in dir(settings_module):
    if not attr.startswith('_'):
        globals()[attr] = getattr(settings_module, attr)

# Use in-memory database for faster tests
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable migrations for faster tests
class DisableMigrations:
    def __contains__(self, item):
        return True
    
    def __getitem__(self, item):
        return None

MIGRATION_MODULES = DisableMigrations()

# Disable cache for tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Disable Celery for tests
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

# Disable email sending
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

# Disable Sentry for tests
SENTRY_DSN = ''

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable image optimization for tests
IMAGE_OPTIMIZATION_ENABLED = False

# Test-specific settings
DEBUG = False
SECRET_KEY = 'test-secret-key-for-testing-only'

# Disable external API calls
GOOGLE_MAPS_API_KEY = ''
WHATSAPP_API_TOKEN = ''
OPENAI_API_KEY = ''

