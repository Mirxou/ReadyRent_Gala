import os
import django
from unittest.mock import Mock, MagicMock

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

# Import from standard_core
from standard_core.mixins import SovereignResponseMixin

class MockView(SovereignResponseMixin):
    # Mocking a DRF View behaves like this
    pass

def test_mixin_logic():
    print("🧪 Testing SovereignResponseMixin (Standard Core)...")
    
    view = MockView()
    request = Mock()
    
    # 1. Test Standard Response (Dict data)
    response = Mock()
    response.data = {'id': 1, 'title': 'Test Dispute'}
    
    final_response = view.finalize_response(request, response)
    
    print(f"   [1] Input: {{'id': 1...}}")
    print(f"       Output: {final_response.data}")
    
    assert final_response.data['dignity_preserved'] is True
    assert final_response.data['status'] == 'sovereign_proceeding'
    assert final_response.data['data']['id'] == 1
    print("       ✅ PASSED (Wrapped Correctly)")

    # 2. Test Already Wrapped Response (Should not double wrap)
    response.data = {'dignity_preserved': True, 'data': 'Already Wrapped'}
    final_response_2 = view.finalize_response(request, response)
    
    print(f"   [2] Input: {{'dignity_preserved': True...}}")
    print(f"       Output: {final_response_2.data}")
    
    # logic in mixin: if 'dignity_preserved' not in response.data: wrap
    # so it should remain as is.
    assert final_response_2.data['data'] == 'Already Wrapped'
    print("       ✅ PASSED (Idempotency)")

    print("\n✨ Sovereign Mixin Logic Verified.")

if __name__ == "__main__":
    try:
        test_mixin_logic()
    except Exception as e:
        print(f"\n❌ FAILED: {e}")
