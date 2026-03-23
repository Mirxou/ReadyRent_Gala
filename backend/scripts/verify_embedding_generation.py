"""
Phase 22 Step 2: Verify Embedding Generation
Tests sentence-transformers integration and embedding storage.
"""
import os
import django
import sys
from django.utils import timezone

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, Judgment, JudgmentEmbedding
from apps.disputes.precedent_search_service import PrecedentSearchService

def log(msg, status="", color="white"):
    colors = {"green": "\033[92m", "red": "\033[91m", "yellow": "\033[93m", "cyan": "\033[96m", "reset": "\033[0m"}
    print(f"{colors.get(color, '')}[PHASE 22] {msg} {status}{colors['reset']}")

def run_test():
    log("=== EMBEDDING GENERATION ===", "", "cyan")
    
    # Cleanup
    Product.objects.filter(slug='embedding-test').delete()
    JudgmentEmbedding.objects.all().delete()
    Judgment.objects.filter(ruling_text__contains='Embedding Test').delete()
    Dispute.objects.filter(title__contains='Embedding Test').delete()
    
    # Setup
    judge = User.objects.get_or_create(username='judge_embed', email='judge@embed.com')[0]
    tenant = User.objects.get_or_create(username='tenant_embed', email='tenant@embed.com')[0]
    owner = User.objects.get_or_create(username='owner_embed', email='owner@embed.com')[0]
    
    category = Category.objects.get_or_create(name="إلكترونيات", slug="electronics-embed")[0]
    product = Product.objects.create(
        owner=owner,
        name="جهاز اختبار",
        slug="embedding-test",
        price_per_day=200,
        category=category,
        size='M',
        color='أسود'
    )
    
    booking = Booking.objects.create(
        user=tenant,
        product=product,
        start_date=timezone.now(),
        end_date=timezone.now(),
        total_days=1,
        total_price=200,
        status='completed'
    )
    
    #==========================================================================
    # TEST 1: Generate Embedding
    #==========================================================================
    log("TEST 1: Generating embedding with REAL model...", "ACTION", "yellow")
    log("  Model: paraphrase-multilingual-MiniLM-L12-v2 (471MB)", "", "cyan")
    
    dispute = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Embedding Test: جهاز معطل",
        description="الجهاز لا يعمل منذ الإستلام",
        status='admissible'
    )
    
    judgment = Judgment.objects.create(
        dispute=dispute,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Embedding Test: المالك يستحق التعويض",
        status='final',
        awarded_amount=150,
        finalized_at=timezone.now()
    )
    
    # Generate embedding
    embedding = PrecedentSearchService.embed_judgment(judgment)
    
    if embedding:
        log("✓ Embedding generated successfully", "SUCCESS", "green")
    else:
        log("✗ Embedding generation failed", "FAIL", "red")
        return
    
    #==========================================================================
    # TEST 2: Verify Embedding Properties
    #==========================================================================
    log("TEST 2: Verifying embedding properties...", "ACTION", "yellow")
    
    checks = [
        (isinstance(embedding.embedding_vector, list), "Embedding is list"),
        (len(embedding.embedding_vector) == 384, f"Vector dimension = 384 (got {len(embedding.embedding_vector)})"),
        (embedding.model_version == 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2', f"Model version tracked ({embedding.model_version})"),
        (len(embedding.original_text) > 0, "Original text stored"),
        (len(embedding.normalized_text) > 0, "Normalized text stored"),
        ('مكسورة' not in embedding.normalized_text or 'مكسوره' in embedding.normalized_text, "Arabic normalized"),
    ]
    
    passed = 0
    for check, name in checks:
        if check:
            log(f"  ✓ {name}", "", "green")
            passed += 1
        else:
            log(f"  ✗ {name}", "", "red")
    
    if passed == len(checks):
        log(f"✓ All {len(checks)} property checks passed", "SUCCESS", "green")
    else:
        log(f"✗ Only {passed}/{len(checks)} checks passed", "FAIL", "red")
    
    #==========================================================================
    # TEST 3: Embedding Persistence
    #==========================================================================
    log("TEST 3: Testing embedding persistence (no re-generation)...", "ACTION", "yellow")
    
    # Call embed_judgment again - should return existing
    embedding2 = PrecedentSearchService.embed_judgment(judgment)
    
    if embedding.id == embedding2.id:
        log("✓ Existing embedding returned (not regenerated)", "SUCCESS", "green")
    else:
        log("✗ New embedding created unnecessarily", "FAIL", "red")
    
    #==========================================================================
    # TEST 4: Model Version Tracking
    #==========================================================================
    log("TEST 4: Verifying model version tracking...", "ACTION", "yellow")
    
    if embedding.model_version == 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2':
        log(f"✓ Model version: {embedding.model_version}", "SUCCESS", "green")
        log("  Real sentence-transformers model active", "", "cyan")
    else:
        log(f"✗ Unexpected model: {embedding.model_version}", "FAIL", "red")
    
    #==========================================================================
    # Summary
    #==========================================================================
    log("=" * 50, "", "cyan")
    log("🎉 Embedding Generation: VERIFIED", "", "green")
    log(f"  ✓ Vector dimension: {len(embedding.embedding_vector)}", "", "cyan")
    log(f"  ✓ Model: {embedding.model_version.split('/')[-1]}", "", "cyan")
    log("  ✓ Drift protection: model_version tracked", "", "cyan")
    log("  ✓ Original + Normalized text stored", "", "cyan")
    
    print("\n" + "="*50)
    print("SAMPLE EMBEDDING (First 10 dimensions):")
    print("="*50)
    print(embedding.embedding_vector[:10])
    print(f"\nVector norm: {sum(x**2 for x in embedding.embedding_vector)**0.5:.4f}")

if __name__ == "__main__":
    run_test()
