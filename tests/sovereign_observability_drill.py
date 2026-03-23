
import os
import django
import sys
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

# Setup Django environment
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Dispute, Judgment, JudgmentEmbedding
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.users.models import User
from apps.disputes.services import DisputeService
from apps.disputes.mediation_service import MediationService
from apps.disputes.precedent_search_service import PrecedentSearchService

def run_drill():
    print("🧪 STARTING GATE 1 OBSERVABILITY DRILL...\n")
    
    # 1. CLEANUP & SETUP
    print("cleaning up old drill data...")
    Judgment.objects.filter(ruling_text__startswith="[DRILL]").delete()
    Dispute.objects.filter(title__startswith="[DRILL]").delete()
    
    # Ensure users exist
    admin, _ = User.objects.get_or_create(email="admin@drill.com", defaults={'username': 'drill_admin'})
    user1, _ = User.objects.get_or_create(email="tenant@drill.com", defaults={'username': 'drill_tenant'})
    owner1, _ = User.objects.get_or_create(email="owner@drill.com", defaults={'username': 'drill_owner'})
    
    # Create Category & Product
    cat, _ = Category.objects.get_or_create(
        name="Luxury Wear", 
        defaults={
            'slug': 'drill-luxury-wear', 
            'name_ar': 'ملابس فاخرة'
        }
    )
    prod, _ = Product.objects.get_or_create(
        name="Silk Gown", 
        defaults={
            'owner': owner1,
            'category': cat, 
            'price_per_day': 100,
            'slug': 'drill-silk-gown',
            'name_ar': 'ثوب حريري',
            'description': 'A beautiful silk gown.',
            'size': 'M',
            'color': 'Red'
        }
    )
    
    # Create Booking
    booking = Booking.objects.create(
        product=prod, user=user1, start_date=timezone.now(), end_date=timezone.now()+timedelta(days=3),
        total_days=3, total_price=300, status='completed'
    )

    print("✅ Environment Ready.\n")

    # 2. SEED INSTITUTIONAL MEMORY (Past Judgments)
    print("🌱 Seeding Institutional Memory (Mock Precedents)...")
    
    precedents_data = [
        {
            "title": "[DRILL] Wine Stain on Silk",
            "desc": "Tenant returned silk text with red wine stain. Professional cleaning failed.",
            "verdict": "favor_owner",
            "amount": 300, # Full value
            "ruling": "[DRILL] Irreversible damage to delicate fabric. Tenant liable."
        },
        {
            "title": "[DRILL] Minor Hem tear",
            "desc": "Small tear at the bottom of the dress.",
            "verdict": "split",
            "amount": 50, # Minor repair
            "ruling": "[DRILL] Wear and tear vs negligence is unclear. Split cost."
        },
        {
            "title": "[DRILL] Late Return - 1 Hour",
            "desc": "Tenant returned item 1 hour late due to traffic.",
            "verdict": "favor_tenant", # Dismissed
            "amount": 0,
            "ruling": "[DRILL] De minimis delay. No financial loss proven."
        },
        {
            "title": "[DRILL] Destroyed by Fire",
            "desc": "Item completely burned due to candle accident.",
            "verdict": "favor_owner",
            "amount": 300,
            "ruling": "[DRILL] Total loss. Negligence admitted."
        }
    ]

    for p in precedents_data:
        d = Dispute.objects.create(
            user=user1, booking=booking, title=p['title'], description=p['desc'], status='closed'
        )
        j = Judgment.objects.create(
            dispute=d, judge=admin, verdict=p['verdict'], awarded_amount=p['amount'],
            ruling_text=p['ruling'], status='final', finalized_at=timezone.now()
        )
        # Force Embed (Signal might simulate or we call directly)
        PrecedentSearchService.embed_judgment(j)
        print(f"  + Created Precedent: {p['title']} ({p['verdict']})")

    print(f"✅ Seeding Complete. {Judgment.objects.count()} judgments in DB.\n")

    # 3. RUN TEST CASES (New Disputes)
    print("🔬 RUNNING OBSERVABILITY TESTS (New Disputes)...")
    
    test_cases = [
        {
            "title": "[DRILL] Red liquid stain on dress",
            "desc": "I spilt some juice on the silk dress. It won't come out.",
            "expected_match": "Wine Stain",
            "expected_logic": "High Owner Favor"
        },
        {
            "title": "[DRILL] Returned 15 mins late",
            "desc": "Stuck in traffic, sorry.",
            "expected_match": "Late Return",
            "expected_logic": "Tenant Favor (Low/Zero)"
        },
        {
            "title": "[DRILL] Alien Abduction", 
            "desc": "Aliens stole the dress. I have no proof.",
            "expected_match": "None/Weak",
            "expected_logic": "Uncertain / Fallback"
        }
    ]

    print(f"{'TEST CASE':<40} | {'SQL BASELINE (50%)':<20} | {'VECTOR PROPOSAL':<20} | {'DELTA':<10} | {'CONFIDENCE'}")
    print("-" * 110)

    for case in test_cases:
        # Create fresh dispute
        d_new = Dispute.objects.create(
            user=user1, booking=booking, title=case['title'], description=case['desc'], status='filed'
        )
        session = MediationService.start_mediation(d_new)
        offer = session.offers.first()
        
        # Calculate Metrics
        vector_amount = offer.amount
        sql_fallback = Decimal(str(booking.total_price)) / 2 # The "dumb" logic
        delta = abs(vector_amount - sql_fallback)
        
        # Extract Confidence from logic (inferring from logs/output structure would be better, but amount gives clue)
        # If amount is exactly 150 (50%), it likely hit fallback or split precedent.
        
        print(f"{case['title']:<40} | {sql_fallback:<20} | {vector_amount:<20} | {delta:<10} | {offer.reasoning[:30]}...")

    print("\n✅ Drill Complete.")

if __name__ == "__main__":
    run_drill()
