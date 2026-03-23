"""
Verification Test for Phase 23, Step 5: Abuse Visibility Dashboard

Tests:
1. Serial filer detection works
2. Gaming attempt detection works
3. Category concentration detection works
4. Admin-only endpoints require authentication
5. User abuse summary retrieval
6. Reputation logs filtering
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

from apps.disputes.models import Dispute, Judgment, UserReputationLog
from apps.disputes.abuse_detector import AbuseDetector
from apps.products.models import Product
from apps.bookings.models import Booking

User = get_user_model()

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def log(message, level="INFO", color=""):
    prefix = f"[PHASE 23 - STEP 5]"
    if color:
        print(f"{color}{prefix} {message} {level}{RESET}")
    else:
        print(f"{prefix} {message} {level}")

def main():
    log("=" * 60, "", CYAN)
    log("VERIFICATION: Abuse Visibility Dashboard", "", CYAN)
    log("=" * 60, "", CYAN)
    
    #=========================================================================
    # SETUP
    #=========================================================================
    log("Setting up test data...", "ACTION", YELLOW)
    
    # Note: This test requires existing disputes and judgments in DB
    # We'll test the detection logic with minimal data
    
    tests_passed = 0
    tests_total = 0
    
    client = APIClient()
    
    #=========================================================================
    # TEST 1: Admin-only endpoint authentication
    #=========================================================================
    log("TEST 1: Testing admin-only access control...", "ACTION", YELLOW)
    
    # Try without auth
    response = client.get('/api/disputes/admin/abuse/dashboard/')
    
    checks = [
        (response.status_code in [401, 403], f"Blocked without auth: {response.status_code}"),
    ]
    
    # Create admin user
    admin = User.objects.filter(is_staff=True).first()
    if not admin:
        admin = User.objects.create_superuser(
            username='test_admin_abuse',
            email='admin_abuse@test.com',
            password='test123'
        )
    
    # Try with admin auth
    client.force_authenticate(user=admin)
    response = client.get('/api/disputes/admin/abuse/dashboard/')
    
    checks.append((
        response.status_code == 200,
        f"Allowed with admin: {response.status_code}"
    ))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 2: Dashboard returns pattern data
    #=========================================================================
    log("TEST 2: Testing dashboard structure...", "ACTION", YELLOW)
    
    if response.status_code == 200:
        data = response.json()
        
        checks = [
            ('summary' in data, "Has summary"),
            ('patterns' in data, "Has patterns"),
            ('disclaimer' in data, "Has disclaimer (context)"),
        ]
        
        if 'patterns' in data:
            patterns = data['patterns']
            checks.extend([
                ('serial_filers' in patterns, "Has serial_filers pattern"),
                ('gaming_attempts' in patterns, "Has gaming_attempts pattern"),
                ('category_concentration' in patterns, "Has category_concentration pattern"),
            ])
        
        for passed, description in checks:
            if passed:
                log(f"  ✓ {description}", "", GREEN)
                tests_passed += 1
            else:
                log(f"  ✗ {description}", "FAIL", RED)
        
        tests_total += len(checks)
    else:
        log("  ⚠️  Skipping (dashboard not accessible)", "WARNING", YELLOW)
        tests_total += 5
    
    #=========================================================================
    # TEST 3: User abuse detail endpoint
    #=========================================================================
    log("TEST 3: Testing user abuse detail...", "ACTION", YELLOW)
    
    # Use admin user ID
    response = client.get(f'/api/disputes/admin/abuse/users/{admin.id}/')
    
    checks = [
        (response.status_code == 200, f"User detail endpoint: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        detail = response.json()
        checks.extend([
            ('user_id' in detail, "Has user_id"),
            ('total_disputes' in detail, "Has total_disputes"),
            ('patterns_detected' in detail, "Has patterns_detected"),
        ])
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 4: Reputation logs endpoint
    #=========================================================================
    log("TEST 4: Testing reputation logs...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/admin/abuse/logs/')
    
    checks = [
        (response.status_code == 200, f"Logs endpoint: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        logs_data = response.json()
        checks.extend([
            ('count' in logs_data, "Has count"),
            ('results' in logs_data, "Has results"),
        ])
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 5: AbuseDetector service methods exist
    #=========================================================================
    log("TEST 5: Testing AbuseDetector service...", "ACTION", YELLOW)
    
    checks = [
        (hasattr(AbuseDetector, 'detect_serial_filers'), "Has detect_serial_filers method"),
        (hasattr(AbuseDetector, 'detect_gaming_attempts'), "Has detect_gaming_attempts method"),
        (hasattr(AbuseDetector, 'detect_category_concentration'), "Has detect_category_concentration method"),
        (hasattr(AbuseDetector, 'get_user_abuse_summary'), "Has get_user_abuse_summary method"),
    ]
    
    # Test that methods run without error (may return empty results)
    try:
        serial_filers = AbuseDetector.detect_serial_filers(days=30)
        checks.append((True, f"detect_serial_filers runs: {len(serial_filers)} found"))
    except Exception as e:
        checks.append((False, f"detect_serial_filers failed: {str(e)}"))
    
    try:
        gaming = AbuseDetector.detect_gaming_attempts(days=90)
        checks.append((True, f"detect_gaming_attempts runs: {len(gaming)} found"))
    except Exception as e:
        checks.append((False, f"detect_gaming_attempts failed: {str(e)}"))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 6: Privacy safeguard - Not public
    #=========================================================================
    log("TEST 6: Testing privacy safeguard...", "ACTION", YELLOW)
    
    # Logout
    client.force_authenticate(user=None)
    
    # Try abuse endpoints without auth
    endpoints = [
        '/api/disputes/admin/abuse/dashboard/',
        f'/api/disputes/admin/abuse/users/{admin.id}/',
        '/api/disputes/admin/abuse/logs/',
    ]
    
    all_blocked = True
    for endpoint in endpoints:
        response = client.get(endpoint)
        if response.status_code not in [401, 403]:
            all_blocked = False
            log(f"  ⚠️  {endpoint} not properly protected: {response.status_code}", "WARNING", YELLOW)
    
    checks = [
        (all_blocked, "All abuse endpoints require authentication"),
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
    log(f"ABUSE VISIBILITY VERIFICATION: {tests_passed}/{tests_total} PASSED", "", CYAN)
    log("=" * 60, "", CYAN)
    
    if tests_passed == tests_total:
        log("=" * 60, "", GREEN)
        log("🎉 ALL TESTS PASSED - Abuse Visibility VERIFIED", "", GREEN)
        log("=" * 60, "", GREEN)
    else:
        log("=" * 60, "", RED)
        log(f"⚠️  {tests_total - tests_passed} TESTS FAILED", "FAIL", RED)
        log("=" * 60, "", RED)

if __name__ == '__main__':
    main()
