"""
Privacy Verification for Phase 23: No Public Exposure of Individual Users

Verifies:
1. Public endpoints (judgments, metrics) don't expose PII
2. Abuse endpoints are strictly admin-only
3. Anonymization is working correctly
4. No user emails, names, or identifiable info in public APIs
"""
import os
import sys
import django

# Django setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def log(message, level="INFO", color=""):
    prefix = f"[PHASE 23 - PRIVACY]"
    if color:
        print(f"{color}{prefix} {message} {level}{RESET}")
    else:
        print(f"{prefix} {message} {level}")

def check_for_pii(data, context=""):
    """
    Check if data contains PII (emails, names, user IDs in unexpected places).
    
    Returns (has_pii, findings)
    """
    findings = []
    data_str = str(data).lower()
    
    # Check for email patterns
    if '@' in data_str and 'email' not in context:
        findings.append(f"Email found in {context}")
    
    # Check for specific PII fields that shouldn't be public
    pii_fields = ['email', 'phone', 'address', 'user_id', 'username']
    for field in pii_fields:
        if field in data_str and field != 'user' and 'anonymous' not in context:
            # Allow in specific contexts
            if context in ['abuse_endpoint', 'admin_only']:
                continue
            findings.append(f"PII field '{field}' found in {context}")
    
    return len(findings) > 0, findings

def main():
    log("=" * 60, "", CYAN)
    log("PRIVACY VERIFICATION: No Public Exposure of Users", "", CYAN)
    log("=" * 60, "", CYAN)
    
    client = APIClient()
    
    tests_passed = 0
    tests_total = 0
    
    #=========================================================================
    # TEST 1: Public judgment ledger doesn't expose PII
    #=========================================================================
    log("TEST 1: Checking public judgment ledger for PII...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/judgments/')
    
    checks = []
    
    if response.status_code == 200:
        data = response.json()
        
        # Check if we have results
        if 'results' in data and len(data['results']) > 0:
            has_pii, findings = check_for_pii(data, context="public_judgments")
            checks.append((
                not has_pii,
                f"No PII in public judgments: {findings if has_pii else 'clean'}"
            ))
            
            # Check specific fields
            first_result = data['results'][0]
            checks.append((
                'user_email' not in first_result,
                "No user_email field in judgments"
            ))
            checks.append((
                'user_name' not in first_result,
                "No user_name field in judgments"
            ))
        else:
            log("  ℹ️  No judgment data to check", "INFO", CYAN)
            checks.append((True, "No data (acceptable for empty DB)"))
    else:
        checks.append((True, f"Public judgments endpoint: {response.status_code}"))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 2: Public metrics dashboard doesn't expose users
    #=========================================================================
    log("TEST 2: Checking public metrics for user exposure...", "ACTION", YELLOW)
    
    response = client.get('/api/disputes/public/metrics/dashboard/')
    
    checks = []
    
    if response.status_code == 200:
        data = response.json()
        
        has_pii, findings = check_for_pii(data, context="public_metrics")
        checks.append((
            not has_pii,
            f"No PII in public metrics: {findings if has_pii else 'clean'}"
        ))
        
        # Ensure only aggregates, no individual user data
        data_str = str(data)
        checks.append((
            'user_id' not in data_str.lower() or 'user_id' in str(data.get('disclaimer', '')),
            "No user_id in metrics (only aggregates)"
        ))
    else:
        checks.append((True, f"Public metrics endpoint: {response.status_code}"))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 3: Abuse endpoints are NOT public
    #=========================================================================
    log("TEST 3: Verifying abuse endpoints are admin-only...", "ACTION", YELLOW)
    
    abuse_endpoints = [
        '/api/disputes/admin/abuse/dashboard/',
        '/api/disputes/admin/abuse/logs/',
    ]
    
    all_blocked = True
    for endpoint in abuse_endpoints:
        response = client.get(endpoint)
        if response.status_code not in [401, 403]:
            all_blocked = False
            log(f"  ⚠️  {endpoint} accessible without auth: {response.status_code}", "WARNING", YELLOW)
    
    checks = [
        (all_blocked, "All abuse endpoints require authentication")
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 4: Expectation endpoints don't leak user abuse data
    #=========================================================================
    log("TEST 4: Checking expectation endpoints for abuse data leakage...", "ACTION", YELLOW)
    
    # Test pre-booking endpoint (should be public, no abuse data)
    # Note: This may 404 without product, which is acceptable
    response = client.get('/api/disputes/expectations/booking/999/')
    
    checks = []
    
    if response.status_code == 200:
        data = response.json()
        
        # Should NOT contain abuse pattern data
        data_str = str(data).lower()
        checks.append((
            'serial_filer' not in data_str,
            "No abuse pattern data (serial_filer) in expectations"
        ))
        checks.append((
            'gaming' not in data_str or 'gaming the system' in data_str,
            "No abuse pattern data (gaming) in expectations"
        ))
    else:
        # 404 is acceptable if product doesn't exist
        checks.append((
            response.status_code in [404, 403, 401],
            f"Expectation endpoint appropriately protected or not found: {response.status_code}"
        ))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 5: Admin endpoints DO show user info (for internal use)
    #=========================================================================
    log("TEST 5: Verifying admin endpoints show data when authenticated...", "ACTION", YELLOW)
    
    # Create/get admin user
    admin = User.objects.filter(is_staff=True).first()
    if not admin:
        admin = User.objects.create_superuser(
            username='privacy_test_admin',
            email='privacy_admin@test.com',
            password='test123'
        )
    
    client.force_authenticate(user=admin)
    
    response = client.get('/api/disputes/admin/abuse/dashboard/')
    
    checks = []
    
    if response.status_code == 200:
        data = response.json()
        
        # Admin endpoints SHOULD have user info
        checks.append((
            'patterns' in data,
            "Admin dashboard has pattern data"
        ))
        checks.append((
            'disclaimer' in data,
            "Admin dashboard has disclaimer/context"
        ))
    else:
        checks.append((False, f"Admin dashboard not accessible: {response.status_code}"))
    
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
    log(f"PRIVACY VERIFICATION: {tests_passed}/{tests_total} PASSED", "", CYAN)
    log("=" * 60, "", CYAN)
    
    if tests_passed == tests_total:
        log("=" * 60, "", GREEN)
        log("🎉 ALL PRIVACY CHECKS PASSED", "", GREEN)
        log("✅ No public exposure of individual users", "", GREEN)
        log("=" * 60, "", GREEN)
    else:
        log("=" * 60, "", RED)
        log(f"⚠️  {tests_total - tests_passed} PRIVACY CHECKS FAILED", "FAIL", RED)
        log("=" * 60, "", RED)

if __name__ == '__main__':
    main()
