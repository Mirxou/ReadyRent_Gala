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
from apps.disputes.models import Dispute, EvidenceLog, Judgment

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
    log("SETUP", "Initializing Verdict Finality Test...", "WAIT", "yellow")
    
    # Cleanup
    Dispute.objects.all().delete()
    Judgment.objects.all().delete()
    
    # Actors
    judge, _ = User.objects.get_or_create(username='judge_dredd', email='judge@court.com')
    plaintiff, _ = User.objects.get_or_create(username='plaintiff_v', email='plaintiff_v@court.com')
    
    # Mock Dispute (simplifying prerequisites)
    # Ideally navigate Booking -> Dispute, but for Judgment unit test, we just need a Dispute object
    # We need a booking for the dispute foreign key
    
    # Product & Booking Setup
    category, _ = Category.objects.get_or_create(name="VerdictCat", slug="verdict-cat")
    product, _ = Product.objects.get_or_create(
        owner=judge, # Judge owns the product? Conflict of interest! But fine for tech test.
        name="Verdict Asset",
        defaults={
            'price_per_day': 100.00, 
            'category': category,
            'slug': 'verdict-asset-unique-v1',
            'size': 'M',
            'color': 'Red'
        }
    )
    
    booking = Booking.objects.create(
        user=plaintiff,
        product=product,
        start_date=timezone.now(),
        end_date=timezone.now(),
        total_days=1,
        total_price=100.00,
        status='completed'
    )
    
    dispute = Dispute.objects.create(
        user=plaintiff,
        booking=booking,
        title="Finality Test Case",
        description="Testing the gavel.",
        status='admissible'
    )

    # 1. Provisional Judgment
    log("STEP 1", "Drafting PROVISIONAL Judgment...", "ACTION", "yellow")
    
    judgment = Judgment.objects.create(
        dispute=dispute,
        judge=judge,
        verdict='favor_tenant',
        ruling_text="Tenant is right, but appeal window is open.",
        status='provisional',
        awarded_amount=50.00
    )
    
    if judgment.status == 'provisional' and judgment.finalized_at is None:
        log("STEP 1", "Judgment is Provisional.", "SUCCESS", "green")
    else:
        log("STEP 1", "Judgment State Error!", "FAIL", "red")


    # 2. Finalization (The Gavel Drops)
    log("STEP 2", "Finalizing Judgment (The Gavel Drops)...", "ACTION", "yellow")
    
    # Simulate action
    judgment.status = 'final'
    judgment.finalized_at = timezone.now()
    judgment.save()
    
    # Verify Persistence
    refetched = Judgment.objects.get(id=judgment.id)
    
    if refetched.status == 'final' and refetched.finalized_at:
        log("STEP 2", f"Judgment Finalized at {refetched.finalized_at}", "SUCCESS", "green")
    else:
        log("STEP 2", "Failed to Finalize!", "FAIL", "red")

    log("FINISH", "Justice has been served.", "INFO")

if __name__ == "__main__":
    run_test()
