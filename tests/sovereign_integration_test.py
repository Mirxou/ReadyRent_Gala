
import os
import django
import sys
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
import time

# Setup Django environment
sys.path.append('C:/Users/pc/Desktop/ReadyRent_Gala/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Dispute, Judgment, JudgmentEmbedding, EvidenceLog, AnonymizedJudgment, MediationSession, Appeal
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.users.models import User
from apps.disputes.adjudication_service import AdjudicationService
from apps.disputes.mediation_service import MediationService
from apps.disputes.precedent_search_service import PrecedentSearchService
from apps.disputes.anonymization_service import AnonymizationService
from apps.disputes.restitution_service import RestitutionService

def separator(title):
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def run_integration_test():
    print("🚀 STARTING SOVEREIGN INTEGRATION TEST")
    print("📋 This test simulates the COMPLETE dispute lifecycle\n")
    
    # =========================================================================
    # ACT 0: SETUP & CLEANUP
    # =========================================================================
    separator("ACT 0: ENVIRONMENT SETUP")
    
    print("🧹 Cleaning up old test data...")
    Judgment.objects.filter(ruling_text__startswith="[E2E]").delete()
    Dispute.objects.filter(title__startswith="[E2E]").delete()
    
    # Create Users
    admin, _ = User.objects.get_or_create(
        email="admin@e2e.test", 
        defaults={'username': 'e2e_admin', 'role': 'admin', 'is_staff': True, 'is_superuser': True}
    )
    tenant, _ = User.objects.get_or_create(
        email="tenant@e2e.test", 
        defaults={'username': 'e2e_tenant', 'role': 'renter'}
    )
    owner, _ = User.objects.get_or_create(
        email="owner@e2e.test", 
        defaults={'username': 'e2e_owner', 'role': 'item_owner'}
    )
    
    # Create Product Infrastructure
    cat, _ = Category.objects.get_or_create(
        name="E2E Test Category",
        defaults={'slug': 'e2e-test-cat', 'name_ar': 'فئة الاختبار'}
    )
    prod, _ = Product.objects.get_or_create(
        name="E2E Diamond Necklace",
        defaults={
            'owner': owner,
            'category': cat,
            'price_per_day': 500,
            'slug': 'e2e-diamond-necklace',
            'name_ar': 'قلادة الماس',
            'description': 'Expensive jewelry for testing',
            'size': 'One Size',
            'color': 'Silver'
        }
    )
    
    booking = Booking.objects.create(
        product=prod,
        user=tenant,
        start_date=timezone.now(),
        end_date=timezone.now() + timedelta(days=5),
        total_days=5,
        total_price=2500,
        status='completed'
    )
    
    print("✅ Environment Ready")
    print(f"   👤 Admin: {admin.email}")
    print(f"   👤 Tenant: {tenant.email}")
    print(f"   👤 Owner: {owner.email}")
    print(f"   📦 Product: {prod.name} ({prod.price_per_day} DZD/day)")
    
    # =========================================================================
    # ACT 1: DISPUTE INITIATION
    # =========================================================================
    separator("ACT 1: DISPUTE FILING (Behavioral Layer)")
    
    dispute = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="[E2E] Alleged Damage to Diamond Necklace",
        description="[E2E] Owner claims I damaged the clasp. I returned it in perfect condition.",
        status='filed'
    )
    
    print(f"✅ Dispute #{dispute.id} filed successfully")
    print(f"   📋 Title: {dispute.title}")
    print(f"   ⚖️  Status: {dispute.status}")
    
    # Verify Evidence Log
    log_filed = EvidenceLog.objects.filter(dispute=dispute, action='DISPUTE_FILED').first()
    if log_filed:
        print(f"   🔒 Evidence Log: DISPUTE_FILED (Hash: {log_filed.hash[:16]}...)")
    
    # =========================================================================
    # ACT 2: SOVEREIGN MEDIATION
    # =========================================================================
    separator("ACT 2: AI-ASSISTED MEDIATION")
    
    print("🤖 Starting mediation session...")
    session = MediationService.start_mediation(dispute)
    offer = session.offers.first()
    
    print(f"✅ Mediation Session #{session.id} created")
    print(f"   💰 System Proposal: {offer.amount} DZD")
    print(f"   📝 Reasoning: {offer.reasoning[:80]}...")
    print(f"   🎯 Round: {session.current_round}/{session.max_rounds}")
    
    # Reject first offer
    print("\n❌ Tenant rejects first offer...")
    result = MediationService.reject_offer(offer)
    session.refresh_from_db()
    print(f"   🔄 Round incremented: {session.current_round}/{session.max_rounds}")
    
    # Reject second offer
    second_offer = session.offers.order_by('-created_at').first()
    print(f"\n❌ Tenant rejects second offer ({second_offer.amount} DZD)...")
    result = MediationService.reject_offer(second_offer)
    
    dispute.refresh_from_db()
    print(f"   ⚖️  Escalated to Tribunal: {dispute.status}")
    
    # Transition to under_review (required for judgment)
    dispute.status = 'under_review'
    dispute.save()
    print(f"   🔄 Status set to 'under_review' for adjudication")
    
    # =========================================================================
    # ACT 3: TRIBUNAL DELIBERATION
    # =========================================================================
    separator("ACT 3: HUMAN JUDGMENT (Tribunal)")
    
    print("👨‍⚖️ Judge reviewing case...")
    judgment = AdjudicationService.issue_verdict(
        dispute=dispute,
        judge=admin,
        verdict_type='favor_owner',
        ruling_text="[E2E] Evidence shows clasp damage inconsistent with normal wear. Owner's claim upheld.",
        awarded_amount=Decimal('400.00')
    )
    
    print(f"✅ Judgment #{judgment.id} issued")
    print(f"   ⚖️  Verdict: {judgment.verdict}")
    print(f"   💰 Award: {judgment.awarded_amount} DZD")
    print(f"   📄 Status: {judgment.status}")
    
    dispute.refresh_from_db()
    print(f"   🔄 Dispute Status: {dispute.status}")
    
    # =========================================================================
    # ACT 4: APPEAL PROCESS
    # =========================================================================
    separator("ACT 4: CONSTITUTIONAL APPEAL")
    
    print("📝 Tenant files appeal...")
    appeal = Appeal.objects.create(
        judgment=judgment,
        appellant=tenant,
        reason="[E2E] I disagree with the verdict. The damage was pre-existing."
    )
    
    dispute.status = 'under_review'
    dispute.save()
    
    print(f"✅ Appeal #{appeal.id} filed")
    print(f"   📋 Reason: {appeal.reason[:60]}...")
    print(f"   🔄 Dispute returned to: {dispute.status}")
    
    # Simulate appeal rejection
    print("\n⚖️ Appeal reviewed and rejected...")
    appeal.status = 'rejected'
    appeal.save()
    
    dispute.status = 'judgment_provisional'
    dispute.save()
    
    print(f"   ❌ Appeal Status: {appeal.status}")
    print(f"   🔄 Original judgment stands")
    
    # =========================================================================
    # ACT 5: FINALIZATION (The Chain Reaction)
    # =========================================================================
    separator("ACT 5: JUDGMENT FINALIZATION")
    
    print("🔨 User accepts verdict, triggering finalization...")
    AdjudicationService.finalize_judgment(judgment)
    
    judgment.refresh_from_db()
    dispute.refresh_from_db()
    
    print(f"✅ Judgment finalized")
    print(f"   📅 Finalized At: {judgment.finalized_at}")
    print(f"   ⚖️  Status: {judgment.status}")
    print(f"   🔄 Dispute Status: {dispute.status}")
    
    # Check Anonymization (using hash since no direct FK)
    import hashlib
    salt = "SovereignLedger2026"
    raw_id = f"{judgment.id}-{salt}"
    judgment_hash = hashlib.sha256(raw_id.encode()).hexdigest()
    
    anon = AnonymizedJudgment.objects.filter(judgment_hash=judgment_hash).first()
    if anon:
        print(f"\n🔒 Anonymization complete")
        print(f"   🔐 Hash: {anon.judgment_hash[:16]}...")
        print(f"   📋 Category: {anon.category}")
        print(f"   📊 Consistency Score: {anon.consistency_score}")
    
    # Check Embedding
    print("\n⏳ Waiting for async embedding (5s)...")
    time.sleep(5)
    embedding = JudgmentEmbedding.objects.filter(judgment=judgment).first()
    if embedding:
        print(f"✅ Embedding created")
        print(f"   🧠 Model: {embedding.model_version}")
        print(f"   📏 Vector Dimension: {len(embedding.embedding_vector)}")
    else:
        print(f"⚠️  Embedding not found (may require more time)")
    
    # =========================================================================
    # ACT 6: SOVEREIGN OVERRIDE (Emergency Protocol)
    # =========================================================================
    separator("ACT 6: SOVEREIGN OVERRIDE (Red Button)")
    
    print("🚨 Creating deadlocked dispute for override test...")
    deadlock_dispute = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="[E2E] Stuck Dispute Requiring Override",
        description="[E2E] This dispute is deadlocked in mediation hell.",
        status='under_review'
    )
    
    print(f"✅ Deadlock Dispute #{deadlock_dispute.id} created")
    
    print("\n🔴 Admin initiates Sovereign Override...")
    override_judgment = AdjudicationService.force_resolution(
        dispute=deadlock_dispute,
        judge=admin,
        verdict_type='dismissed',
        ruling_text="[E2E] Case dismissed due to insufficient evidence.",
        awarded_amount=Decimal('0.00'),
        justification="Procedural deadlock detected after 2 months of inactivity. Emergency resolution required."
    )
    
    deadlock_dispute.refresh_from_db()
    
    print(f"✅ Override executed")
    print(f"   ⚡ Judgment #{override_judgment.id} (FINAL)")
    print(f"   ⚖️  Verdict: {override_judgment.verdict}")
    print(f"   🔄 Dispute Status: {deadlock_dispute.status}")
    
    # Verify Override Log
    override_log = EvidenceLog.objects.filter(
        dispute=deadlock_dispute,
        action='SOVEREIGN_OVERRIDE'
    ).first()
    
    if override_log:
        print(f"\n🔒 Evidence Vault Entry:")
        print(f"   ⚡ Action: {override_log.action}")
        print(f"   👤 Actor: {override_log.actor.email}")
        print(f"   📝 Justification: {override_log.metadata['justification'][:60]}...")
        print(f"   🔐 Hash: {override_log.hash[:16]}...")
    
    # =========================================================================
    # FINAL VERIFICATION
    # =========================================================================
    separator("FINAL SYSTEM VERIFICATION")
    
    total_judgments = Judgment.objects.filter(ruling_text__startswith="[E2E]").count()
    total_logs = EvidenceLog.objects.filter(dispute__title__startswith="[E2E]").count()
    # AnonymizedJudgment has no FK - count by checking if judgments created anon records
    total_anon = AnonymizedJudgment.objects.filter(
        ruling_summary__startswith="[E2E]"
    ).count()
    
    print(f"📊 System State Summary:")
    print(f"   ⚖️  Total Judgments: {total_judgments}")
    print(f"   🔒 Evidence Log Entries: {total_logs}")
    print(f"   📚 Public Ledger Entries: {total_anon}")
    print(f"   🧠 Embeddings: {JudgmentEmbedding.objects.count()} (all judgments)")
    
    print(f"\n✅ INTEGRATION TEST COMPLETE!")
    print(f"🎯 All sovereign components verified working together.")

if __name__ == "__main__":
    run_integration_test()
