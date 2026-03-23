import os
import django
import sys

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Dispute, JudicialPanel
from apps.users.models import User
from standard_core.engine import SovereignEngine

def test_sovereign_routing():
    print("⚖️ SOVEREIGN ROUTING VERIFICATION START ⚖️")
    
    # 0. Setup User
    user, _ = User.objects.get_or_create(email="router_test@example.com", defaults={"phone_number": "+213555555555"})
    
    # 1. Create Panels
    routine_panel, _ = JudicialPanel.objects.get_or_create(
        name="Routine Panel Alpha",
        defaults={"panel_type": "routine", "max_cases_per_week": 10}
    )
    high_court, _ = JudicialPanel.objects.get_or_create(
        name="High Court Chamber 1",
        defaults={"panel_type": "high_court", "max_cases_per_week": 5}
    )
    
    # Ensure active
    routine_panel.is_active = True
    routine_panel.save()
    high_court.is_active = True
    high_court.save()
    
    print(f"[OK] Panels Ready: {routine_panel}, {high_court}")
    
    # 2. Test Routine Routing (Medium Priority)
    print(">> CREATING MEDIUM PRIORITY DISPUTE...")
    d1 = Dispute.objects.create(
        title="Minor Damage Dispute",
        description="Scratch on bumper.",
        priority="medium",
        user=user
    )
    
    d1.refresh_from_db()
    assert d1.judicial_panel == routine_panel, f"Expected Routine Panel, got {d1.judicial_panel}"
    print(f"[OK] Dispute #{d1.id} routed to {d1.judicial_panel}")
    
    # 3. Test High Court Routing (Urgent Priority)
    print(">> CREATING URGENT PRIORITY DISPUTE...")
    d2 = Dispute.objects.create(
        title="Major Fraud Alert",
        description="Car never returned.",
        priority="urgent",
        user=user
    )
    
    d2.refresh_from_db()
    assert d2.judicial_panel == high_court, f"Expected High Court, got {d2.judicial_panel}"
    print(f"[OK] Dispute #{d2.id} routed to {d2.judicial_panel}")
    
    # 4. Verify Engine Policy
    policy = SovereignEngine.get_routing_policy("urgent")
    assert policy == "high_court", "Engine Policy mismatch"
    print(f"[OK] Engine Policy Verified: Urgent -> {policy}")

    print("✅ VERIFICATION COMPLETE: ROUTING ACTIVE")

if __name__ == "__main__":
    try:
        test_sovereign_routing()
    except Exception as e:
        print(f"❌ FAILED: {e}")
        sys.exit(1)
