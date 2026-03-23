import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from standard_core.models import Constitution
from standard_core.engine import SovereignEngine
from standard_core.risk_engine import RiskEngine

def test_sovereign_power():
    print("👑 SOVEREIGN KERNEL VERIFICATION START 👑")
    
    # 1. Ensure Constitution Exists (Singleton)
    cons = Constitution.get_solo()
    print(f"[OK] Constitution Loaded: {cons}")
    
    # 2. Check Default State (Active)
    assert not cons.is_halted, "Constitution should be ACTIVE by default"
    assert SovereignEngine.is_system_active(), "Engine should report ACTIVE"
    print("[OK] System is ACTIVE")
    
    # 3. Test Kill Switch
    print(">> ENGAGING KILL SWITCH...")
    cons.is_halted = True
    cons.save()
    
    # Clear Cache manually since engine caches for 5 mins
    from django.core.cache import cache
    cache.delete("sovereign_halt_status")
    
    assert cons.is_halted, "Constitution should be HALTED"
    assert not SovereignEngine.is_system_active(), "Engine should report HALTED"
    print("[OK] System is HALTED correctly.")
    
    # 4. Check Risk Engine Obedience
    decision = SovereignEngine.evaluate_booking(None, None) # Arguments ignored if halted
    assert decision.risk_level == "CRITICAL", f"Risk Engine should return CRITICAL, got {decision.risk_level}"
    print("[OK] Risk Engine OBEYS the Kill Switch.")
    
    # 5. Reset
    print(">> RESTORING SYSTEM...")
    cons.is_halted = False
    cons.save()
    cache.delete("sovereign_halt_status")
    
    assert SovereignEngine.is_system_active(), "System restored."
    print("[OK] System Restored.")
    
    print("✅ VERIFICATION COMPLETE: ALL SYSTEMS NOMINAL")

if __name__ == "__main__":
    try:
        test_sovereign_power()
    except Exception as e:
        print(f"❌ FAILED: {e}")
        sys.exit(1)
