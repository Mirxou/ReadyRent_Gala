"""
Verification Test for Phase 23, Step 2: Public Judgment Ledger

Tests:
1. API accessible without authentication
2. Only published judgments visible
3. Filtering works (category, verdict, date)
4. Search functionality
5. Similar cases endpoint
6. Statistics endpoint
7. No reverse identification possible
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

from django.test import Client
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.users.models import UserProfile
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.disputes.models import Dispute, Judgment, AnonymizedJudgment, EvidenceLog
from apps.disputes.judgment_anonymizer import JudgmentAnonymizer

User = get_user_model()

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def log(message, level="INFO", color=""):
    prefix = f"[PHASE 23 - STEP 2]"
    if color:
        print(f"{color}{prefix} {message} {level}{RESET}")
    else:
        print(f"{prefix} {message} {level}")

def main():
    log("=" * 60, "", CYAN)
    log("VERIFICATION: Public Judgment Ledger API", "", CYAN)
    log("=" * 60, "", CYAN)
    
    #=========================================================================
    # SETUP
    #=========================================================================
    log("Setting up test data...", "ACTION", YELLOW)
    
    # Create multiple judgments with different characteristics
    client = APIClient()
    
    # Clean existing
    AnonymizedJudgment.objects.all().delete()
    
    # Create 5 test judgments with varied data
    test_cases = []
    
    for i in range(5):
        # Vary the category, verdict, consistency
        categories = ['Electronics', 'Furniture', 'Electronics', 'Vehicles', 'Electronics']
        verdicts = ['favor_owner', 'favor_renter', 'favor_owner', 'partial', 'favor_owner']
        consistency_scores = [85, 45, 75, 90, 60]
        
        judgment = AnonymizedJudgment.objects.create(
            judgment_hash=f"test_hash_{i}",
            category=categories[i],
            dispute_type=f"Test dispute {i}",
            ruling_summary=f"Test ruling summary {i}",
            verdict=verdicts[i],
            awarded_ratio=Decimal('75.50') if i % 2 == 0 else None,
            evidence_types=['photo', 'contract'] if i % 2 == 0 else ['contract'],
            consistency_score=consistency_scores[i],
            similar_cases_count=3,
            judgment_date=(timezone.now() - timedelta(days=30*i)).date().replace(day=1),
            geographic_region='Algiers' if i % 2 == 0 else None,
            uniqueness_score=30 + (i * 10),  # 30, 40, 50, 60, 70
            publication_delayed_until=None if i < 4 else (timezone.now() + timedelta(days=30)).date(),
            published_at=timezone.now()
        )
        test_cases.append(judgment)
    
    log(f"✓ Created {len(test_cases)} test judgments", "SUCCESS", GREEN)
    
    tests_passed = 0
    tests_total = 0
    
    #=========================================================================
    # TEST 1: API is publicly accessible
    #=========================================================================
    log("TEST 1: Verifying public access (no auth)...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/')
    
    checks = [
        (response.status_code == 200, f"API accessible: {response.status_code}"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 2: Only published judgments visible
    #=========================================================================
    log("TEST 2: Checking publication filtering...", "ACTION", YELLOW)
    
    data = response.json()
    
    # Handle both paginated (dict with 'results') and non-paginated (list) responses
    if isinstance(data, dict):
        results = data.get('results', [])
    else:
        results = data
    
    results_count = len(results)
    
    # Should see 4 judgments (index 4 has future publication date)
    checks = [
        (results_count == 4, f"Published count correct: {results_count}/4"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 3: Filtering by category
    #=========================================================================
    log("TEST 3: Testing category filter...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/?category=Electronics')
    data = response.json()
    results = data if isinstance(data, list) else data.get('results', [])
    electronics_count = len(results)
    
    checks = [
        (electronics_count == 2, f"Electronics filtered: {electronics_count}/2 (one delayed)"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 4: Filtering by verdict
    #=========================================================================
    log("TEST 4: Testing verdict filter...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/?verdict=favor_owner')
    data = response.json()
    results = data if isinstance(data, list) else data.get('results', [])
    owner_verdicts = len(results)
    
    checks = [
        (owner_verdicts == 2, f"Owner verdicts filtered: {owner_verdicts}/2 (one delayed)"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 5: Consistency band filtering
    #=========================================================================
    log("TEST 5: Testing consistency band filter...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/?consistency_band=HIGH')
    data = response.json()
    results = data if isinstance(data, list) else data.get('results', [])
    high_consistency = len(results)
    
    checks = [
        (high_consistency == 2, f"High consistency filtered: {high_consistency}/2 (scores 85, 90)"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 6: Similar cases endpoint
    #=========================================================================
    log("TEST 6: Testing similar cases endpoint...", "ACTION", YELLOW)
    
    # Get first judgment to test similar cases
    first_judgment = test_cases[0]
    response = client.get(f'/api/disputes/public/judgments/{first_judgment.id}/similar_cases/')
    
    checks = [
        (response.status_code == 200, f"Similar cases endpoint: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        data = response.json()
        checks.append((
            'count' in data and 'results' in data,
            f"Response structure correct: count={data.get('count')}"
        ))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 7: Statistics endpoint
    #=========================================================================
    log("TEST 7: Testing statistics endpoint...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/statistics/')
    
    checks = [
        (response.status_code == 200, f"Statistics endpoint: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        data = response.json()
        checks.extend([
            ('total' in data, "Has total count"),
            ('by_category' in data, "Has category breakdown"),
            ('by_verdict' in data, "Has verdict breakdown"),
            ('consistency_distribution' in data, "Has consistency distribution"),
        ])
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 8: No PII in responses
    #=========================================================================
    log("TEST 8: Verifying no PII in API responses...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/')
    data = response.json()
    results = data if isinstance(data, list) else data.get('results', [])
    
    # Check all results for PII
    pii_found = False
    for result in results:
        # Check sensitive fields are not exposed
        if 'user' in result or 'judge' in result or 'booking' in result:
            pii_found = True
            break
    
    checks = [
        (not pii_found, "No PII fields in response"),
        ('judgment_hash' in results[0] if results else False, "Hash used instead of ID"),
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
    log(f"PUBLIC LEDGER VERIFICATION: {tests_passed}/{tests_total} PASSED", "", CYAN)
    log("=" * 60, "", CYAN)
    
    if tests_passed == tests_total:
        log("=" * 60, "", GREEN)
        log("🎉 ALL TESTS PASSED - Public Ledger API VERIFIED", "", GREEN)
        log("=" * 60, "", GREEN)
    else:
        log("=" * 60, "", RED)
        log(f"⚠️  {tests_total - tests_passed} TESTS FAILED", "FAIL", RED)
        log("=" * 60, "", RED)

if __name__ == '__main__':
    main()
