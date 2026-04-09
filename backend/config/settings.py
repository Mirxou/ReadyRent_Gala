import os
import sys
from pathlib import Path
from datetime import timedelta
import environ  # type: ignore
import logging.handlers

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Initialize environ
env = environ.Env(
    DEBUG=(bool, False)
)

# Reading .env file
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

# SECURITY WARNING: keep the secret key used in production secret!
# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default=None)
if not SECRET_KEY:
    raise RuntimeError(
        'SECRET_KEY must be set via environment variable before Django starts. '
        'This is required for session signing, CSRF, and JWT security.'
    )

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env('DEBUG', default=False)


# CRITICAL: Host Header Attack Prevention
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])
if DEBUG:
    ALLOWED_HOSTS += ['localhost', '127.0.0.1', '[::1]']

# Urls Configuration
BACKEND_URL = env('BACKEND_URL', default='http://localhost:8000')
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:3001')

# Phase 16: PII Encryption & HMAC Shadow Columns
# Keys must be base64-encoded 32-byte secrets.
# ─────────────────────────────────────────────────────────────────────────────
PII_HASH_KEY = env('PII_HASH_KEY', default=None)
IP_HASH_KEY = env('IP_HASH_KEY', default=None)
PII_CURRENT_KEY_VERSION = env.int('PII_CURRENT_KEY_VERSION', default=1)
PII_ENCRYPTION_KEYS = {
    '1': env('PII_ENCRYPTION_KEY_V1', default=None),
    '2': env('PII_ENCRYPTION_KEY_V2', default=None),
}

# 🛡️ SOVEREIGN GUARD: JWT Signing Key Separation
# Using a separate key for JWT signing prevents a SECRET_KEY compromise 
# from immediately allowing JWT forgery, and vice-versa.
JWT_SIGNING_KEY = env('JWT_SIGNING_KEY', default=None)
if not JWT_SIGNING_KEY:
    raise RuntimeError("JWT_SIGNING_KEY must be set via environment variable for security.")

# Dedicated signing key for QR token generation and offline proofing
QR_SIGNING_KEY = env('QR_SIGNING_KEY', default=None)

# Validate critical crypto keys at startup to avoid delayed runtime failures.
if not DEBUG:
    required_keys = [
        ('SECRET_KEY', SECRET_KEY),
        ('PII_HASH_KEY', PII_HASH_KEY),
        ('IP_HASH_KEY', IP_HASH_KEY),
        ('PII_ENCRYPTION_KEY_V1', PII_ENCRYPTION_KEYS.get('1')),
        ('JWT_SIGNING_KEY', JWT_SIGNING_KEY),
        ('QR_SIGNING_KEY', QR_SIGNING_KEY),
    ]
    
    # CRITICAL: In production, JWT_SIGNING_KEY MUST NOT be the same as SECRET_KEY
    if JWT_SIGNING_KEY == SECRET_KEY:
         raise RuntimeError(
             "SECURITY BREACH: JWT_SIGNING_KEY is defaulting to SECRET_KEY in production. "
             "A unique signing key is required for sovereign institutional integrity."
         )

    missing_keys = [name for name, val in required_keys if not val]
    if missing_keys:
        raise RuntimeError(
            f"CRITICAL SECURITY FAILURE: Missing required cryptographic keys for production: {', '.join(missing_keys)}. "
            "System halted for safety."
        )

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.postgres',
    'rest_framework',
    'rest_framework_simplejwt.token_blacklist', # 🛡️ Required for LogoutView
    'corsheaders',  # Already present
    'drf_spectacular',
    'django_filters',  # For DjangoFilterBackend templates
    
    # Sovereign Dynamic Config
    'constance',
    'constance.backends.database',
    'picklefield',

    'core',
    'apps.users',
    'apps.products',
    'apps.bookings',
    'apps.inventory',
    'apps.maintenance',
    'apps.returns',
    'apps.locations',
    'apps.hygiene',
    'apps.packaging',
    'apps.warranties',
    'apps.bundles',
    'apps.local_guide',
    'apps.artisans',
    'apps.chatbot',
    'apps.analytics',
    'apps.notifications',
    'apps.reviews',
    'apps.disputes',
    'apps.vendors',
    'apps.branches',
    'apps.cms',
    'apps.payments',
    'apps.contracts',
    'apps.social',
    'apps.audit', # 🛡️ Immutable Audit Logging (Phase 15.4)
    'apps.communication',  # GAP-06 FIX (2026-03-31): WebSocket Signaling (was ghost module — now registered)
    'standard_core', # The Sovereign Kernel (Phase 11)
]

MIDDLEWARE = [
    'core.middleware.request_id.RequestIDMiddleware', # 🆔 Correlation ID (Must be first)
    'corsheaders.middleware.CorsMiddleware',  # Ensure this is first
    'django.middleware.security.SecurityMiddleware',
    'csp.middleware.CSPMiddleware', # 🛡️ Content Security Policy
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add Whitenoise here
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.locale.LocaleMiddleware',  # Must be after SessionMiddleware and CommonMiddleware
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.users.middleware.SovereignGuardMiddleware',  # 🛡️ SOVEREIGN GUARD: 2FA ENFORCEMENT
    'middleware.sovereign_response.SovereignResponseMiddleware',  # THE CONSTITUTIONAL ENFORCER
    'apps.core.middleware.MaintenanceModeMiddleware',  # Sovereign Emergency Protocol
    'core.middleware.rls_middleware.RLSMiddleware',  # RLS Context Middleware
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    
    # Phase 45: Sovereign Safety & Judicial Guard (Phase 36/42)
    'apps.disputes.middleware.TribunalSovereigntyMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.i18n',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'

# Database
# Supabase PostgreSQL Connection
if 'test' in sys.argv:
    # 🔒 TEST MODE: In-memory SQLite for speed and isolation
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }
else:
    # 🌍 PRODUCTION/DEV: Use PostgreSQL if configured, otherwise fallback to SQLite
    import dj_database_url

    # 🛡️ SOVEREIGN DATABASE: Use PgBouncer (6543) in Prod, Fallback to direct DB (5432)
    # We use PgBouncer for transaction-level pooling to handle high concurrency.
    DATABASE_URL = env('DATABASE_URL', default=None)
    if not DATABASE_URL and not DEBUG:
        raise RuntimeError("DATABASE_URL must be set in production. System halted.")

    if not DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL environment variable is required. Database credentials cannot be hardcoded. "
            "Set DATABASE_URL in your environment (e.g., .env or container secrets)."
        )

    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=0,  # 🛡️ PgBouncer handles pooling; Django should not hold connections
            conn_health_checks=True,
        )
    }


    # 🛠️ Enterprise-Grade Database Tuning
    DATABASES['default'].update({
        'OPTIONS': {
            'connect_timeout': 10,
            'options': '-c statement_timeout=30000',  # 30 second Hard Kill for hanging queries
        },
        'ATOMIC_REQUESTS': False,  # Disable global per-request transactions to prevent DB connection exhaustion
        'AUTOCOMMIT': True,
    })


# 🛡️ SOVEREIGN GUARD: Ensure we are not using SQLite in production
if not DEBUG and DATABASES['default']['ENGINE'] == 'django.db.backends.sqlite3':
    raise RuntimeError("SECURITY BREACH: SQLite detected in production mode. System Halt.")

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ar'
TIME_ZONE = 'Africa/Algiers'
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Supported languages
LANGUAGES = [
    ('ar', 'العربية'),
    ('en', 'English'),
]

# Locale paths
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'  # Add this for production

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'backend.authentication.CookieJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'EXCEPTION_HANDLER': 'core.exception_handler.custom_exception_handler',
    'DEFAULT_PAGINATION_CLASS': 'core.pagination.StrictPageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_THROTTLE_CLASSES': [
        'core.throttling.AnonymousUserThrottle',
        'core.throttling.AuthenticatedUserThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/day',
        'user': '1000/day',
        'login': '5/min',
        'register': '5/min',
        'product_search': '60/min',
        'chatbot': '20/min',
    },
    'DEFAULT_RENDERER_CLASSES': [
        'core.renderers.SovereignJSONRenderer',
    ] if not DEBUG else [
        'core.renderers.SovereignJSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),  # Increased for better UX, with refresh
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),     # Standard rotation window
    'ROTATE_REFRESH_TOKENS': True,                   # Critical for security
    'BLACKLIST_AFTER_ROTATION': True,                # Prevent reuse
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': JWT_SIGNING_KEY,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# 🛡️ Investor-Grade Cookie Configuration
AUTH_COOKIE_ACCESS = 'access_token'
AUTH_COOKIE_REFRESH = 'refresh_token'
AUTH_COOKIE_SECURE = not DEBUG   # True in Prod
AUTH_COOKIE_HTTP_ONLY = True     # JS cannot access needed for XSS protection
AUTH_COOKIE_SAMESITE = 'Lax'    # Lax for cross-domain SPA support (CSRF protected by DRF)
AUTH_COOKIE_PATH = '/'
AUTH_REFRESH_COOKIE_PATH = '/api/auth/token/refresh/'

# CSRF Configuration for Double-Submit
CSRF_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_HTTPONLY = False  # Needed for frontend to read CSRF token
CSRF_COOKIE_SAMESITE = 'Strict'
SESSION_COOKIE_SECURE = not DEBUG

if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True
    USE_X_FORWARDED_PORT = True
    SECURE_SSL_REDIRECT = True
    # Development: CORS whitelisting consolidated below

# Hard limit on page size (prevents abuse from ?page_size=10000)
MAX_PAGE_SIZE = 50

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'ReadyRent.Gala API',
    'DESCRIPTION': 'API documentation for ReadyRent.Gala',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': '/api/',
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'Bearer': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
            }
        }
    },
    'SECURITY': [{'Bearer': []}],
    # Disable verbose_name extraction to avoid gettext_lazy issues
    'SCHEMA_COERCE_PATH_PK': True,
    # Suppress warnings for views without explicit serializers
    'WARNINGS': {
        'THROW_ON_ERROR': False,
        'ENABLE_SERIALIZER_WARNINGS': False,
        'ENABLE_COMPONENT_WARNINGS': False,
    },
    'SCHEMA_COERCE_METHOD_NAMES': {
        'retrieve': 'read',
        'list': 'read',
    },
    # Patch to handle gettext_lazy verbose_name
    'PREPROCESSING_HOOKS': [],
    'POSTPROCESSING_HOOKS': [],
}

# CORS (Consolidated)
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=(['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'] if DEBUG else [
        'https://rentily.rent',
        'https://www.rentily.rent',
    ])
)
CORS_ALLOW_CREDENTIALS = True
# CORS_ALLOW_ALL_ORIGINS removed - use explicit CORS_ALLOWED_ORIGINS list

CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=([] if DEBUG else [
        'https://rentily.rent',
        'https://www.rentily.rent',
    ])
)

# Security Settings (Production)
# 🔒 BANKING-GRADE SECURITY: Force HTTPS in production
if not DEBUG:
    # CRITICAL: These MUST be True in production to prevent session hijacking
    SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
    SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=True)
    CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=True)
    SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=31536000)  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=True)
    SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=True)
else:
    # Development: Allow HTTP for local testing
    SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=False)
    SESSION_COOKIE_SECURE = env.bool('SESSION_COOKIE_SECURE', default=False)
    CSRF_COOKIE_SECURE = env.bool('CSRF_COOKIE_SECURE', default=False)
    SECURE_HSTS_SECONDS = env.int('SECURE_HSTS_SECONDS', default=0)
    SECURE_HSTS_INCLUDE_SUBDOMAINS = env.bool('SECURE_HSTS_INCLUDE_SUBDOMAINS', default=False)
    SECURE_HSTS_PRELOAD = env.bool('SECURE_HSTS_PRELOAD', default=False)

SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# 🔒 BANKING-GRADE SECURITY: Content Security Policy (XSS Protection)
# Prevent inline scripts and restrict resource loading
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_OBJECT_SRC = ("'none'",) # 🛡️ Strict: No plugins/Flash
CSP_STYLE_SRC = ("'self'",)
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_FONT_SRC = ("'self'", "https:", "data:")
CSP_CONNECT_SRC = ("'self'",)
CSP_FRAME_ANCESTORS = ("'none'",)  # Same as X-Frame-Options: DENY

# Sentry Configuration
SENTRY_DSN = env('SENTRY_DSN', default='')
SENTRY_ENVIRONMENT = env('SENTRY_ENVIRONMENT', default='development' if DEBUG else 'production')
SENTRY_TRACES_SAMPLE_RATE = env.float('SENTRY_TRACES_SAMPLE_RATE', default=0.1)
SENTRY_PROFILES_SAMPLE_RATE = env.float('SENTRY_PROFILES_SAMPLE_RATE', default=0.1)

if 'test' not in sys.argv and SENTRY_DSN:
    import sentry_sdk  # type: ignore
    from sentry_sdk.integrations.django import DjangoIntegration  # type: ignore
    from sentry_sdk.integrations.celery import CeleryIntegration  # type: ignore
    from sentry_sdk.integrations.redis import RedisIntegration  # type: ignore
    
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT,
        integrations=[
            DjangoIntegration(
                transaction_style='url',
                middleware_spans=True,
                signals_spans=True,
            ),
            CeleryIntegration(),
            RedisIntegration(),
        ],
        traces_sample_rate=SENTRY_TRACES_SAMPLE_RATE,
        profiles_sample_rate=SENTRY_PROFILES_SAMPLE_RATE,
        send_default_pii=False,  # Don't send PII by default
        before_send=lambda event, hint: event,  # Can add filtering here
    )

# Image Optimization
USE_WEBP_FORMAT = True
CDN_DOMAIN = env('CDN_DOMAIN', default=None)

# -----------------------------------------------------------------------------
# RISK ENGINE CONFIGURATION (Tech Shock Logic)
# -----------------------------------------------------------------------------
# These thresholds determine the system's trust level in a user.
# DO NOT CHANGE without CTO approval.
RISK_CONFIG = {
    'INITIAL_SCORE': 50,          # Default score for new users
    'CRITICAL_THRESHOLD': 75,     # > 75: Blocked from sensitive actions
    'TRUSTED_THRESHOLD': 40,      # < 40: Auto-approved listings (Community Vault)
    'INSTANT_BOOKING_THRESHOLD': 20, # < 20: Instant Booking (Gold Tier)
}

# -----------------------------------------------------------------------------
# CONSTANCE CONFIG (Dynamic Settings)
# -----------------------------------------------------------------------------
CONSTANCE_BACKEND = 'constance.backends.database.DatabaseBackend'

CONSTANCE_CONFIG = {
    'SOVEREIGN_WILAYAS_GREEN': ([16], 'List of Wilaya IDs fully open (Green Zone)', list),
    'SOVEREIGN_WILAYAS_YELLOW': ([], 'List of Wilaya IDs in incubation (Yellow Zone)', list),
    'SOVEREIGN_ALLOWED_CATEGORIES': (['electronics'], 'List of allowed category slugs (Global Arsenal)', list),
    'SOVEREIGN_YELLOW_ZONE_CATEGORIES': (['electronics'], 'List of allowed category slugs in Yellow Zone', list),
    'MAINTENANCE_MODE': (False, 'Enable Maintenance Mode (Sovereign Emergency Protocol)', bool),
}


# -----------------------------------------------------------------------------
# SOVEREIGN AI CONFIGURATION (Phase 41/42)
# -----------------------------------------------------------------------------
SOVEREIGN_AI = {
    'USE_MOCK': env.bool('SOVEREIGN_AI_USE_MOCK', default=True),
    'USE_SEMANTIC_SEARCH': env.bool('USE_SEMANTIC_SEARCH', default=True), # Kill Switch
    'MODEL_NAME': 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2',
}


# -----------------------------------------------------------------------------
# OBSERVABILITY: Institutional Logging (Phase 3.6)
# -----------------------------------------------------------------------------
import structlog  # type: ignore

LOG_DIR = BASE_DIR / 'logs'
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": structlog.stdlib.ProcessorFormatter,
            "processor": structlog.processors.JSONRenderer(),
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
        "file": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": os.path.join(BASE_DIR, 'logs', 'server_debug.log'),
            "maxBytes": 5242880,  # 5MB (Harden rotation: Audit M6)
            "backupCount": 10,
            "formatter": "json",
        },
    },
    "loggers": {
        "django": {"handlers": ["console", "file"], "level": "INFO"},
        "escrow": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
        "wallet": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
        "audit": {"handlers": ["console", "file"], "level": "INFO", "propagate": False},
    },
    "root": {
        "handlers": ["console", "file"],
        "level": "INFO",
    },
}

structlog.configure(
    processors=[
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

# ============================================
# REDIS CONFIGURATION
# ============================================

REDIS_URL = env('REDIS_URL', default='redis://localhost:6379/1')

CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
                'socket_keepalive': True,
                'socket_keepalive_options': {
                    1: 1,  # TCP_KEEPIDLE
                    2: 1,  # TCP_KEEPINTVL  
                    3: 3,  # TCP_KEEPCNT
                },
            },
            'SOCKET_CONNECT_TIMEOUT': 5,
            'SOCKET_TIMEOUT': 5,
            'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
            'IGNORE_EXCEPTIONS': True,
            'PARSER_CLASS': 'redis.connection.HiredisParser',
        },
        'KEY_PREFIX': 'rentily',
        'VERSION': 1,
        'TIMEOUT': 300,
    }
}

SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'

# ============================================
# CELERY
# ============================================

# CRITICAL FIX (M4): Use separate Redis databases for Celery broker and result backend
# This prevents Celery result storage from competing with application cache
CELERY_BROKER_URL = REDIS_URL.replace('/1', '/2') if REDIS_URL else 'redis://localhost:6379/2'
CELERY_RESULT_BACKEND = REDIS_URL.replace('/1', '/3') if REDIS_URL else 'redis://localhost:6379/3'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Algiers'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

CELERY_BROKER_TRANSPORT_OPTIONS = {
    'visibility_timeout': 3600,
    'max_connections': 50,
}

# ============================================
# 🛡️ SOVEREIGN PRODUCTION SECURITY HEADERS (Phase 7)
# ============================================
if not DEBUG:
    # 1. Force SSL Redirection
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # 2. HSTS (HTTP Strict Transport Security)
    SECURE_HSTS_SECONDS = 31536000  # 1 Year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    
    # 3. Cookie Security
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    
    # 4. SameSite Policy (Lax is generally best for usability/security balance)
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    
    # 5. Referrer Policy & Frame Options
    SECURE_REFERRER_POLICY = 'same-origin'
    X_FRAME_OPTIONS = 'DENY'
    SECURE_CONTENT_TYPE_NOSNIFF = True

