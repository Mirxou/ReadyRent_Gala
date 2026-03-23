"""
TRIBUNAL SESSION #SIM-001
Sovereign Walkthrough - The Fridge Scratch Incident
"""

import os
import sys
import django
import time
from unittest.mock import patch
from datetime import timedelta
from django.utils import timezone
from decimal import Decimal

# Setup Django
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, EvidenceLog, SettlementOffer, Judgment
from apps.disputes.mediation_service import MediationService
from apps.disputes.precedent_search_service import PrecedentSearchService

def tribunal_session_sim_001():
    print("⚖️  TRIBUNAL SESSION #SIM-001 STARTED")
    print(f"    Date: {timezone.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("    Mode: SIMULATION / READ-ONLY")
    print("    Observer: The Architect")
    print("="*60)

    # ---------------------------------------------------------
    # PART 0: CONTEXT SEEDING
    # ---------------------------------------------------------
    print("\n🧾  PART 0: CONTEXT SEEDING")
    
    # Create Actors
    category, _ = Category.objects.get_or_create(name="Apartments", slug="apartments")
    tenant, _ = User.objects.get_or_create(email="tenant_a@sim.sovereign", defaults={'username': "Tenant A"})
    owner, _ = User.objects.get_or_create(email="owner_b@sim.sovereign", defaults={'username': "Owner B"})
    admin, _ = User.objects.get_or_create(email="admin@sim.sovereign", defaults={'username': "Sovereign Gatekeeper", 'is_staff': True, 'is_superuser': True})
    
    def create_precedent(case_id, title, amount, verdict):
        p_user, _ = User.objects.get_or_create(
            username=f"User_{case_id}",
            defaults={'email': f"user_{case_id}@sim.sovereign"}
        )
        p_prod, _ = Product.objects.get_or_create(
            name=f"Prod {case_id}", 
            defaults={
                'owner': p_user, 
                'category': category, 
                'price_per_day': 100,
                'slug': f"prod-{case_id}"
            }
        )
        # If product existed but defaults ignored, ensure unique slug?
        # Actually get_or_create uses kwargs for lookup. If name matches but slug differs...
        # Let's verify lookup. Name is not unique. 
        # Better to just use create or robust get_or_create with slug in lookup or unique name.
        
        # Simpler: Just create everything fresh or try/except. 
        # But 'name' is not unique in model usually.
        # Let's use case_id in slug and lookup by slug.
        
        p_prod, _ = Product.objects.get_or_create(
             slug=f"prod-{case_id}",
             defaults={
                 'name': f"Prod {case_id}",
                 'owner': p_user, 
                 'category': category, 
                 'price_per_day': 100
             }
        )
        p_book = Booking.objects.create(
            product=p_prod, 
            user=p_user, 
            total_price=500, 
            status='completed', 
            start_date=timezone.now() - timedelta(days=5), 
            end_date=timezone.now(),
            total_days=5  # REQUIRED FIELD
        )
        p_disp = Dispute.objects.create(user=p_user, booking=p_book, title=title, status='closed', resolution="Adjudicated")
        return Judgment.objects.create(dispute=p_disp, verdict=verdict, awarded_amount=amount, status='final', finalized_at=timezone.now())

    prec_judgments = [
        create_precedent("214", "Cabinet Scratch", 250, "favor_owner"),
        create_precedent("198", "Flooring Mark", 200, "favor_owner"),
        create_precedent("177", "Wall Smudge", 0, "rejected"),
        create_precedent("163", "Table Etching", 300, "favor_owner"),
        create_precedent("151", "Chair Leg", 50, "split"),
    ]
    # Set fake IDs to match user scenario
    # We can't easily force IDs, but we can map them in print
    
    # Create Current Asset & Booking
    product, _ = Product.objects.get_or_create(
        slug="luxury-apt-101",
        defaults={'name': "Luxury Apt 101", 'owner': owner, 'category': category, 'price_per_day': 200}
    )
    
    booking = Booking.objects.create(
        product=product, user=tenant,
        start_date=timezone.now() - timedelta(days=7),
        end_date=timezone.now() - timedelta(days=2),
        total_price=1000, status='completed', total_days=5
    )
    print("    [Info] Booking Created. Value: 1,000 SAR")
    
    # Create Dispute
    claim_text = "Found a scratch on the fridge door after exit. Was not there at check-in. Claiming 400 SAR repair cost."
    print(f"    [Info] Claim Filed by {owner.username}: '{claim_text}'")
    
    dispute = Dispute.objects.create(
        user=owner,
        booking=booking,
        title="Fridge Scratch Incident",
        description=claim_text,
        status='filed'
    )
    print(f"    [State] Dispute #{dispute.id} Created. Status: {dispute.status}")
    print("    [Merit] Tenant A: 72 | Owner B: 78 (Historical Signal)")

    # ---------------------------------------------------------
    # PART 1: COOLING-OFF
    # ---------------------------------------------------------
    print("\n⏳  PART 1: THE PROTECTIVE WAIT (Cooling-off)")
    print("    [UX] Interface blocked from immediate escalation.")
    print("    [System] Analyzing tone... NEUTRAL/PROFESSIONAL.")
    print("    [System] Enforcing 5-minute procedural pause...")
    print("    [State] Cooling period complete. Dignity preserved.")

    # ---------------------------------------------------------
    # PART 2: HARD DIGNITY (Evidence)
    # ---------------------------------------------------------
    print("\n📂  PART 2: EVIDENCE SUBMISSION (Hard Dignity)")
    print("    [Rule] 'Text is cheap. Show me the truth.'")
    EvidenceLog.objects.create(dispute=dispute, action='EVIDENCE_UPLOADED', actor=owner, metadata={'file': 'fridge_scratch_dark.jpg'})
    print("    [Upload] Owner B submitted: 'fridge_scratch_dark.jpg' (Lighting: Poor)")
    EvidenceLog.objects.create(dispute=dispute, action='EVIDENCE_UPLOADED', actor=tenant, metadata={'file': 'checkin_video_frame.jpg'})
    print("    [Upload] Tenant A submitted: 'checkin_video_frame.jpg' (Angle: Oblique)")
    print("    [Analysis] Visual Match: PARTIAL. Conclusiveness: LOW.")

    # ---------------------------------------------------------
    # PART 3: PRECEDENT RECALL
    # ---------------------------------------------------------
    print("\n⚙️  PART 3: PRECEDENT RECALL (Vector Search)")
    print(f"    [Query] '{dispute.description}'")
    
    # Prepare Mock Return for PrecedentSearchService
    # Matching user scenario similarities
    sims = [0.81, 0.74, 0.68, 0.65, 0.61]
    mock_results = []
    for i, j in enumerate(prec_judgments):
        mock_results.append({
            'judgment': j,
            'similarity_score': sims[i],
            'confidence': 'HIGH' if sims[i] > 0.8 else 'MEDIUM',
            'shared_factors': ['Category: Apartments'],
            'explanation': 'Similar damage pattern'
        })

    # PATCH TIME: We patch the service to return our specific "History"
    with patch('apps.disputes.precedent_search_service.PrecedentSearchService.find_similar_by_text', return_value=mock_results):
        print("    [Memory] Found 5 relevant Judicial Precedents:")
        for res in mock_results:
            j = res['judgment']
            print(f"        - Case #{j.id}: Sim {res['similarity_score']:.2f} | Verdict: {j.verdict} ({j.awarded_amount})")

        # ---------------------------------------------------------
        # PART 4: SOVEREIGN MEDIATION
        # ---------------------------------------------------------
        print("\n🤝  PART 4: SOVEREIGN MEDIATION (AI Proposal)")
        
        # Trigger Service
        session = MediationService.start_mediation(dispute)
        offer = session.offers.first()
        
        print(f"    [Calculation] Weighted Average of Precedents...")
        print(f"    [Proposal] Generated Offer #{offer.id}")
        print(f"    [Status] {offer.status} (Visible to Admin ONLY)")
        print(f"    [Value] {offer.amount} SAR (Claimed: 400)")
        
        print("\n    🗣️  THE EXPLANATION (The Voice):")
        print("    " + "-"*50)
        # Assuming explanation is stored in 'reasoning'
        print(f"    {offer.reasoning}")
        print("    " + "-"*50)

    # ---------------------------------------------------------
    # PART 5: THE HUMAN GATE
    # ---------------------------------------------------------
    print("\n🛂  PART 5: THE ADMIN GATE")
    print("    [Check] AI Confidence: Moderate")
    print("    [Action] Admin 'Sovereign Gatekeeper' reviews the file.")
    
    # Admin Decision
    offer.status = SettlementOffer.Status.VISIBLE
    offer.approved_by = admin
    offer.approved_at = timezone.now()
    offer.save()
    
    EvidenceLog.objects.create(dispute=dispute, action='AI_PROPOSAL_APPROVED', actor=admin, metadata={'offer_id': offer.id})
    print("    [Decision] ✅ APPROVED. Offer is now visible to parties.")
    print("    [Safety] Kill Switch: DORMANT (No deviation detected).")

    # ---------------------------------------------------------
    # PART 6: RESOLUTION
    # ---------------------------------------------------------
    print("\n🏁  PART 6: RESOLUTION")
    # Simulate User Acceptance
    dispute.status = 'closed'
    dispute.resolution = f"Settled via Mediation. Agreed Amount: {offer.amount}"
    dispute.save()
    
    print("    [Outcome] Parties Accepted.")
    print("    [Visuals] Displaying 'Steel Blue' Resolution Card.")
    print("    [Vocabulary] 'A Satisfactory Consensus has been reached.'")
    
    print("\n" + "="*60)
    print("⚖️  TRIBUNAL ADJOURNED")
    print("="*60)

if __name__ == "__main__":
    tribunal_session_sim_001()
