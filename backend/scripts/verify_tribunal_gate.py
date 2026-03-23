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
from apps.disputes.models import Dispute, EvidenceLog
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
    log("SETUP", "Initializing Tribunal Gate Test...", "WAIT", "yellow")
    
    # Cleanup
    Dispute.objects.all().delete()
    EvidenceLog.objects.all().delete()
    Booking.objects.filter(total_price=555.55).delete()
    Product.objects.filter(name="Tribunal Asset").delete()
    
    # Actors
    plaintiff, _ = User.objects.get_or_create(username='plaintiff', email='plaintiff@court.com')
    defendant, _ = User.objects.get_or_create(username='defendant', email='defendant@court.com')
    
    # Product
    category, _ = Category.objects.get_or_create(name="TribunalCat", slug="tribunal-cat", defaults={"name_ar": "T"})
    product, _ = Product.objects.get_or_create(
        owner=defendant,
        name="Tribunal Asset",
        defaults={
            'price_per_day': 100.00, 
            'category': category,
            'slug': 'tribunal-asset-unique-v1',
            'size': 'L',
            'color': 'Black'
        }
    )

    # Scenario 1: Valid Dispute (Within Time + Has Evidence)
    log("CASE 1", "Testing VALID Dispute...", "ACTION", "yellow")
    
    # Create Booking
    booking_valid = Booking.objects.create(
        user=plaintiff,
        product=product,
        start_date=timezone.now() - timedelta(days=2),
        end_date=timezone.now() - timedelta(days=1), # Ended yesterday
        total_days=1,
        total_price=555.55,
        status='completed'
    )
    
    # Create Evidence (Simulate system log)
    EvidenceLog.objects.create(
        action="BOOKING_COMPLETED",
        actor=plaintiff,
        booking=booking_valid,
        context_snapshot={"status": "completed"}
    )
    
    # File Dispute
    dispute_valid = Dispute.objects.create(
        user=plaintiff,
        booking=booking_valid,
        title="Valid Claim",
        description="Item broken.",
        status='filed'
    )
    
    # Run Gate
    is_admissible = DisputeService.evaluate_admissibility(dispute_valid)
    
    if is_admissible and dispute_valid.status == 'admissible':
        log("CASE 1", "Dispute Accepted (Correct).", "SUCCESS", "green")
    else:
        log("CASE 1", f"Dispute Rejected (Error): {dispute_valid.inadmissible_reason}", "FAIL", "red")


    # Scenario 2: Invalid Dispute (Too Late)
    log("CASE 2", "Testing INVALID Dispute (Statute of Limitations)...", "ACTION", "yellow")
    
    booking_expired = Booking.objects.create(
        user=plaintiff,
        product=product,
        start_date=timezone.now() - timedelta(days=20),
        end_date=timezone.now() - timedelta(days=19), # Ended 19 days ago (Limit is 7)
        total_days=1,
        total_price=555.55,
        status='completed'
    )
    
    # Create Evidence to pass that check
    EvidenceLog.objects.create(
        action="BOOKING_COMPLETED",
        actor=plaintiff,
        booking=booking_expired,
        context_snapshot={"status": "completed"}
    )
    
    dispute_expired = Dispute.objects.create(
        user=plaintiff,
        booking=booking_expired,
        title="Late Claim",
        description="I just remembered it was broken.",
        status='filed'
    )
    
    is_admissible_2 = DisputeService.evaluate_admissibility(dispute_expired)
    
    if not is_admissible_2 and dispute_expired.status == 'inadmissible':
        log("CASE 2", f"Dispute Rejected (Correct): {dispute_expired.inadmissible_reason}", "SUCCESS", "green")
    else:
        log("CASE 2", "Dispute Accepted (Error - Should be Time Barred).", "FAIL", "red")

    log("FINISH", "The Tribunal Gate is Active.", "INFO")

if __name__ == "__main__":
    run_test()
