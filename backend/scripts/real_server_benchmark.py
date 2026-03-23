"""
Phase 24: Real Server Performance Benchmark

This script tests REAL performance against a running Django server.
Unlike Test Client, this measures actual HTTP latency through the network stack.

Usage:
1. Start server: python manage.py runserver 8000
2. Run this: python scripts/real_server_benchmark.py
"""
import requests
import time
import statistics
import json
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
BASE_URL = "http://127.0.0.1:8000"
ENDPOINTS = {
    "Product List": "/api/products/",
    "Public Judgment Ledger": "/api/disputes/public/judgments/",
    "Metrics Dashboard": "/api/disputes/public/metrics/dashboard/",
    "Categories": "/api/products/categories/",
}

# How many times to hit each endpoint
REQUESTS_PER_ENDPOINT = 10

# Warm-up requests (cache priming)
WARMUP_REQUESTS = 2

def measure_endpoint(name, url, session):
    """Measure a single request latency"""
    start = time.time()
    try:
        response = session.get(url, timeout=60)
        latency_ms = (time.time() - start) * 1000
        return {
            "success": True,
            "status_code": response.status_code,
            "latency_ms": latency_ms,
            "size_bytes": len(response.content)
        }
    except Exception as e:
        latency_ms = (time.time() - start) * 1000
        return {
            "success": False,
            "error": str(e),
            "latency_ms": latency_ms
        }

def calculate_percentiles(latencies):
    """Calculate P50, P95, P99"""
    if not latencies:
        return {"P50": 0, "P95": 0, "P99": 0}
    
    sorted_lat = sorted(latencies)
    n = len(sorted_lat)
    
    return {
        "P50": sorted_lat[int(n * 0.5)],
        "P95": sorted_lat[int(n * 0.95)] if n >= 20 else sorted_lat[-1],
        "P99": sorted_lat[int(n * 0.99)] if n >= 100 else sorted_lat[-1],
        "min": min(sorted_lat),
        "max": max(sorted_lat),
        "avg": statistics.mean(sorted_lat)
    }

def run_benchmark():
    print("=" * 80)
    print("PHASE 24: REAL SERVER PERFORMANCE BENCHMARK")
    print("=" * 80)
    print(f"Base URL: {BASE_URL}")
    print(f"Requests per endpoint: {REQUESTS_PER_ENDPOINT}")
    print(f"Warm-up requests: {WARMUP_REQUESTS}")
    print()
    
    # Check server is running
    try:
        requests.get(BASE_URL, timeout=5)
        print("✓ Server is running")
    except:
        print("✗ Server not responding! Start with: python manage.py runserver 8000")
        return
    
    print()
    results = {}
    
    # Create session for connection pooling
    session = requests.Session()
    
    for name, path in ENDPOINTS.items():
        url = BASE_URL + path
        print(f"Testing: {name}...")
        print(f"  URL: {url}")
        
        latencies = []
        errors = 0
        
        # Warm-up (prime cache)
        print(f"  Warming up ({WARMUP_REQUESTS} requests)...")
        for _ in range(WARMUP_REQUESTS):
            measure_endpoint(name, url, session)
        
        # Actual measurements
        print(f"  Measuring ({REQUESTS_PER_ENDPOINT} requests)...")
        for i in range(REQUESTS_PER_ENDPOINT):
            result = measure_endpoint(name, url, session)
            if result["success"]:
                latencies.append(result["latency_ms"])
            else:
                errors += 1
                print(f"    Error on request {i+1}: {result.get('error', 'Unknown')}")
        
        # Calculate stats
        if latencies:
            stats = calculate_percentiles(latencies)
            print(f"  ✓ P50: {stats['P50']:.0f}ms | P95: {stats['P95']:.0f}ms | P99: {stats['P99']:.0f}ms")
            print(f"    Min: {stats['min']:.0f}ms | Max: {stats['max']:.0f}ms | Avg: {stats['avg']:.0f}ms")
            
            results[name] = {
                "url": url,
                "latencies": latencies,
                "stats": stats,
                "errors": errors,
                "success_rate": (REQUESTS_PER_ENDPOINT - errors) / REQUESTS_PER_ENDPOINT * 100
            }
        else:
            print(f"  ✗ All requests failed!")
            results[name] = {"url": url, "errors": errors, "success_rate": 0}
        
        print()
    
    # Summary
    print("=" * 80)
    print("BENCHMARK SUMMARY")
    print("=" * 80)
    print()
    
    targets = {
        "Product List": 1000,  # <1s
        "Public Judgment Ledger": 800,  # <800ms
        "Metrics Dashboard": 1000,  # <1s
        "Categories": 500,  # <500ms
    }
    
    passed = 0
    failed = 0
    
    for name, data in results.items():
        if "stats" in data:
            p95 = data["stats"]["P95"]
            target = targets.get(name, 1000)
            status = "✓ PASS" if p95 < target else "✗ FAIL"
            
            if p95 < target:
                passed += 1
            else:
                failed += 1
            
            print(f"{status} | {name}")
            print(f"       P95: {p95:.0f}ms (target: <{target}ms)")
        else:
            failed += 1
            print(f"✗ FAIL | {name}")
            print(f"       All requests failed")
    
    print()
    print(f"Results: {passed} passed, {failed} failed")
    print()
    
    # Save report
    report = {
        "timestamp": datetime.now().isoformat(),
        "config": {
            "base_url": BASE_URL,
            "requests_per_endpoint": REQUESTS_PER_ENDPOINT,
            "warmup_requests": WARMUP_REQUESTS
        },
        "results": results,
        "summary": {
            "passed": passed,
            "failed": failed
        }
    }
    
    report_path = f"scripts/real_benchmark_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, default=str)
    
    print(f"Report saved to: {report_path}")
    print("=" * 80)

if __name__ == "__main__":
    run_benchmark()
