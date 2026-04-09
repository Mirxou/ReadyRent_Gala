import sys
import os
from pathlib import Path

# ─────────────────────────────────────────────────────────────────────────────
# 1. حقن مكتبات وهمية قبل أي استيراد آخر (يجب أن يكون أول شيء)
# ─────────────────────────────────────────────────────────────────────────────
class MockLib:
    def __getattr__(self, name): return MockLib()
    def __call__(self, *args, **kwargs): return MockLib()
    def __bool__(self): return False
    def __iter__(self): return iter([])

sys.modules['deepface'] = MockLib()
sys.modules['sentence_transformers'] = MockLib()
sys.modules['torch'] = MockLib()
sys.modules['cv2'] = MockLib()

# ─────────────────────────────────────────────────────────────────────────────
# 2. تحميل الإعدادات الأصلية
# ─────────────────────────────────────────────────────────────────────────────
from .settings import *

BASE_DIR = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────────────────────────────────────────
# 3. DEBUG = True حتى لا تكسر image_firewall.verify_identity منطق الاختبارات
#    (كانت DEBUG=False تُفشل جميع اختبارات الهوية البيومترية حتى في الاختبارات!)
# ─────────────────────────────────────────────────────────────────────────────
DEBUG = True

# ─────────────────────────────────────────────────────────────────────────────
# 4. حذف التطبيقات الثقيلة — الأسماء الصحيحة كما في settings.py
#    (كان 'django_constance' خاطئاً — الاسم الحقيقي هو 'constance')
# ─────────────────────────────────────────────────────────────────────────────
INSTALLED_APPS = [app for app in INSTALLED_APPS if app not in [
    'drf_spectacular',
    'constance',                      # حُذف بالاسم الصحيح
    'constance.backends.database',
    'picklefield',
]]

# ─────────────────────────────────────────────────────────────────────────────
# 5. تقليص Middleware
# ─────────────────────────────────────────────────────────────────────────────
MIDDLEWARE = [m for m in MIDDLEWARE if not any(x in m for x in [
    'RLSMiddleware',
    'SovereignSafetyMiddleware',
    'JudicialLockoutMiddleware',
    'SovereignResponseMiddleware',
    'WhiteNoiseMiddleware',
    'MaintenanceModeMiddleware',
    'SovereignGuardMiddleware',
    'CSPMiddleware',
])]

# ─────────────────────────────────────────────────────────────────────────────
# 6. قاعدة بيانات SQLite للاختبار
# ─────────────────────────────────────────────────────────────────────────────
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'test_db.sqlite3'),
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 7. الكاش في الذاكرة
# ─────────────────────────────────────────────────────────────────────────────
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'test-cache',
    }
}

# ─────────────────────────────────────────────────────────────────────────────
# 8. الأمان والتشفير
# ─────────────────────────────────────────────────────────────────────────────
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
CELERY_TASK_ALWAYS_EAGER = True
PII_HASH_KEY = 'c292ZXJlaWduX3Rlc3RfaG1hY19rZXlfMTY4Yjg4OGI='
PII_CURRENT_KEY_VERSION = 1
PII_ENCRYPTION_KEYS = {"1": "Lf9-nDW20eI5Br59Fw7FE79krO54UCEraMVMzaBByxo="}

# ─────────────────────────────────────────────────────────────────────────────
# 9. تعطيل الذكاء الاصطناعي الثقيل
# ─────────────────────────────────────────────────────────────────────────────
SOVEREIGN_AI = {
    'USE_MOCK': True,
    'USE_SEMANTIC_SEARCH': False,
    'MODEL_NAME': 'mock',
}

# ─────────────────────────────────────────────────────────────────────────────
# 10. تعطيل Migrations لسرعة الاختبار
# ─────────────────────────────────────────────────────────────────────────────
class DisableMigrations:
    def __contains__(self, item): return True
    def __getitem__(self, item): return None
MIGRATION_MODULES = DisableMigrations()

# ─────────────────────────────────────────────────────────────────────────────
# 11. Constance — memory backend (موجود فعلاً في حزمة django-constance)
# ─────────────────────────────────────────────────────────────────────────────
CONSTANCE_BACKEND = 'constance.backends.memory.MemoryBackend'
CONSTANCE_CONFIG = {}
