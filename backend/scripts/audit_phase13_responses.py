import os
import sys
import django
import json
from django.conf import settings

# Setup Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)) + '/../')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# ⚡ Configure Settings BEFORE setup to force SQLite and Allowed Hosts
from django.conf import settings
if not settings.configured:
    # We need to manually configure if we want to override BEFORE setup, 
    # but since we rely on config.settings, we let it load, then we might need to patch.
    # However, django.setup() reads os.environ.
    # Let's try to patch connection AFTER setup or use a test runner approach?
    # Simpler: Just use the settings.configure approach if possible, but that strictly requires no previous config.
    # Alternatives: Set DATABASE_URL to sqlite in env before import?
    pass

# Force SQLite for this script to avoid Supabase connection issues
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
os.environ['ALLOWED_HOSTS'] = 'testserver,localhost,127.0.0.1'

django.setup()

# Now patch settings just in case
settings.ALLOWED_HOSTS = ['testserver', 'localhost', '127.0.0.1']
# settings.DATABASES is already set by config.settings reading DATABASE_URL, ideally.

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.disputes.models import Dispute
from apps.payments.models import Wallet
from django.core.management import call_command

User = get_user_model()
client = APIClient()

def print_response(title, response):
    print(f"\n--- {title} ---")
    try:
        content = json.loads(response.content)
        print(json.dumps(content, indent=2, ensure_ascii=False))
    except:
        print(response.content.decode('utf-8'))
    print(f"Status: {response.status_code}")

def run_audit():
    print("🛠️  Setting up In-Memory Audit Environment...")
    # Migrate to create tables in memory/sqlite file
    call_command('migrate', verbosity=0)
    
    # Create Data
    user = User.objects.create_user(email='audit_citizen@readyrent.sovereign', password='password123', first_name='Audit', last_name='Citizen')
    Wallet.objects.create(user=user) # heuristic

    print("✅ Environment Ready.\n")

    # 1. Login Failure
    print("1️⃣ Generating Login Failure...")
    resp = client.post('/api/auth/login/', {'email': 'audit_citizen@readyrent.sovereign', 'password': 'wrongpassword'})
    print_response("Login Failure Response", resp)

    # 2. Validation Error
    print("2️⃣ Generating Validation Error...")
    client.force_authenticate(user=user)
    # Sending empty body to dispute create
    resp = client.post('/api/disputes/', {}) 
    print_response("Validation Error Response (Dispute Creation)", resp)

    # 3. Standard API Error (404)
    print("3️⃣ Generating 404/Generic Error...")
    resp = client.get('/api/someservice/invalid-endpoint/')
    print_response("404 Error Response", resp)

    # 4. Dispute Decision (Mocking a dispute)
    print("4️⃣ Fetching Dispute/Decision Structure...")
    dispute = Dispute.objects.create(
        user=user,
        title="Unauthorized Entry",
        description="Landlord entered without notice.",
        status='open'
    )
    resp = client.get(f'/api/disputes/{dispute.id}/')
    print_response("Dispute Detail Response", resp)

if __name__ == "__main__":
    run_audit()
