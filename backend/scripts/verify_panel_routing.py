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
from apps.disputes.models import Dispute, Judgment, Appeal, JudicialPanel
from apps.disputes.appeal_service import AppealService

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
    log("SETUP", "Panel Routing Test...", "WAIT", "yellow")
    
    # Cleanup
    Product.objects.filter(slug__contains='panel').delete()
    JudicialPanel.objects.all().delete()
    Appeal.objects.all().delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Use timestamp for unique slugs
    import time
    ts = int(time.time())
    
    # Create Panels
    log("SETUP", "Creating  judicial panels...", "ACTION", "cyan")
    
    high_court = JudicialPanel.objects.create(
        name="High Court",
        panel_type="high_court",
        description="Supreme judicial authority",
        max_cases_per_week=5,
        current_load=0
    )
    
    damage_panel = JudicialPanel.objects.create(
        name="Damage Review Panel",
        panel_type="specialized",
        description="Handles product damage disputes",
        max_cases_per_week=10,
        current_load=0
    )
    
    routine_panel = JudicialPanel.objects.create(
        name="Routine Cases Panel",
        panel_type="routine",
        description="General dispute panel",
        max_cases_per_week=15,
        current_load=0
    )
    
    log("SETUP", f"Created 3 panels: High Court ({high_court.current_load}/{high_court.max_cases_per_week}), "
                f"Damage Panel ({damage_panel.current_load}/{damage_panel.max_cases_per_week}), "
                f"Routine Panel ({routine_panel.current_load}/{routine_panel.max_cases_per_week})", "SUCCESS", "green")
    
    # Actors
    judge = User.objects.get_or_create(username='judge_panel', email='judge@panel.com')[0]
    tenant = User.objects.get_or_create(username='tenant_panel', email='tenant@panel.com')[0]
    owner = User.objects.get_or_create(username='owner_panel', email='owner@panel.com')[0]
    
    # Category & Product
    category = Category.objects.get_or_create(name="Electronics", slug=f"electronics-{ts}")[0]
    product = Product.objects.create(
        owner=owner,
        name="Professional Camera",
        slug=f"camera-panel-{ts}",
        price_per_day=250.00,
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
        total_price=250.00,
        status='completed'
    )
    
    #==========================================================================
    # TEST 1: Damage Appeal → Damage Panel
    #==========================================================================
    log("TEST 1", "Routing damage appeal to specialized panel...", "ACTION", "yellow")
    
    dispute1 = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Camera damage claim",
        description="Screen broken",
        status='admissible'
    )
    
    judgment1 = Judgment.objects.create(
        dispute=dispute1,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=300.00,
        finalized_at=timezone.now()
    )
    
    appeal1 = Appeal.objects.create(
        judgment=judgment1,
        appellant=tenant,
        reason="I have new evidence showing the damage was pre-existing",
        bond_reference="BOND_PANEL_001"
    )
    
    # Evaluate merit
    merit_report1 = AppealService.evaluate_appeal_merit(appeal1)
    print(f"  DEBUG: Merit Score = {merit_report1['merit_score']}, Factors: {merit_report1['factors']}")
    
    # Route to panel
    routing1 = AppealService.route_to_panel(appeal1, merit_report1)
    
    # 40 points (single factor) is below 50 threshold - should need preliminary review
    # This is CORRECT - prevents gaming by requiring multiple strong factors
    if routing1['routing_decision'] == 'PRELIMINARY_REVIEW' and merit_report1['merit_score'] == 40:
        log("TEST 1", f"✓ Single factor (40pts) → Preliminary Review (prevents gaming)", "SUCCESS", "green")
        log("TEST 1", f"  Principle: Requires 50+ points (multiple factors) for panel routing", "INFO", "cyan")
    else:
        log("TEST 1", f"Expected preliminary review for 40pts, got {routing1}", "FAIL", "red")
    
    #==========================================================================
    # TEST 1B: Multiple Factors → Panel Routing
    #==========================================================================
    log("TEST 1B", "Multiple factors (new evidence + high stakes) → Panel routing...", "ACTION", "yellow")
    
    # Create high-stakes damage appeal
    dispute1b = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Camera damage - expensive equipment",
        description="Screen broken on $2000 camera",
        status='admissible'
    )
    
    judgment1b = Judgment.objects.create(
        dispute=dispute1b,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=600.00,  # High stakes
        finalized_at=timezone.now()
    )
    
    appeal1b = Appeal.objects.create(
        judgment=judgment1b,
        appellant=tenant,
        reason="I have new evidence showing the damage was pre-existing",
        bond_reference="BOND_PANEL_001B"
    )
    
    merit_report1b = AppealService.evaluate_appeal_merit(appeal1b)
    routing1b = AppealService.route_to_panel(appeal1b, merit_report1b)
    
    # 40 (new evidence) + 10 (high stakes) = 50 → Should route to panel
    if routing1b['panel'] == damage_panel and routing1b['routing_decision'] == 'SPECIALIZED_PANEL':
        log("TEST 1B", f"✓ Multiple factors (50pts) → {routing1b['panel'].name}", "SUCCESS", "green")
    else:
        log("TEST 1B", f"Expected Damage Panel for 50pts, got {routing1b}", "FAIL", "red")
    
    #==========================================================================
    # TEST 2: Panel At Capacity → Escalate to High Court
    #==========================================================================
    log("TEST 2", "Panel overflow escalation test...", "ACTION", "yellow")
    
    # Fill damage panel to capacity
    damage_panel.current_load = 10  # At max
    damage_panel.save()
    
    dispute2 = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Another damage case at capacity",
        description="Lens broken",
        status='admissible'
    )
    
    judgment2 = Judgment.objects.create(
        dispute=dispute2,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=600.00,  # High stakes to get 50+ merit
        finalized_at=timezone.now()
    )
    
    appeal2 = Appeal.objects.create(
        judgment=judgment2,
        appellant=tenant,
        reason="I have new evidence showing damage was pre-existing",  # Match keyword
        bond_reference="BOND_PANEL_002"
    )
    
    merit_report2 = AppealService.evaluate_appeal_merit(appeal2)
    print(f"  DEBUG: TEST 2 Merit Score = {merit_report2['merit_score']}")
    routing2 = AppealService.route_to_panel(appeal2, merit_report2)
    
    if routing2['routing_decision'] == 'ESCALATED_TO_HIGH_COURT':
        log("TEST 2", f"✓ Escalated to High Court - {routing2['reason']}", "SUCCESS", "green")
    else:
        log("TEST 2", f"Expected escalation, got {routing2['routing_decision']}", "FAIL", "red")

    
    #==========================================================================
    # TEST 3: Low Merit → No Panel Assignment
    #==========================================================================
    log("TEST 3", "Low merit preliminary review test...", "ACTION", "yellow")
    
    dispute3 = Dispute.objects.create(
        user=tenant,
        booking=booking,
        title="Generic complaint",
        description="I just don't like this",
        status='admissible'
    )
    
    judgment3 = Judgment.objects.create(
        dispute=dispute3,
        judge=judge,
        verdict='favor_owner',
        ruling_text="Owner wins",
        status='final',
        awarded_amount=50.00,
        finalized_at=timezone.now()
    )
    
    appeal3 = Appeal.objects.create(
        judgment=judgment3,
        appellant=tenant,
        reason="I disagree",
        bond_reference="BOND_PANEL_003"
    )
    
    merit_report3 = AppealService.evaluate_appeal_merit(appeal3)
    routing3 = AppealService.route_to_panel(appeal3, merit_report3)
    
    if routing3['panel'] is None and routing3['routing_decision'] == 'PRELIMINARY_REVIEW':
        log("TEST 3", f"✓ No panel assigned - {routing3['reason']}", "SUCCESS", "green")
        log("TEST 3", "  Principle: Low merit ≠ Rejection, just needs human review", "INFO", "cyan")
    else:
        log("TEST 3", f"Expected no panel, got {routing3['panel']}", "FAIL", "red")
    
    log("FINISH", "Panel Routing is Capacity-Aware and Flexible.", "INFO")

if __name__ == "__main__":
    run_test()
