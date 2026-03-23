"""
Quick diagnostic script to test the login endpoint
"""
import requests
import json

# Test the login endpoint
url = "http://127.0.0.1:8000/api/auth/login/"

# Test data - using a dummy account
data = {
    "email": "test@example.com",
    "password": "testpassword123"
}

print("Testing Login Endpoint...")
print(f"URL: {url}")
print(f"Data: {json.dumps(data, indent=2)}")
print("-" * 50)

try:
    response = requests.post(url, json=data, timeout=5)
    print(f"Status Code: {response.status_code}")
    print(f"Headers: {dict(response.headers)}")
    print("-" * 50)
    print("Response Body:")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)
except requests.exceptions.ConnectionError as e:
    print(f"❌ Connection Error: {e}")
    print("Backend might not be running on 127.0.0.1:8000")
except requests.exceptions.Timeout:
    print("❌ Request timed out")
except Exception as e:
    print(f"❌ Error: {type(e).__name__}: {e}")
