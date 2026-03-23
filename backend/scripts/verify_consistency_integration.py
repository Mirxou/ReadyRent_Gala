import os
import django
import sys
from django.utils import timezone

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, Judgment, EvidenceLog
from apps.disputes.consistency_service import ConsistencyService

def log(test_name, message, status="INFO", color="white"):
    colors = {
        "green": "\033[92m",
        "red": "\033[91m",
        "yellow": "\033[93m",
        "cyan": "\033[96m",
        "reset": "\033[0m"
    }
    print(f"{colors.get(color, '')}[{test_name}] {message} {status}{colors['reset']}")

def run_test():
    print("--------------------------------------------------")
    log("SETUP", "E2E Consistency Integration Test...", "WAIT", "yellow")
    
    # Cleanup
    EvidenceLog.objects.filter(action__startswith="CONSISTENCY_CHECK").delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Actors
    judge = User.objects.get_or_create(username='judge_e2e', email='judge@e2e.com')[0]
    tenant = User.objects.get_or_create(username='tenant_e2e', email='tenant@e2e.com')[0]
    owner = User.objects.get_or_create(username='owner_e2e', email='owner@e2e.com')[0]
    
    # Category
    category = Category.objects.get_or_create(name="CameraGear", slug="camera-gear-e2e")[0]
    
    #==========================================================================
    # Create 5 baseline judgments (auto-trigger should run for all)
    #==========================================================================
    log("TEST 1", "Creating 5 baseline judgments (auto-trigger)...", "ACTION", "yellow")
    
    for i in range(5):
        product = Product.objects.create(
            owner=owner,
            name=f"Camera {i}",
            slug=f"camera-{i}-e2e",
            price_per_day=150.00,
            category=category,
            size='M',
            color='Black'
        )
        
        booking = Booking.objects.create(
            user=tenant,
            product=product,
            start_date=timezone.now(),
            end_date=timezone.now(),
            total_days=1,
            total_price=150.00,
            status='completed'
        )
        
        dispute = Dispute.objects.create(
            user=tenant,
            booking=booking,
            title=f"Lens damage {i}",
            description="The lens has a scratch",
            status='admissible'
        )
        
        # Create FINAL judgment (should auto-trigger consistency check via signal)
        judgment = Judgment.objects.create(
            dispute=dispute,
            judge=judge,
            verdict='favor_owner',
            ruling_text="Owner wins - equipment damage",
            status='final',
            awarded_amount=75.00,
            finalized_at=timezone.now()
        )
    
    log("TEST 1", "5 judgments created with auto-trigger", "SUCCESS", "green")
    
    #==========================================================================
    # Verify EvidenceLog contains consistency reports
    #==========================================================================
    log("TEST 2", "Verifying EvidenceLog contains consistency reports...", "ACTION", "yellow")
    
    consistency_logs = EvidenceLog.objects.filter(action__startswith="CONSISTENCY_CHECK")
    
    if consistency_logs.count() == 5:
        log("TEST 2", f"Found {consistency_logs.count()} consistency logs (Correct)", "SUCCESS", "green")
    else:
        log("TEST 2", f"Expected 5 logs, found {consistency_logs.count()}", "FAIL", "red")
    
    # Check log details
    for evidence_log in consistency_logs:
        metadata = evidence_log.metadata
        recommendation = metadata.get('recommendation')
        score = metadata.get('consistency_score')
        
        if score is None:
            log("TEST 2", f"  → {recommendation} (Bootstrap)", "INFO", "cyan")
        else:
            log("TEST 2", f"  → {recommendation}: {score:.0%}", "INFO", "cyan")
    
    #==========================================================================
    # Verify transparency: Divergence is logged, not blocked
    #==========================================================================
    log("TEST 3", "Creating divergent judgment (should log, not block)...", "ACTION", "yellow")
    
    product_div = Product.objects.create(
        owner=owner,
        name="Camera Divergent",
        slug="camera-div-e2e",
        price_per_day=150.00,
        category=category,
        size='M',
        color='Black'
    )
    
    booking_div = Booking.objects.create(
        user=tenant,
        product=product_div,
        start_date=timezone.now(),
        end_date=timezone.now(),
        total_days=1,
        total_price=150.00,
        status='completed'
    )
    
    dispute_div = Dispute.objects.create(
        user=tenant,
        booking=booking_div,
        title="Lens damage but owner fraudulent",
        description="Complex case - special circumstances",
        status='admissible'
    )
    
    # DIVERGENT judgment (different verdict)
    judgment_div = Judgment.objects.create(
        dispute=dispute_div,
        judge=judge,
        verdict='favor_tenant',  # DIFFERENT from precedents
        ruling_text="Tenant wins - owner committed fraud",
        status='final',
        awarded_amount=0.00,
        finalized_at=timezone.now()
    )
    
    # Check if divergent judgment was allowed (not blocked)
    if judgment_div.id:
        log("TEST 3", "Divergent judgment created (not blocked) ✓", "SUCCESS", "green")
    
    # Check if divergence was logged
    div_log = EvidenceLog.objects.filter(
        action__startswith="CONSISTENCY_CHECK",
        metadata__judgment_id=judgment_div.id
    ).first()
    
    if div_log:
        recommendation = div_log.metadata.get('recommendation')
        divergence_flags = div_log.metadata.get('divergence_flags', [])
        
        if recommendation == 'DIVERGENT' and len(divergence_flags) > 0:
            log("TEST 3", f"Divergence flagged: {len(divergence_flags)} flags", "SUCCESS", "green")
            log("TEST 3", f"  Transparency: Logged, not enforced", "SUCCESS", "green")
        else:
            log("TEST 3", "Divergence not properly flagged", "FAIL", "red")
    else:
        log("TEST 3", "No consistency log found for divergent judgment", "FAIL", "red")
    
    log("FINISH", "Consistency Integration is Transparent and Active.", "INFO")

if __name__ == "__main__":
    run_test()
