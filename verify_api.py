
import requests
import json
import sys

def test_endpoint(emotional_state):
    url = "http://127.0.0.1:8000/api/v1/judicial/disputes/initiate"
    payload = {"emotional_state": emotional_state}
    
    print(f"\n--- Testing with emotional_state='{emotional_state}' ---")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except:
            print("Response text:", response.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_endpoint("angry")
    test_endpoint("calm")
