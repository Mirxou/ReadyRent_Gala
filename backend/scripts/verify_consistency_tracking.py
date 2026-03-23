import os
import django
import sys
from django.utils import timezone
from django.conf import settings

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, Judgment, JudgmentPrecedent
from apps.disputes.consistency_service import ConsistencyService

def log(test_name, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m",
        "red": "\033[91m",
        "yellow": "\033[93m",
        "cyan": "\033[96m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}[{test_name}] {message} {status}{colors['reset']}")

def run_test():
    print("--------------------------------------------------")
    log("SETUP", "Initializing Consistency Tracking Test...", "WAIT", "yellow")
    
    # Cleanup
    JudgmentPrecedent.objects.all().delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Actors
    judge = User.objects.get_or_create(username='judge_cons', email='judge@cons.com')[0]
    tenant1 = User.objects.get_or_create(username='tenant1_cons', email='tenant1@cons.com')[0]
    tenant2 = User.objects.get_or_create(username='tenant2_cons', email='tenant2@cons.com')[0]
    owner = User.objects.get_or_create(username='owner_cons', email='owner@cons.com')[0]
    
    # Category
    category = Category.objects.get_or_create(name="Electronics", slug="electronics-cons")[0]
    
    #==========================================================================
    # SCENARIO 1: Bootstrap (First 4 judgments → No consistency check)
    #==========================================================================
    log("TEST 1", "Bootstrap Phase (First 4 judgments)...", "ACTION", "yellow")
    
    for i in range(4):
        product = Product.objects.create(
            owner=owner,
            name=f"Product {i}",
            slug=f"product-{i}-cons",
            price_per_day=100.00,
            category=category,
            size='M',
            color='Black'
        )
        
        booking = Booking.objects.create(
            user=tenant1,
            product=product,
            start_date=timezone.now(),
            end_date=timezone.now(),
            total_days=1,
            total_price=100.00,
            status='completed'
        )
        
        dispute = Dispute.objects.create(
            user=tenant1,
            booking=booking,
            title=f"Damage claim {i}",
            description="Product was damaged",
            status='admissible'
        )
        
        judgment = Judgment.objects.create(
            dispute=dispute,
            judge=judge,
            verdict='favor_owner',
            ruling_text="Owner wins",
            status='final',
            awarded_amount=50.00,
            finalized_at=timezone.now()
        )
        
        report = ConsistencyService.evaluate_judgment(judgment)
        
        if report['recommendation'] == 'ESTABLISHING_BASELINE':
            log(f"  JUDGMENT {i+1}", f"Baseline ({i+1}/5) - No check performed", "INFO", "cyan")
        else:
            log(f"  JUDGMENT {i+1}", "ERROR: Should be in baseline mode!", "FAIL", "red")
    
    log("TEST 1", "Bootstrap logic verified (4/5 judgments)", "SUCCESS", "green")
    
    #==========================================================================
    # SCENARIO 2: Fifth Judgment (Consistent with precedents)
    #==========================================================================
    log("TEST 2", "Fifth Judgment (Consistent with history)...", "ACTION", "yellow")
    
    product5 = Product.objects.create(
        owner=owner,
        name="Product 5",
        slug="product-5-cons",
        price_per_day=100.00,
        category=category,  # Same category
        size='M',
        color='Black'
    )
    
    booking5 = Booking.objects.create(
        user=tenant1,
        product=product5,
        start_date=timezone.now(),
        end_date=timezone.now(),
        total_days=1,
        total_price=100.00,
        status='completed'
    )
    
    dispute5 = Dispute.objects.create(
        user=tenant1,
        booking=booking5,
        title="Damage claim 5",
        description="Product was damaged",
        status='admissible'
    )
    
    judgment5 = Judgment.objects.create(
        dispute=dispute5,
        judge=judge,
        verdict='favor_owner',  # Same verdict as precedents
        ruling_text="Owner wins again",
        status='final',
        awarded_amount=55.00,  # Similar amount
        finalized_at=timezone.now()
    )
    
    report5 = ConsistencyService.evaluate_judgment(judgment5)
    
    if report5['consistency_score'] and report5['consistency_score'] >= 0.70:
        log("TEST 2", f"HIGH CONSISTENCY: {report5['consistency_score']:.0%} - {report5['recommendation']}", "SUCCESS", "green")
        log("TEST 2", f"  Precedents found: {report5['precedents_found']}", "INFO", "cyan")
    else:
        log("TEST 2", f"Unexpected score: {report5}", "FAIL", "red")
    
    # Check precedent linking
    precedents_linked = JudgmentPrecedent.objects.filter(judgment=judgment5).count()
    if precedents_linked > 0:
        log("TEST 2", f"Precedents linked: {precedents_linked} cases", "SUCCESS", "green")
    else:
        log("TEST 2", "No precedents linked!", "FAIL", "red")
    
    #==========================================================================
    # SCENARIO 3: Divergent Judgment (Different verdict)
    #==========================================================================
    log("TEST 3", "Divergent Judgment (favor_tenant instead of favor_owner)...", "ACTION", "yellow")
    
    product6 = Product.objects.create(
        owner=owner,
        name="Product 6",
        slug="product-6-cons",
        price_per_day=100.00,
        category=category,  # Same category
        size='M',
        color='Black'
    )
    
    booking6 = Booking.objects.create(
        user=tenant2,
        product=product6,
        start_date=timezone.now(),
        end_date=timezone.now(),
        total_days=1,
        total_price=100.00,
        status='completed'
    )
    
    dispute6 = Dispute.objects.create(
        user=tenant2,
        booking=booking6,
        title="Damage claim 6",
        description="Product was damaged BUT owner lied",
        status='admissible'
    )
    
    judgment6 = Judgment.objects.create(
        dispute=dispute6,
        judge=judge,
        verdict='favor_tenant',  # DIFFERENT from precedents!
        ruling_text="Tenant wins - special circumstances",
        status='final',
        awarded_amount=50.00,
        finalized_at=timezone.now()
    )
    
    report6 = ConsistencyService.evaluate_judgment(judgment6)
    
    if report6['consistency_score'] and report6['consistency_score'] < 0.70:
        log("TEST 3", f"DIVERGENCE DETECTED: {report6['consistency_score']:.0%} - {report6['recommendation']}", "SUCCESS", "green")
        log("TEST 3", f"  Divergence flags: {len(report6['divergence_flags'])}", "INFO", "cyan")
        
        for flag in report6['divergence_flags']:
            log("TEST 3", f"    → {flag['reason']}", "INFO", "cyan")
    else:
        log("TEST 3", f"Should be divergent! Score: {report6.get('consistency_score')}", "FAIL", "red")
    
    log("FINISH", "Institutional Memory is Active.", "INFO")

if __name__ == "__main__":
    run_test()
