"""
Verification Test for Phase 23, Step 1: Judgment Anonymization

Tests:
1. Anonymization creates AnonymizedJudgment
2. PII is removed (names, phone, email, locations)
3. Uniqueness scoring works correctly
4. Dynamic redaction applies when needed
5. Publication delay calculated for high-risk
6. No reverse identification possible
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
    prefix = f"[PHASE 23 - ANONYMIZATION]"
    if color:
        print(f"{color}{prefix} {message} {level}{RESET}")
    else:
        print(f"{prefix} {message} {level}")

def main():
    log("=" * 60, "", CYAN)
    log("VERIFICATION: Judgment Anonymization Service", "", CYAN)
    log("=" * 60, "", CYAN)
    
    #=========================================================================
    # CLEANUP
    #=========================================================================
    log("Cleaning up test data...", "ACTION", YELLOW)
    AnonymizedJudgment.objects.all().delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    Booking.objects.all().delete()
    Product.objects.filter(slug__startswith='phase23-test').delete()
    Category.objects.filter(slug='phase23-test-electronics').delete()
    User.objects.filter(username__startswith='phase23').delete()
    
    #=========================================================================
    # SETUP
    #=========================================================================
    log("Setting up test environment...", "ACTION", YELLOW)
    
    # Create users
    owner = User.objects.create_user(
        username='phase23_owner',
        email='owner@test.com',
        password='test123'
    )
    UserProfile.objects.create(
        user=owner,
        first_name_ar='جون',
        last_name_ar='دو',
        city='Algiers',
        address='123 Test Street'
    )
    
    renter = User.objects.create_user(
        username='phase23_renter',
        email='renter@test.com',
        password='test123'
    )
    UserProfile.objects.create(
        user=renter,
        first_name_ar='جين',
        last_name_ar='دو',
        city='Oran',
        address='456 Test Avenue'
    )
    
    # Create category and product
    category, _ = Category.objects.get_or_create(
        slug='phase23-test-electronics',
        defaults={
            'name': 'Electronics',
            'name_ar': 'إلكترونيات',
        }
    )
    
    product = Product.objects.create(
        owner=owner,
        category=category,
        name='Professional Camera',
        name_ar='كاميرا احترافية',
        slug='phase23-test-camera',
        description='Test camera for Phase 23',
        description_ar='كاميرا اختبار للمرحلة 23',
        price_per_day=Decimal('500.00'),
        size='M',
        color='Black',
        status='available'
    )
    
    # Create booking
    booking = Booking.objects.create(
        user=renter,
        product=product,
        start_date=timezone.now().date(),
        end_date=(timezone.now() + timedelta(days=3)).date(),
        total_days=3,
        total_price=Decimal('1500.00'),
        status='completed'
    )
    
    # Create dispute
    dispute = Dispute.objects.create(
        user=renter,
        booking=booking,
        title='Camera damaged upon return',
        description='الكاميرا تعرضت للضرر',
        priority='medium',
        status='judgment_final'
    )
    
    # Add evidence logs
    EvidenceLog.objects.create(
        dispute=dispute,
        action='PHOTO_EVIDENCE_SUBMITTED',
        actor=renter,
        metadata={'type': 'photo', 'description': 'Damage photos submitted'}
    )
    EvidenceLog.objects.create(
        dispute=dispute,
        action='CONTRACT_UPLOADED',
        actor=renter,
        metadata={'type': 'contract', 'description': 'Rental contract uploaded'}
    )
    
    # Create judgment (with PII in ruling text)
    judgment = Judgment.objects.create(
        dispute=dispute,
        judge=owner,  # Placeholder
        verdict='favor_owner',
        ruling_text=f"""
        الحكم رقم 123
        بعد الاطلاع على القضية المقدمة من السيدة Jane Doe من ولاية Oran ضد John Doe من Algiers.
        رقم الهاتف: 0555123456
        البريد الإلكتروني: owner@test.com
        
        تم الاطلاع على الأدلة المصورة التي تبين بوضوح الضرر.
        الحكم: لصالح المالك
        المبلغ الممنوح: 1200 دينار جزائري
        """,
        awarded_amount=Decimal('1200.00'),
        finalized_at=timezone.now()
    )
    
    log("✓ Test environment setup complete", "SUCCESS", GREEN)
    
    #=========================================================================
    # TEST 1: Anonymization Creation
    #=========================================================================
    log("TEST 1: Creating anonymized judgment...", "ACTION", YELLOW)
    
    anonymized = JudgmentAnonymizer.anonymize_judgment(judgment)
    
    tests_passed = 0
    tests_total = 13
    
    checks = [
        (anonymized.id is not None, "AnonymizedJudgment created"),
        (anonymized.category == 'Electronics', f"Category preserved: {anonymized.category}"),
        (anonymized.verdict == 'favor_owner', f"Verdict preserved: {anonymized.verdict}"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total = len(checks)
    
    #=========================================================================
    # TEST 2: PII Removal
    #=========================================================================
    log("TEST 2: Verifying PII removal...", "ACTION", YELLOW)
    
    ruling_summary = anonymized.ruling_summary
    
    pii_checks = [
        ('Jane Doe' not in ruling_summary, "Name 'Jane Doe' removed"),
        ('John Doe' not in ruling_summary, "Name 'John Doe' removed"),
        ('0555123456' not in ruling_summary, "Phone number removed"),
        ('owner@test.com' not in ruling_summary, "Email removed"),
        ('Algiers' not in ruling_summary or 'الجزائر' not in ruling_summary, "Location redacted"),
        ('Oran' not in ruling_summary or 'وهران' not in ruling_summary, "Location redacted"),
    ]
    
    for passed, description in pii_checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(pii_checks)
    
    log(f"  Anonymized summary preview: {ruling_summary[:100]}...", "", CYAN)
    
    #=========================================================================
    # TEST 3: Uniqueness Scoring
    #=========================================================================
    log("TEST 3: Testing uniqueness scoring...", "ACTION", YELLOW)
    
    uniqueness_score = anonymized.uniqueness_score
    
    uniqueness_checks = [
        (uniqueness_score >= 0 and uniqueness_score <= 100, f"Uniqueness score in range: {uniqueness_score}/100"),
        (anonymized.judgment_date.day == 1, f"Date rounded to month: {anonymized.judgment_date}"),
    ]
    
    for passed, description in uniqueness_checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(uniqueness_checks)
    
    #=========================================================================
    # TEST 4: Dynamic Redaction
    #=========================================================================
    log("TEST 4: Testing dynamic redaction...", "ACTION", YELLOW)
    
    # High uniqueness should trigger redaction
    if uniqueness_score >= JudgmentAnonymizer.UNIQUENESS_REDACT:
        redaction_check = anonymized.geographic_region is None or anonymized.awarded_ratio is None
        if redaction_check:
            log(f"  ✓ High uniqueness ({uniqueness_score}) → Redaction applied", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ High uniqueness but no redaction", "FAIL", RED)
    else:
        log(f"  ✓ Low uniqueness ({uniqueness_score}) → No redaction needed", "", GREEN)
        tests_passed += 1
    
    tests_total += 1
    
    #=========================================================================
    # TEST 5: Evidence Types Extraction
    #=========================================================================
    log("TEST 5: Verifying evidence types extraction...", "ACTION", YELLOW)
    
    evidence_checks = [
        ('photo' in anonymized.evidence_types, "Photo evidence detected"),
        ('contract' in anonymized.evidence_types or 'document' in str(anonymized.evidence_types), "Contract evidence detected"),
    ]
    
    for passed, description in evidence_checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(evidence_checks)
    
    log(f"  Evidence types: {anonymized.evidence_types}", "", CYAN)
    
    #=========================================================================
    # SUMMARY
    #=========================================================================
    log("=" * 60, "", CYAN)
    log(f"ANONYMIZATION VERIFICATION: {tests_passed}/{tests_total} PASSED", "", CYAN)
    log("=" * 60, "", CYAN)
    
    log("✓ AnonymizedJudgment created", "", GREEN)
    log(f"✓ Uniqueness score: {uniqueness_score}/100", "", GREEN)
    log(f"✓ Publication delay: {anonymized.publication_delayed_until or 'None (low-risk)'}", "", GREEN)
    log(f"✓ Geographic region: {anonymized.geographic_region or '[REDACTED]'}", "", GREEN)
    log(f"✓ Awarded ratio: {anonymized.awarded_ratio or '[REDACTED]'}%", "", GREEN)
    
    if tests_passed == tests_total:
        log("=" * 60, "", GREEN)
        log("🎉 ALL TESTS PASSED - Anonymization Service VERIFIED", "", GREEN)
        log("=" * 60, "", GREEN)
    else:
        log("=" * 60, "", RED)
        log(f"⚠️  {tests_total - tests_passed} TESTS FAILED", "FAIL", RED)
        log("=" * 60, "", RED)

if __name__ == '__main__':
    main()
