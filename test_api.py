"""
Simple script to test API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_api():
    print("=" * 50)
    print("Testing ReadyRent.Gala API")
    print("=" * 50)
    
    # Test 1: Check if API is running
    print("\n1. Checking if API is running...")
    try:
        response = requests.get(f"{BASE_URL}/products/", timeout=5)
        if response.status_code == 200:
            print("   ✓ API is running!")
            data = response.json()
            print(f"   Found {len(data.get('results', []))} products")
        else:
            print(f"   ✗ API returned status {response.status_code}")
            return
    except requests.exceptions.ConnectionError:
        print("   ✗ Cannot connect to API. Make sure backend is running:")
        print("     cd backend && python manage.py runserver")
        return
    except Exception as e:
        print(f"   ✗ Error: {e}")
        return
    
    # Test 2: Login
    print("\n2. Testing login...")
    login_data = {
        "email": "abounaas54@gmail.com",
        "password": "admin123"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login/", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data.get('access')
            print("   ✓ Login successful!")
            print(f"   Access Token: {access_token[:50]}...")
            
            # Test 3: Get bookings with token
            print("\n3. Testing authenticated endpoint (bookings)...")
            headers = {"Authorization": f"Bearer {access_token}"}
            response = requests.get(f"{BASE_URL}/bookings/", headers=headers)
            if response.status_code == 200:
                bookings = response.json()
                print(f"   ✓ Got {len(bookings.get('results', []))} bookings")
            else:
                print(f"   ✗ Error: {response.status_code}")
        else:
            print(f"   ✗ Login failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    # Test 4: Get categories
    print("\n4. Testing categories endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/products/categories/")
        if response.status_code == 200:
            categories = response.json()
            print(f"   ✓ Found {len(categories)} categories")
            for cat in categories[:3]:
                print(f"     - {cat.get('name_ar', cat.get('name'))}")
        else:
            print(f"   ✗ Error: {response.status_code}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
    
    print("\n" + "=" * 50)
    print("Testing complete!")
    print("=" * 50)
    print("\nNext steps:")
    print("1. Open http://localhost:8000/api/docs/ in your browser")
    print("2. Try the endpoints manually in Swagger UI")
    print("3. Continue to frontend setup")

if __name__ == "__main__":
    test_api()

