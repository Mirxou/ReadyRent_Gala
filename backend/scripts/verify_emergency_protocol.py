
import os
import sys
import django
import time
# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.core.cache import cache
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory, force_authenticate
from apps.products.models import Product, Category
from apps.bookings.views import BookingCreateView

User = get_user_model()

def log(scenario, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m", # Success
        "red": "\033[91m",   # Fail
        "yellow": "\033[93m", # Info
        "blue": "\033[94m",  # Action
        "white": "\033[0m"
    }
    reset = "\033[0m"
    print(f"{colors.get(color, reset)}[{scenario}] [{status}] {message}{reset}")

class EmergencyTester:
    def __init__(self):
        self.factory = APIRequestFactory()
        self.view = BookingCreateView.as_view()
        self.user = None
        self.admin = None
    
    def setup(self):
        log("SETUP", "Initializing Emergency Environment...", "ACTION")
        
        # User
        self.user, _ = User.objects.update_or_create(
            email="emergency_citizen@standard.rent",
            defaults={'username': 'emergency_citizen', 'role': 'customer'}
        )
        self.user.set_password("pass123")
        self.user.save()
        
        # Admin
        self.admin, _ = User.objects.update_or_create(
            email="emergency_admin@standard.rent",
            defaults={'username': 'emergency_admin', 'role': 'admin'}
        )
        self.admin.set_password("adminpass")
        self.admin.save()
        
        log("SETUP", "User and Admin Ready.", "SUCCESS", "green")

    def test_kill_switch(self):
        log("TEST 1", "--- KILL SWITCH ACTIVATION ---", "INFO", "yellow")
        
        # Monkey-Patch Cache for Single Machine Testing (Redis might be down)
        # We replace the cache.get/set methods with a simple dict wrapper for this test process
        self._local_cache = {}
        
        def mock_set(key, value, timeout=None):
            self._local_cache[key] = value
            
        def mock_get(key, default=None):
            return self._local_cache.get(key, default)
            
        def mock_delete(key):
            if key in self._local_cache:
                del self._local_cache[key]

        # Patching both the script's cache reference AND the middleware's cache reference
        # Since they both import 'cache' from django.core.cache, patching the object methods is tricky
        # because it's a proxy.
        # Instead, we will rely on the fact that if we use LocMemCache in settings it works, 
        # but changing settings at runtime is hard.
        # Let's try mocking the cache object method calls if possible.
        
        from django.core.cache import cache as django_cache
        django_cache.set = mock_set
        django_cache.get = mock_get
        django_cache.delete = mock_delete
        
        # 1. Activate Maintenance Mode
        log("TEST 1", "Activating Kill Switch (Mock Cache)...", "ACTION")
        django_cache.set('MAINTENANCE_MODE', True, timeout=300)
        
        # 2. Try POST as User (Should Block)
        payload = {"dummy": "data"}
        request = self.factory.post('/api/bookings/', payload, format='json')
        request.user = self.user  # Manually set user for middleware check
        
        # We need to simulate middleware manually? 
        # APIRequestFactory does NOT run middleware automatically unless used with Client().
        # However, using Client requires LiveServerTestCase or similar overhead to test e2e properly.
        # But we can verify middleware logic by instantiating it.
        
        from apps.core.middleware import MaintenanceModeMiddleware
        
        # Mocking get_response to return success if middleware passes
        def mock_get_response(req):
            from django.http import HttpResponse
            return HttpResponse("Passed", status=200)
            
        middleware = MaintenanceModeMiddleware(mock_get_response)
        
        log("TEST 1", "Simulating Request through Middleware (User)...", "ACTION")
        response = middleware(request)
        
        if response.status_code == 503:
             log("TEST 1", "User BLOCKED correctly (503).", "SUCCESS", "green")
        else:
             log("TEST 1", f"User NOT Blocked! Status: {response.status_code}", "FAIL", "red")
             
        # 3. Try POST as Admin (Should Pass)
        request_admin = self.factory.post('/api/bookings/', payload, format='json')
        request_admin.user = self.admin # Manually set user for middleware check
        
        log("TEST 1", "Simulating Request through Middleware (Admin)...", "ACTION")
        response_admin = middleware(request_admin)
        
        if response_admin.status_code == 200:
             log("TEST 1", "Admin ALLOWED correctly (200).", "SUCCESS", "green")
        else:
             log("TEST 1", f"Admin BLOCKED! Status: {response_admin.status_code}", "FAIL", "red")
             
        # 4. Deactivate
        log("TEST 1", "Deactivating Kill Switch...", "ACTION")
        cache.delete('MAINTENANCE_MODE')
        
        # 5. Verify User Access
        response_normal = middleware(request)
        if response_normal.status_code == 200:
             log("TEST 1", "System RESTORED. User has access.", "SUCCESS", "green")
        else:
             log("TEST 1", f"System FAILED to restore. Status: {response_normal.status_code}", "FAIL", "red")

    def run(self):
        self.setup()
        print("-" * 50)
        self.test_kill_switch()
        print("-" * 50)

if __name__ == "__main__":
    tester = EmergencyTester()
    tester.run()
