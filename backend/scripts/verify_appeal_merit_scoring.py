import os
import django
import sys
from django.utils import timezone

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, Judgment, Appeal
from apps.disputes.appeal_service import AppealService

def log(test_name, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m",
        "red": "\\033[91m",
        "yellow": "\033[93m",
        "cyan": "\033[96m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}[{test_name}] {message} {status}{colors['reset']}")

def print_merit_report(report):
    """Pretty print merit report with human-explainable factors"""
    print(f"  📊 Merit Score: {report['merit_score']}/100")
    print(f"  🎯 Recommendation: {report['recommendation']}")
    print(f"  💡 Explanation: {report['explanation']}")
    print("  📋 Factors:")
    for factor_name, factor_data in report['factors'].items():
        points = factor_data['points']
        status = factor_data['status']
        explanation = factor_data['explanation']
        sign = '+' if points > 0 else ''
        print(f"    • {factor_name}: {status} ({sign}{points}) - {explanation}")

def run_test():
    print("--------------------------------------------------")
    log("SETUP", "Appeal Merit Scoring Test...", "WAIT", "yellow")
    
    # Cleanup
    Appeal.objects.all().delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Actors
    judge = User.objects.get_or_create(username='judge_merit', email='judge@merit.com')[0]
    tenant = User.objects.get_or_create(username='tenant_merit', email='tenant@merit.com')[0]
    owner = User.objects.get_or_create(username='owner_merit', email='owner@merit.com')[0]
    
    # Category & Product
    category = Category.objects.get_or_create(name="Photography", slug="photography-merit")[0]
    product = Product.objects.create(
        owner=owner,
        name="DSLR Camera",
        slug="dslr-merit",
        price_per_day=200.00,
        category=category,
        size='M',
        color='Black'
    )
    
    booking = Booking.objects.create(
        user=tenant,
        product=product,
        start_date=timezone.now(),
        end_date=timezone.now(),
        total_days=1,
        total_price=200.00,
        status='completed'
    )
    
    dispute = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Camera damage claim",
        description="Lens has scratch",
        status='admissible'
    )
    
    judgment = Judgment.objects.create(
        dispute=dispute,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=600.00,  # High stakes
        finalized_at=timezone.now()
    )
    
    #==========================================================================
    # TEST 1: High Merit Appeal (New Evidence + High Stakes)
    #==========================================================================
    log("TEST 1", "High Merit Appeal (New Evidence + High Stakes)...", "ACTION", "yellow")
    
    appeal1 = Appeal.objects.create(
        judgment=judgment,
        appellant=tenant,
        reason="I have new evidence showing the damage was pre-existing. Photos taken before rental.",
        bond_reference="BOND_001"
    )
    
    report1 = AppealService.evaluate_appeal_merit(appeal1)
    print_merit_report(report1)
    
    if report1['merit_score'] >= 80 and report1['recommendation'] == 'HIGH_COURT_REVIEW':
        log("TEST 1", "HIGH MERIT → High Court routing ✓", "SUCCESS", "green")
    else:
        log("TEST 1", f"Unexpected: {report1['merit_score']}, {report1['recommendation']}", "FAIL", "red")
    
    #==========================================================================
    # TEST 2: Medium Merit Appeal (Procedural Error)
    #==========================================================================
    log("TEST 2", "Medium Merit Appeal (Procedural Error)...", "ACTION", "yellow")
    
    # New dispute for clean test
    dispute2 = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Late return dispute",
        description="Tenant returned 1 day late",
        status='admissible'
    )
    
    judgment2 = Judgment.objects.create(
        dispute=dispute2,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=100.00,  # Lower stakes
        finalized_at=timezone.now()
    )
    
    appeal2 = Appeal.objects.create(
        judgment=judgment2,
        appellant=tenant,
        reason="The judgment was rushed and there was a procedure violation in the hearing process.",
        bond_reference="BOND_002"
    )
    
    report2 = AppealService.evaluate_appeal_merit(appeal2)
    print_merit_report(report2)
    
    if 50 <= report2['merit_score'] < 80 and report2['recommendation'] == 'PANEL_REVIEW':
        log("TEST 2", "MEDIUM MERIT → Panel routing ✓", "SUCCESS", "green")
    else:
        log("TEST 2", f"Unexpected: {report2['merit_score']}, {report2['recommendation']}", "FAIL", "red")
    
    #==========================================================================
    # TEST 3: Low Merit Appeal (No clear factors)
    #==========================================================================
    log("TEST 3", "Low Merit Appeal (No substantive reasons)...", "ACTION", "yellow")
    
    dispute3 = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Simple dispute",
        description="Generic claim",
        status='admissible'
    )
    
    judgment3 = Judgment.objects.create(
        dispute=dispute3,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=50.00,
        finalized_at=timezone.now()
    )
    
    appeal3 = Appeal.objects.create(
        judgment=judgment3,
        appellant=tenant,
        reason="I just don't like this decision.",
        bond_reference="BOND_003"
    )
    
    report3 = AppealService.evaluate_appeal_merit(appeal3)
    print_merit_report(report3)
    
    if report3['merit_score'] < 50 and report3['recommendation'] == 'PRELIMINARY_REVIEW':
        log("TEST 3", "LOW MERIT → Preliminary review (NOT REJECTED) ✓", "SUCCESS", "green")
        log("TEST 3", "  Key Principle: Low merit ≠ Denial, just needs review", "INFO", "cyan")
    else:
        log("TEST 3", f"Unexpected: {report3['merit_score']}, {report3['recommendation']}", "FAIL", "red")
    
    #==========================================================================
    # TEST 4: Human-Explainability Check
    #==========================================================================
    log("TEST 4", "Verifying human-explainability of factors...", "ACTION", "yellow")
    
    all_factors_explained = True
    for factor_name, factor_data in report1['factors'].items():
        if 'explanation' not in factor_data or not factor_data['explanation']:
            log("TEST 4", f"Factor '{factor_name}' missing explanation!", "FAIL", "red")
            all_factors_explained = False
    
    if all_factors_explained:
        log("TEST 4", "All factors have human-readable explanations ✓", "SUCCESS", "green")
        log("TEST 4", "  Principle: Explainability over automation", "INFO", "cyan")
    
    log("FINISH", "Merit System is Transparent and Non-Gatekeeping.", "INFO")

if __name__ == "__main__":
    run_test()
