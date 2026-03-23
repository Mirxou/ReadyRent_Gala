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
from apps.products.models import Product
from apps.disputes.models import EvidenceLog, Dispute

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
    log("SETUP", "Initializing Vault Integration Test...", "WAIT", "yellow")
    
    # Cleanup
    EvidenceLog.objects.all().delete()
    Booking.objects.filter(total_price=123.45).delete() 
    Product.objects.filter(name="Vault Test Asset").delete() # Cleanup product to avoid slug collision

    # Actors
    renter, _ = User.objects.get_or_create(username='vault_renter', email='renter@vault.com')
    owner, _ = User.objects.get_or_create(username='vault_owner', email='owner@vault.com')
    
    # Product
    # categories might be empty in test env, ensure one exists
    from apps.products.models import Category
    category, _ = Category.objects.get_or_create(name="VaultCat", slug="vault-cat", defaults={"name_ar": "V"})

    product, created = Product.objects.get_or_create(
        owner=owner,
        name="Vault Test Asset",
        defaults={
            'price_per_day': 100.00, 
            'category': category,
            'slug': 'vault-test-asset-unique-v1', # Ensure unique
            'size': 'M',
            'color': 'Blue'
        }
    )
    if created:
        print(f"DEBUG: Created product {product.id} with slug {product.slug}")
    else:
         print(f"DEBUG: Found existing product {product.id} with slug {product.slug}")


    # 1. Trigger: Booking Creation
    log("STEP 1", "Creating Booking (Should Trigger Log)...", "ACTION", "yellow")
    booking = Booking.objects.create(
        user=renter, # Corrected field name from 'renter' to 'user'
        product=product,
        start_date=timezone.now(),
        end_date=timezone.now() + timedelta(days=1),
        total_days=1,
        total_price=123.45,
        status='pending'
    )
    
    # Check Vault
    log_entry = EvidenceLog.objects.filter(booking=booking, action="BOOKING_CREATED").first()
    if log_entry:
        log("STEP 1", f"Vault Log Found: {log_entry}", "SUCCESS", "green")
        print(f"      📸 Snapshot: {log_entry.context_snapshot}")
    else:
        log("STEP 1", "Vault Log MISSING for Creation!", "FAIL", "red")

    # 2. Trigger: Status Change
    log("STEP 2", "Updating Booking Status (Should Trigger Log)...", "ACTION", "yellow")
    booking.status = 'confirmed'
    booking.save()
    
    log_entry = EvidenceLog.objects.filter(booking=booking, action__contains="BOOKING_UPDATED").first()
    if log_entry and "confirmed" in log_entry.action:
        log("STEP 2", f"Vault Log Found: {log_entry}", "SUCCESS", "green")
    else:
        log("STEP 2", "Vault Log MISSING for Update!", "FAIL", "red")

    # 3. Trigger: Dispute Creation
    log("STEP 3", "Filing Dispute (Should Trigger Log)...", "ACTION", "yellow")
    dispute = Dispute.objects.create(
        user=renter,
        booking=booking,
        title="Item not as described",
        description=" It was blue, not red.",
        status='filed'
    )
    
    log_entry = EvidenceLog.objects.filter(dispute=dispute, action="DISPUTE_FILED").first()
    if log_entry:
        log("STEP 3", f"Vault Log Found: {log_entry}", "SUCCESS", "green")
    else:
        log("STEP 3", "Vault Log MISSING for Dispute!", "FAIL", "red")

    log("FINISH", "The Evidence Vault is Watching.", "INFO")

if __name__ == "__main__":
    run_test()
