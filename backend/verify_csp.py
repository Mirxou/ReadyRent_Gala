import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

print("Checking CSP Configuration...")
try:
    middleware = settings.MIDDLEWARE
    if 'csp.middleware.CSPMiddleware' in middleware:
        print("✅ CSPMiddleware Found in MIDDLEWARE")
    else:
        print("❌ CSPMiddleware MISSING from MIDDLEWARE")
        
    print(f"CSP_SCRIPT_SRC: {getattr(settings, 'CSP_SCRIPT_SRC', 'MISSING')}")
    print(f"CSP_OBJECT_SRC: {getattr(settings, 'CSP_OBJECT_SRC', 'MISSING')}")

    import csp
    print(f"✅ django-csp module imported successfully: {csp.__version__}")
    
except Exception as e:
    print(f"❌ Verification Failed: {e}")
