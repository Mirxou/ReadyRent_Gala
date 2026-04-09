import os
import sys
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.test_settings')
django.setup()

from django.test import Client
from apps.users.models import User
from django.utils import timezone
import json

def debug_test():
    print("--- Starting Debug Test ---")
    client = Client()
    
    print("Step 1: Creating user...")
    user = User.objects.create_user(
        username="debug_user",
        email="debug@test.com",
        password="password123",
        merit_score=75
    )
    print(f"User created: {user.id}")
    
    client.force_login(user)
    print("Step 2: Sending POST request (angry)...")
    
    start_time = timezone.now()
    try:
        response = client.post('/api/v1/judicial/disputes/initiate/', {
            'emotional_state': 'angry'
        }, content_type='application/json')
        print(f"Response status: {response.status_code}")
        print(f"Response data: {response.content.decode()}")
    except Exception as e:
        print(f"Exception occurred: {e}")
    
    print(f"Total time: {(timezone.now() - start_time).total_seconds()}s")
    print("--- Debug Test Finished ---")

if __name__ == "__main__":
    debug_test()
