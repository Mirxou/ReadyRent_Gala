import os
import django
import sys
from django.conf import settings

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import User
from apps.disputes.models import Dispute
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
    log("SETUP", "Initializing AI Bailiff Test...", "WAIT", "yellow")
    
    # Mock Data (No DB persistence needed for pure service test, but Dispute needs to exist in memory or DB)
    # We'll create simple memory objects or use DB if service depends on it. 
    # Service depends on dispute.description/title.
    
    user, _ = User.objects.get_or_create(username='bailiff_tester', email='test@bailiff.com')
    
    # Case 1: Damage Dispute
    dispute_damage = Dispute(
        title="Screen Cracked",
        description="The item was returned with a cracked screen.",
        user=user
    )
    
    # Case 2: Lateness
    dispute_late = Dispute(
        title="Late Return",
        description="User returned the item 4 hours late.",
        user=user
    )

    # Test 1: Damage Logic
    log("TEST 1", "Analyzing 'Damage' Dispute...", "ACTION", "yellow")
    report_1 = DisputeService.suggest_clauses(dispute_damage)
    
    if report_1['is_binding'] is False:
         log("TEST 1", "Confirmed Non-Binding Status.", "SUCCESS", "green")
    else:
         log("TEST 1", "CRITICAL: Bailiff tried to bind judgment!", "FAIL", "red")

    suggestions_1 = report_1['suggestions']
    damage_clause = next((s for s in suggestions_1 if s['clause_id'] == 'CLAUSE_7_DAMAGE'), None)
    
    if damage_clause and damage_clause['confidence'] > 0.8:
        log("TEST 1", f"Found Damage Clause (Conf: {damage_clause['confidence']})", "SUCCESS", "green")
    else:
        log("TEST 1", "Failed to identify Damage Clause.", "FAIL", "red")


    # Test 2: Late Logic
    log("TEST 2", "Analyzing 'Late' Dispute...", "ACTION", "yellow")
    report_2 = DisputeService.suggest_clauses(dispute_late)
    
    suggestions_2 = report_2['suggestions']
    late_clause = next((s for s in suggestions_2 if s['clause_id'] == 'CLAUSE_4_LATE_FEES'), None)
    
    if late_clause:
        log("TEST 2", f"Found Late Fee Clause (Conf: {late_clause['confidence']})", "SUCCESS", "green")
    else:
        log("TEST 2", "Failed to identify Late Clause.", "FAIL", "red")

    log("FINISH", "The AI Bailiff is serving the court.", "INFO")

if __name__ == "__main__":
    run_test()
