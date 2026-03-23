"""Quick A/B test for Product endpoints"""
import requests
import time

BASE = "http://127.0.0.1:8000"

def test_endpoint(name, url, count=3):
    print(f"\n{name}:")
    print(f"  URL: {url}")
    times = []
    for i in range(count):
        start = time.time()
        try:
            r = requests.get(url, timeout=120)
            elapsed = (time.time() - start) * 1000
            times.append(elapsed)
            print(f"  Request {i+1}: {elapsed:.0f}ms (status: {r.status_code}, size: {len(r.content)} bytes)")
        except Exception as e:
            print(f"  Request {i+1}: ERROR - {e}")
    
    if times:
        avg = sum(times) / len(times)
        print(f"  Average: {avg:.0f}ms")
    return times

print("=" * 60)
print("A/B PERFORMANCE TEST")
print("=" * 60)

# Test fast endpoint first
fast_times = test_endpoint("FAST Endpoint (ultra-light)", f"{BASE}/api/products/fast/")

# Test regular endpoint
regular_times = test_endpoint("REGULAR Endpoint (with filters)", f"{BASE}/api/products/")

# Comparison
print("\n" + "=" * 60)
print("COMPARISON")
print("=" * 60)
if fast_times and regular_times:
    fast_avg = sum(fast_times) / len(fast_times)
    regular_avg = sum(regular_times) / len(regular_times)
    speedup = regular_avg / fast_avg if fast_avg > 0 else 0
    print(f"  FAST Average: {fast_avg:.0f}ms")
    print(f"  REGULAR Average: {regular_avg:.0f}ms")
    print(f"  Speedup: {speedup:.1f}x faster")
