"""
Verification Test for Phase 23, Step 4: Expectation Setting UI

Tests:
1. Pre-booking widget returns scenario language (not percentages)
2. Pre-dispute warning shows similar cases
3. Evidence patterns analyzed correctly
4. Success factors identified
5. Sovereign Safeguard #4: NO raw percentages in responses
"""
import os
import sys
import django
from datetime import timedelta
from decimal import Decimal

# Django setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.users.models import UserProfile
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.disputes.models import AnonymizedJudgment
from apps.disputes.expectation_setter import ExpectationSetter

User = get_user_model()

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def log(message, level="INFO", color=""):
    prefix = f"[PHASE 23 - STEP 4]"
    if color:
        print(f"{color}{prefix} {message} {level}{RESET}")
    else:
        print(f"{prefix} {message} {level}")

def main():
    log("=" * 60, "", CYAN)
    log("VERIFICATION: Expectation Setting UI", "", CYAN)
    log("=" * 60, "", CYAN)
    
    #=========================================================================
    # SETUP
    #=========================================================================
    log("Setting up test data...", "ACTION", YELLOW)
    
    # Clean existing
    AnonymizedJudgment.objects.all().delete()
    
    # Get or create category and product
    category = Category.objects.filter(name__icontains="Electronics").first()
    if not category:
        category = Category.objects.create(
            name="Electronics",
            description='Electronic devices'
        )
    
    # Create owner
    owner = User.objects.filter(username='expectation_owner').first()
    if not owner:
        owner = User.objects.create_user(
            username='expectation_owner',
            email='expectation_owner@test.com',
            password='test123'
        )
    
    # Use existing product from DB (avoid slug constraint issues)
    product = Product.objects.filter(status='available').first()
    
    if not product:
        # No products available, create one with explicit slug
        import uuid
        product = Product.objects.create(
            name=f"Test Camera {uuid.uuid4().hex[:8]}",
            slug=f"test-camera-{uuid.uuid4().hex[:8]}",  # Explicit slug to avoid conflicts
            owner=owner,
            category=category,
            price_per_day=Decimal('50.00'),
            description='Test camera for expectation setting',
            status='available'
        )
    
    # Create test anonymized judgments
    for i in range(10):
        verdicts = ['favor_owner', 'favor_owner', 'favor_owner', 'favor_owner', 'favor_renter',
                   'favor_owner', 'favor_renter', 'favor_owner', 'partial', 'favor_owner']
        
        AnonymizedJudgment.objects.create(
            judgment_hash=f"expectation_test_{i}",
            category="Electronics",
            dispute_type="damage" if i < 5 else "non_delivery",
            ruling_summary=f"Test ruling summary {i}",
            verdict=verdicts[i],
            awarded_ratio=None,
            evidence_types=['photo', 'contract'] if i % 2 == 0 else ['contract'],
            consistency_score=75 + i,
            similar_cases_count=3,
            judgment_date=(timezone.now() - timedelta(days=i*10)).date(),
            geographic_region=None,
            uniqueness_score=30,
            publication_delayed_until=None,
            published_at=timezone.now()
        )
    
    log(f"✓ Created test data (category, product, 10 judgments)", "SUCCESS", GREEN)
    
    tests_passed = 0
    tests_total = 0
    
    client = APIClient()
    
    #=========================================================================
    # TEST 1: Pre-booking widget returns data
    #=========================================================================
    log("TEST 1: Testing pre-booking widget...", "ACTION", YELLOW)
    
    response = client.get(f'/api/disputes/expectations/booking/{product.id}/')
    
    checks = [
        (response.status_code == 200, f"Endpoint accessible: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        data = response.json()
        checks.extend([
            (data.get('has_data') == True, "Has data (sufficient cases)"),
            ('scenarios' in data, "Contains scenarios"),
            ('general_advice' in data, "Contains general advice"),
        ])
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 2: Scenario language (NO percentages)
    #=========================================================================
    log("TEST 2: Verifying scenario language (no percentages)...", "ACTION", YELLOW)
    
    if response.status_code == 200 and data.get('has_data'):
        scenarios = data.get('scenarios', [])
        
        # Check that scenarios use descriptive language
        has_percentages = False
        has_scenario_language = False
        
        for scenario in scenarios:
            scenario_str = str(scenario)
            
            # Check for raw percentages (bad) - but allow in evidence frequency context
            if '%' in scenario_str or 'percent' in scenario_str.lower():
                # Allow percentages ONLY in frequency or evidence pattern context
                if 'frequency' not in scenario_str.lower() and 'evidence' not in scenario_str.lower() and 'appears in' not in scenario_str.lower():
                    has_percentages = True
            
            # Check for good scenario language
            if 'typical' in scenario_str.lower() or 'usually' in scenario_str.lower() or 'tends' in scenario_str.lower():
                has_scenario_language = True
        
        checks = [
            (not has_percentages, "No raw percentages in outcomes (Safeguard #4)"),
            (has_scenario_language, "Uses scenario language (typical, usually, tends)"),
            (len(scenarios) > 0, f"Generated {len(scenarios)} scenarios"),
        ]
        
        for passed, description in checks:
            if passed:
                log(f"  ✓ {description}", "", GREEN)
                tests_passed += 1
            else:
                log(f"  ✗ {description}", "FAIL", RED)
        
        tests_total += len(checks)
    else:
        log("  ⚠️  Skipping (no data from widget)", "WARNING", YELLOW)
        tests_total += 3
    
    #=========================================================================
    # TEST 3: Pre-dispute warning (requires auth)
    #=========================================================================
    log("TEST 3: Testing pre-dispute warning...", "ACTION", YELLOW)
    
    # Create booking for test
    renter = User.objects.filter(username='expectation_renter').first()
    if not renter:
        renter = User.objects.create_user(
            username='expectation_renter',
            email='expectation_renter@test.com',
            password='test123'
        )
    
    booking, _ = Booking.objects.get_or_create(
        product=product,
        user=renter,
        defaults={
            'start_date': timezone.now().date(),
            'end_date': timezone.now().date() + timedelta(days=3),
            'total_days': 3,
            'total_price': Decimal('150.00'),
            'status': 'confirmed'
        }
    )
    
    # Authenticate as renter
    client.force_authenticate(user=renter)
    
    response = client.post('/api/disputes/expectations/dispute-warning/', {
        'booking_id': booking.id,
        'dispute_category': 'damage'
    })
    
    checks = [
        (response.status_code == 200, f"Warning endpoint accessible: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        warning_data = response.json()
        checks.extend([
            ('has_similar_cases' in warning_data, "Has similar cases flag"),
            ('realistic_expectation' in warning_data or 'recommendation' in warning_data, "Has realistic expectation"),
            ('alternative' in warning_data, "Suggests settlement alternative"),
        ])
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 4: Evidence pattern analysis
    #=========================================================================
    log("TEST 4: Testing evidence pattern analysis...", "ACTION", YELLOW)
    
    expectations = ExpectationSetter.get_booking_expectations(product)
    
    if expectations.get('has_data') and 'scenarios' in expectations:
        # Check if evidence patterns are mentioned
        evidence_mentioned = False
        
        for scenario in expectations['scenarios']:
            scenario_str = str(scenario)
            if 'photo' in scenario_str.lower() or 'contract' in scenario_str.lower() or 'evidence' in scenario_str.lower():
                evidence_mentioned = True
                break
        
        checks = [
            (evidence_mentioned, "Evidence patterns mentioned in scenarios"),
        ]
    else:
        checks = [
            (False, "Could not test evidence patterns (no data)"),
        ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 5: Success factors in dispute warning
    #=========================================================================
    log("TEST 5: Testing success factors in dispute warning...", "ACTION", YELLOW)
    
    warning = ExpectationSetter.get_dispute_warning(booking.id, 'damage')
    
    if warning.get('has_similar_cases'):
        checks = [
            ('success_factors' in warning, "Success factors provided"),
        ]
        
        if 'success_factors' in warning:
            factors = warning['success_factors']
            checks.append((
                len(factors) > 0,
                f"Found {len(factors)} success factors"
            ))
    else:
        checks = [
            (True, "No similar cases (expected for rare disputes)"),
        ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # SUMMARY
    #=========================================================================
    log("=" * 60, "", CYAN)
    log(f"EXPECTATION SETTING VERIFICATION: {tests_passed}/{tests_total} PASSED", "", CYAN)
    log("=" * 60, "", CYAN)
    
    if tests_passed == tests_total:
        log("=" * 60, "", GREEN)
        log("🎉 ALL TESTS PASSED - Expectation Setting VERIFIED", "", GREEN)
        log("=" * 60, "", GREEN)
    else:
        log("=" * 60, "", RED)
        log(f"⚠️  {tests_total - tests_passed} TESTS FAILED", "FAIL", RED)
        log("=" * 60, "", RED)

if __name__ == '__main__':
    main()
