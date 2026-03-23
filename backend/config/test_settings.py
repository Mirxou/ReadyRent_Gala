from .settings import *
from pathlib import Path
import os

# Define BASE_DIR if not picked up by star import
BASE_DIR = Path(__file__).resolve().parent.parent

# Force in-memory SQLite for Testing
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Force In-Memory Cache to avoid Redis dependencies
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

# Speed up tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable Celery/Redis for tests
CELERY_TASK_ALWAYS_EAGER = True
