
import os
import sys
import django
# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.products.models import Product, Category
from apps.users.models import UserProfile

User = get_user_model()

def log(message, color="white"):
    colors = {"green": "\033[92m", "white": "\033[0m", "yellow": "\033[93m"}
    print(f"{colors.get(color, colors['white'])}[CANARY PREP] {message}{colors['white']}")

def prepare_canary_data():
    log("Seeding Canary Data for Real-Money Verification...", "yellow")
    
    # 1. The Canary Host
    host_email = "canary_host@standard.rent"
    host, created = User.objects.update_or_create(
        email=host_email,
        defaults={
            'username': 'canary_host',
            'role': 'customer',
            'is_verified': True
        }
    )
    if created:
        host.set_password("canary_pass_2026")
        host.save()
        log(f"Created Host: {host_email} (Pass: canary_pass_2026)", "green")
    else:
        log(f"Host Exists: {host_email}", "white")

    # 2. The Canary Asset (Low Value for Testing)
    cat, _ = Category.objects.get_or_create(slug="electronics", defaults={'name': 'Electronics'})
    
    asset, created = Product.objects.update_or_create(
        slug="canary-test-lens",
        owner=host,
        defaults={
            'name': 'Canary Test Lens (DO NOT BOOK)',
            'description': 'Asset for real-money transaction verification. 10 DA/Day.',
            'category': cat,
            'price_per_day': 100, # 100 DA is a reasonable test amount
            'status': 'available' 
        }
    )
    if created:
        log(f"Created Asset: {asset.name} (100 DA)", "green")
    else:
        log(f"Asset Exists: {asset.name}", "white")

    # 3. The Canary Testers (3 Users)
    testers = [
        ("canary_one", "canary1@standard.rent"),
        ("canary_two", "canary2@standard.rent"),
        ("canary_three", "canary3@standard.rent"),
    ]
    
    for username, email in testers:
        user, created = User.objects.update_or_create(
            email=email,
            defaults={
                'username': username,
                'role': 'customer',
                'is_verified': True # Skip ID verification for testers to focus on payment
            }
        )
        if created:
            user.set_password("canary_pass_2026")
            user.save()
            log(f"Created Tester: {email} (Pass: canary_pass_2026)", "green")
        else:
            log(f"Tester Exists: {email}", "white")

    log("--------------------------------------------------", "white")
    log("CANARY DATA READY.", "green")
    log("Please proceed with manual Real-Money transactions using these accounts.", "yellow")

if __name__ == "__main__":
    prepare_canary_data()
