import os
import django
import sys
from datetime import timedelta
from django.utils import timezone
from django.conf import settings

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, EvidenceLog, Judgment, Appeal
from apps.disputes.services import DisputeService

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
    log("SETUP", "Initializing Appeal Lifecycle Test...", "WAIT", "yellow")
    
    # Cleanup
    Appeal.objects.all().delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Actors
    judge_first = User.objects.get_or_create(username='judge_tribunal', email='tribunal@court.com')[0]
    judge_high_court = User.objects.get_or_create(username='judge_supreme', email='supreme@court.com')[0]
    tenant = User.objects.get_or_create(username='tenant_appeal', email='tenant@appeal.com')[0]
    owner = User.objects.get_or_create(username='owner_appeal', email='owner@appeal.com')[0]
    
    # Product & Booking
    category = Category.objects.get_or_create(name="AppealCat", slug="appeal-cat")[0]
    product = Product.objects.get_or_create(
        owner=owner,
        name="Appeal Test Item",
        defaults={'price_per_day': 100.00, 'category': category, 'slug': 'appeal-item-v1', 'size': 'L', 'color': 'Gray'}
    )[0]
    
    booking = Booking.objects.create(
        user=tenant,
        product=product,
        start_date=timezone.now() - timedelta(days=2),
        end_date=timezone.now() - timedelta(days=1),
        total_days=1,
        total_price=100.00,
        status='completed'
    )
    
    dispute = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Unjust Ruling",
        description="The first judgment was biased.",
        status='admissible'
    )
    
   # First Instance Judgment
    log("STEP 1", "Tribunal issues PROVISIONAL Judgment...", "ACTION", "yellow")
    judgment_provisional = Judgment.objects.create(
        dispute=dispute,
        judge=judge_first,
        verdict='favor_owner',
        ruling_text="Owner wins. Tenant must pay damages.",
        status='provisional',
        awarded_amount=50.00
    )
    log("STEP 1", f"Judgment #{judgment_provisional.id} is PROVISIONAL", "SUCCESS", "green")
    
    # Scenario 1: File Appeal
    log("STEP 2", "Tenant files Appeal...", "ACTION", "yellow")
    appeal = Appeal.objects.create(
        judgment=judgment_provisional,
        appellant=tenant,
        reason="The judgment ignored critical evidence.",
        status='pending'
    )
    
    if appeal.is_fund_frozen:
        log("STEP 2", "Funds are FROZEN during appeal (Correct)", "SUCCESS", "green")
    else:
        log("STEP 2", "Funds NOT frozen (ERROR)", "FAIL", "red")
    
    # Scenario 2: High Court UPHOLDS
    log("STEP 3A", "High Court Reviews and UPHOLDS...", "ACTION", "yellow")
    result_uphold = DisputeService.process_appeal(appeal, "UPHOLD", judge_high_court, "No new evidence found.")
    
    judgment_provisional.refresh_from_db()
    appeal.refresh_from_db()
    
    if judgment_provisional.status == 'final' and appeal.status == 'rejected' and not appeal.is_fund_frozen:
        log("STEP 3A", f"Judgment FINALIZED. Appeal REJECTED. {result_uphold['message']}", "SUCCESS", "green")
    else:
        log("STEP 3A", f"State Error: J={judgment_provisional.status}, A={appeal.status}", "FAIL", "red")
    
    # Reset for Scenario 3: OVERTURN
    log("STEP 3B", "Testing OVERTURN (New Judgment)...", "ACTION", "yellow")
    
    judgment_2 = Judgment.objects.create(
        dispute=dispute,
        judge=judge_first,
        verdict='favor_owner',
        ruling_text="Another provisional verdict.",
        status='provisional',
        awarded_amount=75.00
    )
    
    appeal_2 = Appeal.objects.create(
        judgment=judgment_2,
        appellant=tenant,
        reason="This is also wrong!",
        status='pending'
    )
    
    result_overturn = DisputeService.process_appeal(appeal_2, "OVERTURN", judge_high_court, "Judgment was clearly flawed.")
    
    judgment_2.refresh_from_db()
    appeal_2.refresh_from_db()
    
    if judgment_2.status == 'overturned' and appeal_2.status == 'granted':
        log("STEP 3B", f"Judgment OVERTURNED. {result_overturn['message']}", "SUCCESS", "green")
    else:
        log("STEP 3B", "Overturn Failed", "FAIL", "red")
    
    log("FINISH", "The High Court is operational.", "INFO")

if __name__ == "__main__":
    run_test()
