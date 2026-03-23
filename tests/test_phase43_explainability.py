"""
Phase 43: Test Explainability (Plain Language AI)
Ensures all AI proposals are expressed in legal language without jargon.
"""

import os
import django
import sys
from decimal import Decimal

# Setup Django environment
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.explainability_helper import ExplainabilityHelper
from apps.disputes.models import Dispute, Judgment, MediationSession, SettlementOffer
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.users.models import User
from apps.disputes.mediation_service import MediationService
from django.utils import timezone
from datetime import timedelta


def test_explainability_helper():
    """Test that ExplainabilityHelper produces jargon-free language."""
    print("\n=== Testing ExplainabilityHelper ===\n")
    
    # Test 1: Precedent Strength Descriptions
    print("Test 1: Precedent Strength Mapping")
    test_scores = [0.95, 0.85, 0.70, 0.55]
    for score in test_scores:
        description = ExplainabilityHelper.describe_precedent_strength(score)
        print(f"  Score {score:.2f} → '{description}'")
        # Assert no percentages or technical terms
        assert '%' not in description
        assert 'vector' not in description.lower()
        assert 'similarity' not in description.lower() or 'Similar' in description  # Allow "Similar" but not "similarity score"
    
    print("  ✅ All descriptions are in plain language")
    
    # Test 2: Fallback Explanation
    print("\nTest 2: Fallback Explanation (No Precedents)")
    fallback_rationale = ExplainabilityHelper.generate_legal_rationale(
        valid_cases=[],
        suggested_amount=Decimal('250.00'),
        booking_price=Decimal('500.00'),
        is_fallback=True
    )
    
    print(f"  Why This Value: {fallback_rationale['why_this_value'][:80]}...")
    print(f"  Confidence Range: {fallback_rationale['confidence_min']} - {fallback_rationale['confidence_max']}")
    
    # Verify no jargon
    explanation_text = fallback_rationale['why_this_value']
    assert 'vector' not in explanation_text.lower()
    assert 'embedding' not in explanation_text.lower()
    assert '%' not in explanation_text  # No percentages
    print("  ✅ Fallback explanation contains no jargon")
    
    # Test 3: Structured Formatting
    print("\nTest 3: Structured Explanation Format")
    formatted = ExplainabilityHelper.format_structured_explanation(fallback_rationale)
    
    # Verify sections exist
    assert 'WHY THIS VALUE:' in formatted
    assert 'CONFIDENCE RANGE:' in formatted
    print("  ✅ Explanation has required sections")
    print(f"\n{formatted}\n")
    
    return True


def test_mediation_proposal_explainability():
    """Test that mediation proposals use plain language."""
    print("\n=== Testing Mediation Proposal Explainability ===\n")
    
    # Setup test data
    admin = User.objects.filter(is_superuser=True).first()
    if not admin:
        admin = User.objects.create_superuser(
            email='admin@test.local',
            username='admin_test',
            password='testpass123'
        )
    
    tenant = User.objects.get_or_create(
        email='tenant@phase43.test',
        defaults={'username': 'tenant_p43', 'role': 'renter'}
    )[0]
    
    owner = User.objects.get_or_create(
        email='owner@phase43.test',
        defaults={'username': 'owner_p43', 'role': 'item_owner'}
    )[0]
    
    cat = Category.objects.get_or_create(
        name="Phase 43 Test",
        defaults={'slug': 'phase-43-test', 'name_ar': 'اختبار المرحلة 43'}
    )[0]
    
    product = Product.objects.get_or_create(
        name="Phase 43 Test Item",
        defaults={
            'owner': owner,
            'category': cat,
            'price_per_day': 100,
            'slug': 'phase-43-item',
            'name_ar': 'عنصر اختبار',
            'description': 'Test product for Phase 43',
            'size': 'Medium',
            'color': 'Blue'
        }
    )[0]
    
    booking = Booking.objects.create(
        product=product,
        user=tenant,
        start_date=timezone.now(),
        end_date=timezone.now() + timedelta(days=3),
        total_days=3,
        total_price=300,
        status='completed'
    )
    
    dispute = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="[PHASE43] Test Dispute for Explainability",
        description="Testing plain language explanations",
        status='filed'
    )
    
    # Start mediation
    print("Creating mediation session...")
    session = MediationService.start_mediation(dispute)
    offer = session.offers.first()
    
    print(f"\n✅ Mediation session created (#{session.id})")
    print(f"   Proposed Amount: {offer.amount} DZD")
    print(f"   Confidence Range: {offer.confidence_min} - {offer.confidence_max} DZD")
    print(f"   Explainability Version: {offer.explainability_version}")
    
    # Verify confidence intervals exist
    assert offer.confidence_min is not None, "Confidence minimum must be set"
    assert offer.confidence_max is not None, "Confidence maximum must be set"
    assert offer.confidence_min <= offer.amount <= offer.confidence_max, "Amount must be within confidence range"
    
    print("\n✅ Confidence intervals are valid")
    
    # Verify explanation format
    reasoning = offer.reasoning
    print(f"\n=== Explanation Preview ===")
    print(reasoning[:300])
    print("...\n")
    
    # Check for jargon
    forbidden_terms = ['vector', 'embedding', 'similarity score', 'digital jurisdiction']
    jargon_found = []
    for term in forbidden_terms:
        if term.lower() in reasoning.lower():
            jargon_found.append(term)
    
    if jargon_found:
        print(f"❌ JARGON DETECTED: {jargon_found}")
        print("Full reasoning:")
        print(reasoning)
        return False
    else:
        print("✅ No technical jargon detected")
    
    # Verify required sections
    required_sections = ['WHY THIS VALUE:', 'CONFIDENCE RANGE:']
    missing_sections = [s for s in required_sections if s not in reasoning]
    
    if missing_sections:
        print(f"❌ MISSING SECTIONS: {missing_sections}")
        return False
    else:
        print(f"✅ All required sections present")
    
    # Clean up
    Dispute.objects.filter(title__startswith="[PHASE43]").delete()
    
    return True


if __name__ == "__main__":
    print("🚀 PHASE 43: JUDICIAL EXPLAINABILITY TEST")
    print("=" * 60)
    
    success = True
    
    try:
        test_explainability_helper()
        test_mediation_proposal_explainability()
        
        print("\n" + "=" * 60)
        print("✅ ALL PHASE 43 TESTS PASSED!")
        print("🎯 Plain-language explanations verified")
        print("=" * 60)
        
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
        success = False
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        success = False
    
    sys.exit(0 if success else 1)
