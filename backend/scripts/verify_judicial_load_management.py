"""
Phase 21 Step 4: Final Integration Verification
Tests 10 appeals with various merit scores → correct routing
"""
import os
import django
import sys
from django.utils import timezone
import time

sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.disputes.models import Dispute, Judgment, Appeal, JudicialPanel
from apps.disputes.appeal_service import AppealService

def log(msg, status="", color="white"):
    colors = {"green": "\033[92m", "red": "\033[91m", "yellow": "\033[93m", "cyan": "\033[96m", "reset": "\033[0m"}
    print(f"{colors.get(color, '')}[PHASE 21] {msg} {status}{colors['reset']}")

def run_test():
    log("=== JUDICIAL LOAD MANAGEMENT: FINAL INTEGRATION ===", "", "cyan")
    
    # Cleanup
    ts = int(time.time())
    Product.objects.filter(slug__contains='load-test').delete()
    JudicialPanel.objects.all().delete()
    Appeal.objects.all().delete()
    Judgment.objects.all().delete()
    Dispute.objects.all().delete()
    
    # Create Panels
    high_court = JudicialPanel.objects.create(name="High Court", panel_type="high_court", max_cases_per_week=3, current_load=0)
    damage_panel = JudicialPanel.objects.create(name="Damage Panel", panel_type="specialized", max_cases_per_week=5, current_load=0)
    routine_panel = JudicialPanel.objects.create(name="Routine Panel", panel_type="routine", max_cases_per_week=10, current_load=0)
    
    log(f"Created panels: High Court (0/3), Damage (0/5), Routine (0/10)", "", "green")
    
    # Actors
    judge = User.objects.get_or_create(username='judge_load', email='judge@load.com')[0]
    tenant = User.objects.get_or_create(username='tenant_load', email='tenant@load.com')[0]
    owner = User.objects.get_or_create(username='owner_load', email='owner@load.com')[0]
    category = Category.objects.get_or_create(name="LoadTest", slug=f"load-cat-{ts}")[0]
    product = Product.objects.create(owner=owner, name="Load Test Item", slug=f"load-test-{ts}", price_per_day=100, category=category, size='M', color='Blue')
    booking = Booking.objects.create(user=tenant, product=product, start_date=timezone.now(), end_date=timezone.now(), total_days=1, total_price=100, status='completed')
    
    # === 10 APPEAL SCENARIOS ===
    scenarios = [
        # (title, reason, amount, expected_decision)
        ("Damage claim 1", "I have new evidence about pre-existing damage", 600, "SPECIALIZED_PANEL"),  # 50pts
        ("Damage claim 2", "I have new evidence about damage", 600, "SPECIALIZED_PANEL"),  # 50pts
        ("Damage claim 3", "new evidence found", 600, "SPECIALIZED_PANEL"),  # 50pts
        ("Damage claim 4", "additional proof of damage", 600, "SPECIALIZED_PANEL"),  # 50pts
        ("Damage claim 5", "discovered new damage evidence", 600, "SPECIALIZED_PANEL"),  # 50pts - Panel now full
        ("Damage claim 6", "new evidence on damage", 600, "ESCALATED_TO_HIGH_COURT"),  # 50pts - Overflow to High Court
        ("High stakes case", "new evidence AND procedure violation", 700, "HIGH_COURT"),  # 70pts → High Court
        ("Routine complaint 1", "I disagree with outcome", 50, "PRELIMINARY_REVIEW"),  # 0pts
        ("Routine complaint 2", "Not fair", 50, "PRELIMINARY_REVIEW"),  # 0pts
        ("Routine complaint 3", "Unhappy", 50, "PRELIMINARY_REVIEW"),  # 0pts
    ]
    
    passed = 0
    failed = 0
    
    for i, (title, reason, amount, expected) in enumerate(scenarios, 1):
        dispute = Dispute.objects.create(user=tenant, booking=booking, title=title, description=title, status='admissible')
        judgment = Judgment.objects.create(dispute=dispute, judge=judge, verdict='favor_owner', ruling_text="Decision", status='final', awarded_amount=amount, finalized_at=timezone.now())
        appeal = Appeal.objects.create(judgment=judgment, appellant=tenant, reason=reason, bond_reference=f"BOND_{i}")
        
        merit = AppealService.evaluate_appeal_merit(appeal)
        routing = AppealService.route_to_panel(appeal, merit)
        
        # Track panel load
        if routing['panel']:
            routing['panel'].assign_case()
        
        if routing['routing_decision'] == expected:
            log(f"✓ Case {i}: {title[:20]}... → {routing['routing_decision']}", "", "green")
            passed += 1
        else:
            log(f"✗ Case {i}: Expected {expected}, got {routing['routing_decision']}", "", "red")
            failed += 1
    
    # Summary
    log("=" * 50, "", "cyan")
    log(f"RESULTS: {passed}/10 passed, {failed}/10 failed", "SUCCESS" if failed == 0 else "FAIL", "green" if failed == 0 else "red")
    log(f"High Court Load: {high_court.current_load}/{high_court.max_cases_per_week}", "", "yellow")
    log(f"Damage Panel Load: {damage_panel.current_load}/{damage_panel.max_cases_per_week}", "", "yellow")
    
    if failed == 0:
        log("🎉 Phase 21: Judicial Load Management COMPLETE", "", "green")
        log("  ✓ Merit scoring routes appeals intelligently", "", "cyan")
        log("  ✓ Specialized panels handle domain-specific cases", "", "cyan")
        log("  ✓ Capacity limits prevent burnout", "", "cyan")
        log("  ✓ Auto-escalation ensures no case is dropped", "", "cyan")

if __name__ == "__main__":
    run_test()
