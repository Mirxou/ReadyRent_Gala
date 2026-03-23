import os
import sys
import django
import time

# Added project root
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
os.environ['SENTRY_DSN'] = "" # No Sentry
django.setup()

from apps.users.models import User, VerificationStatus
from apps.social.models import Vouch
from apps.users.services_risk import RiskScoreService

def test_social_vouching():
    print("🕸️  Testing Social Vouching (Web of Trust 2.0)...")

    # 1. Setup Users
    # ------------------------------------------------------------------
    # "The Uncle" - Highly Trusted, Verified
    uncle, _ = User.objects.get_or_create(email="uncle_trust@test.com", defaults={'username': 'uncle_trust'})
    VerificationStatus.objects.update_or_create(
        user=uncle,
        defaults={'status': 'verified', 'risk_score': 10} # Risk 10 = 90% Reliability
    )
    
    # "The Nephew" - New User, Unverified
    nephew, _ = User.objects.get_or_create(email="nephew_new@test.com", defaults={'username': 'nephew_new'})
    VerificationStatus.objects.update_or_create(
        user=nephew,
        defaults={'status': 'pending', 'risk_score': 50}
    )
    
    # "The Scammer" - Blacklisted/High Risk
    scammer, _ = User.objects.get_or_create(email="scammer@test.com", defaults={'username': 'scammer'})
    VerificationStatus.objects.update_or_create(
        user=scammer,
        defaults={'status': 'rejected', 'risk_score': 80}
    )

    # 2. Baseline Check
    # ------------------------------------------------------------------
    base_score = RiskScoreService.calculate_score(nephew)
    print(f"   Baseline Risk (Nephew): {base_score} (Expected ~50)")

    # 3. Create Vouch (Uncle -> Nephew)
    # ------------------------------------------------------------------
    print("\n🤝 Creating Vouch: Uncle -> Nephew (Level 5: Inner Circle)...")
    vouch_1, created = Vouch.objects.update_or_create(
        voucher=uncle,
        receiver=nephew,
        defaults={
            'relationship': 'family',
            'trust_level': 5
        }
    )
    
    # 4. Verify Impact (Transitive Trust)
    # ------------------------------------------------------------------
    # Calculation:
    # Uncle Risk = 10 -> Credibility = 0.9
    # Trust Level = 5
    # Impact = 5 * 0.9 * 10 = 45 points
    # New Score should be ~ 50 - 45 = 5
    
    new_score = RiskScoreService.calculate_score(nephew)
    print(f"   New Risk Score: {new_score}")
    
    if new_score <= 10:
        print(f"   ✅ PASS: Trust Transferred! Risk dropped from {base_score} to {new_score}.")
    else:
        print(f"   ❌ FAIL: Risk Score logic incorrect. Expected <= 10, got {new_score}.")

    # 5. Test "Bad Actor" Constraint
    # ------------------------------------------------------------------
    print("\n😈 Testing Scammer Vouch (Should be ignored)...")
    vouch_2, _ = Vouch.objects.update_or_create(
        voucher=scammer,
        receiver=nephew,
        defaults={
            'relationship': 'friend',
            'trust_level': 5
        }
    )
    
    scammer_impact_score = RiskScoreService.calculate_score(nephew)
    print(f"   Risk Score after Scammer Vouch: {scammer_impact_score}")
    
    if scammer_impact_score == new_score:
        print("   ✅ PASS: Scammer's vouch had ZERO impact (Correct).")
    else:
        print(f"   ❌ FAIL: Scammer influenced the score! Changed to {scammer_impact_score}.")

if __name__ == "__main__":
    test_social_vouching()
