
import os
import django
from django.conf import settings

# Minimal Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

print("Attempting imports...")
try:
    from apps.disputes.adjudication_service import AdjudicationService
    print("AdjudicationService: OK")
except Exception as e:
    print(f"AdjudicationService: FAIL - {e}")

try:
    from apps.disputes.engine import TribunalEngine
    print("TribunalEngine: OK")
except Exception as e:
    print(f"TribunalEngine: FAIL - {e}")

try:
    from apps.disputes.restitution_service import RestitutionService
    print("RestitutionService: OK")
except Exception as e:
    print(f"RestitutionService: FAIL - {e}")

try:
    from apps.disputes.services import DisputeService, DisputeRouter
    print("DisputeService/Router: OK")
except Exception as e:
    print(f"DisputeService/Router: FAIL - {e}")

try:
    from apps.disputes.escrow_service import EscrowService
    print("EscrowService: OK")
except Exception as e:
    print(f"EscrowService: FAIL - {e}")
