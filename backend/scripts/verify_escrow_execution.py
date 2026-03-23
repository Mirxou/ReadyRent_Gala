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
from apps.disputes.models import Dispute, Judgment, EvidenceLog
from apps.disputes.escrow_service import EscrowService

def log(test_name, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m",
        "red": "\033[91m",
        "yellow": "\033[93m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}[{test_name}] {message} {status}{colors['reset']}")

def run_test():
    print("--------------------------------------------------")
    log("SETUP", "Initializing Escrow Execution Test...", "WAIT", "yellow")
    
    # Cleanup
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Actors
    judge = User.objects.get_or_create(username='judge_exec', email='exec@court.com')[0]
    tenant = User.objects.get_or_create(username='tenant_exec', email='tenant@exec.com')[0]
    owner = User.objects.get_or_create(username='owner_exec', email='owner@exec.com')[0]
    
    # Product & Booking
    category = Category.objects.get_or_create(name="ExecCat", slug="exec-cat")[0]
    product = Product.objects.get_or_create(
        owner=owner,
        name="Exec Test Item",
        defaults={'price_per_day': 200.00, 'category': category, 'slug': 'exec-item-v1', 'size': 'XL', 'color': 'Gold'}
    )[0]
    
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
        title="Execution Test",
        description="Testing financial distribution.",
        status='admissible'
    )
    
    # Test 1: Cannot execute PROVISIONAL judgment
    log("TEST 1", "Attempting execution on PROVISIONAL judgment...", "ACTION", "yellow")
    
    judgment_prov = Judgment.objects.create(
        dispute=dispute,
        judge=judge,
        verdict='favor_tenant',
        ruling_text="Tenant wins, but provisional.",
        status='provisional',
        awarded_amount=100.00
    )
    
    result_1 = EscrowService.execute_judgment(judgment_prov)
    
    if not result_1['success'] and 'non-final' in result_1['error']:
        log("TEST 1", "Correctly rejected provisional judgment", "SUCCESS", "green")
    else:
        log("TEST 1", "ERROR: Executed provisional judgment!", "FAIL", "red")
    
    # Test 2: Execute FINAL judgment (favor_tenant)
    log("TEST 2", "Executing FINAL judgment (favor_tenant)...", "ACTION", "yellow")
    
    judgment_prov.status = 'final'
    judgment_prov.finalized_at = timezone.now()
    judgment_prov.save()
    
    result_2 = EscrowService.execute_judgment(judgment_prov)
    
    if result_2['success'] and result_2['transaction']['type'] == 'REFUND':
        log("TEST 2", f"Funds refunded to {result_2['transaction']['recipient']}", "SUCCESS", "green")
    else:
        log("TEST 2", "Execution failed", "FAIL", "red")
    
    # Test 3: Idempotency (execute same judgment again)
    log("TEST 3", "Testing Idempotency (re-execute same judgment)...", "ACTION", "yellow")
    
    result_3 = EscrowService.execute_judgment(judgment_prov)
    
    if result_3['success'] and result_3.get('already_executed'):
        log("TEST 3", "Idempotency check PASSED (no double execution)", "SUCCESS", "green")
    else:
        log("TEST 3", "Idempotency FAILED (double execution risk!)", "FAIL", "red")
    
    # Test 4: Verify EvidenceLog
    log("TEST 4", "Verifying Evidence Trail...", "ACTION", "yellow")
    
    execution_log = EvidenceLog.objects.filter(
        action__startswith="ESCROW_EXECUTED",
        metadata__judgment_id=judgment_prov.id
    ).first()
    
    if execution_log:
        log("TEST 4", f"Evidence logged: {execution_log.action}", "SUCCESS", "green")
    else:
        log("TEST 4", "No evidence log found!", "FAIL", "red")
    
    log("FINISH", "The Treasury is Sovereign.", "INFO")

if __name__ == "__main__":
    run_test()
