import os
import sys
from pathlib import Path

# Mock heavy libraries
class MockLib:
    def __getattr__(self, name): return MockLib()
    def __call__(self, *args, **kwargs): return MockLib()

sys.modules['deepface'] = MockLib()
sys.modules['sentence_transformers'] = MockLib()
sys.modules['torch'] = MockLib()

# Standard Django Settings (Minimalist & Self-Contained)
BASE_DIR = Path(__file__).resolve().parent.parent
SECRET_KEY = 'test-secret-key-sovereign-stabilization'
DEBUG = False
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'apps.core',
    'apps.users',
    'apps.products',
    'apps.bookings',
    'apps.payments',
    'apps.disputes',
    'apps.branches',
    'standard_core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
]

ROOT_URLCONF = 'config.urls'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'test_minimal_db.sqlite3'),
    }
}

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

AUTH_USER_MODEL = 'users.User'

# Crypto (Phase 16)
PII_HASH_KEY = 'c292ZXJlaWduX3Rlc3RfaG1hY19rZXlfMTY4Yjg4OGI='
PII_CURRENT_KEY_VERSION = 1
PII_ENCRYPTION_KEYS = {"1": "Lf9-nDW20eI5Br59Fw7FE79krO54UCEraMVMzaBByxo="}

# AI Mocking
SOVEREIGN_AI = {
    'USE_MOCK': True,
    'USE_SEMANTIC_SEARCH': False,
    'MODEL_NAME': 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
}

# Speed up tests
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
CELERY_TASK_ALWAYS_EAGER = True

# Disable Migrations for speed
class DisableMigrations:
    def __contains__(self, item): return True
    def __getitem__(self, item): return None
MIGRATION_MODULES = DisableMigrations()
