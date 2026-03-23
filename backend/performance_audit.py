import requests
import time
import threading
from statistics import mean

# ReadyRent.Gala Performance Audit Script
# Simulated Stress Test for Gunicorn/PostgreSQL

BASE_URL = "http://localhost:8000"
ENDPOINTS = [
    "/api/health/",
    # "/api/products/",  # Requires existing products or list access
]

def hit_endpoint(endpoint, results):
    url = f"{BASE_URL}{endpoint}"
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        duration = time.time() - start_time
        results.append({
            "status": response.status_code,
            "duration": duration
        })
    except Exception as e:
        results.append({
            "status": "ERROR",
            "error": str(e)
        })

def run_stress_test(concurrency=10, requests_per_thread=5):
    print(f"🚀 Starting Performance Audit (Concurrency: {concurrency})...")
    threads = []
    results = []
    
    start_all = time.time()
    for _ in range(concurrency):
        for endpoint in ENDPOINTS:
            for _ in range(requests_per_thread):
                t = threading.Thread(target=hit_endpoint, args=(endpoint, results))
                threads.append(t)
                t.start()
    
    for t in threads:
        t.join()
    
    total_time = time.time() - start_all
    
    # Analyze Results
    successes = [r for r in results if r["status"] == 200]
    durations = [r["duration"] for r in successes]
    errors = [r for r in results if r["status"] != 200]
    
    print("\n--- Performance Report ---")
    print(f"Total Requests: {len(results)}")
    print(f"Successful: {len(successes)}")
    print(f"Errors/Fails: {len(errors)}")
    
    if durations:
        print(f"Avg Response Time: {mean(durations):.4f}s")
        print(f"Min Response Time: {min(durations):.4f}s")
        print(f"Max Response Time: {max(durations):.4f}s")
    
    print(f"Total Audit Time: {total_time:.2f}s")
    print(f"Throughput: {len(results)/total_time:.2f}req/s")
    print("--------------------------\n")

if __name__ == "__main__":
    # Check if server is up first
    try:
        requests.get(f"{BASE_URL}/api/health/", timeout=2)
        run_stress_test()
    except:
        print("⚠️ Server not reachable at localhost:8000. Skipping live test.")
        print("   (This is expected if running in an environment without Docker active)")
