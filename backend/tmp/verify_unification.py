
import os
import django
import sys
from decimal import Decimal

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.test_settings")
django.setup()

from django.core.management import call_command
from apps.users.models import User, VerificationStatus
from apps.users.services.risk import RiskScoreService
from standard_core.risk_engine import RiskEngine

def test_unification():
    print("--- Starting Sovereign Unification Verification ---")
    # 0. Setup Database (Memory)
    call_command('migrate', verbosity=0, interactive=False)
    
    # 1. Create a mock user
    user, created = User.objects.get_or_create(
        email="test_sovereign@rentily.dz",
        defaults={"username": "test_sovereign", "is_verified": True}
    )
    if not created:
        user.trust_score = Decimal("50.00")
        user.save()

    # 2. Mock a VerificationStatus for them (Risk 10 = High Trust)
    vs, _ = VerificationStatus.objects.get_or_create(user=user)
    vs.status = 'verified'
    vs.save()
    
    # 3. Trigger Unification Update
    print(f"Triggering RiskScoreService update for User #{user.id}...")
    # Mocking calculate_score for this test to return risk=10
    original_calc = RiskScoreService.calculate_score
    RiskScoreService.calculate_score = lambda u: 10
    
    try:
        new_risk = RiskScoreService.update_user_risk_score(user)
        user.refresh_from_db()
        
        print(f"Calculated Risk: {new_risk}")
        print(f"Unified Trust Score: {user.trust_score}")
        
        assert user.trust_score == Decimal("90.00"), f"Trust Score Mismatch: {user.trust_score}"
        print("✅ SUCCESS: Trust Score mirrored correctly.")
        
        # 4. Check Risk Engine
        # Create dummy asset
        from standard_core.models import Asset
        asset = Asset(daily_price=Decimal("100.00"))
        
        decision = RiskEngine.evaluate(user, asset)
        print(f"Risk Decision: {decision}")
        
        assert decision.risk_level == "LOW", f"Risk Level Mismatch: {decision.risk_level}"
        assert decision.auto_confirm == True, "Logic Failure: Verified high-trust user should be auto-confirmed."
        print("✅ SUCCESS: Risk Engine recognizes unified trust data.")
        
    finally:
        RiskScoreService.calculate_score = original_calc
        # Clean up if needed
        # user.delete()

if __name__ == "__main__":
    try:
        test_unification()
    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
