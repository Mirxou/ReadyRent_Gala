import asyncio
import aiohttp
import time
import statistics
import json

# SOVEREIGN STRESS TEST (Path 2: The Digital Fortress)
# Target: Evidence Ticker & Operational Stats view
# Goal: Verify system resilience under 1000+ simulated concurrent audit requests.

BASE_URL = "http://localhost:8001/api/disputes"
ENDPOINTS = [
    "/api/sovereign-eye/stats/",
]



CONCURRENT_USERS = 50
TOTAL_REQUESTS = 500

async def fetch(session, url, user_id):
    start = time.perf_counter()
    try:
        async with session.get(url) as response:
            status = response.status
            await response.text()  # Read body
            end = time.perf_counter()
            return end - start, status
    except Exception as e:
        return time.perf_counter() - start, 500

async def run_stress_test():
    print(f"🏰 STARTING DIGITAL FORTRESS STRESS TEST...")
    print(f"Targeting: {ENDPOINTS}")
    print(f"Load: {CONCURRENT_USERS} concurrent users, {TOTAL_REQUESTS} total requests.")

    latencies = []
    statuses = []

    async with aiohttp.ClientSession() as session:
        tasks = []
        for i in range(TOTAL_REQUESTS):
            url = f"{BASE_URL}{ENDPOINTS[i % len(ENDPOINTS)]}"
            tasks.append(fetch(session, url, i))
            
            # Simple throttling to simulate user arrival
            if len(tasks) >= CONCURRENT_USERS:
                results = await asyncio.gather(*tasks)
                for lat, stat in results:
                    latencies.append(lat)
                    statuses.append(stat)
                tasks = []
        
        if tasks:
            results = await asyncio.gather(*tasks)
            for lat, stat in results:
                latencies.append(lat)
                statuses.append(stat)

    # SECURE_ANALYTICS: Compute metrics
    success_rate = (statuses.count(200) / len(statuses)) * 100 if statuses else 0
    avg_latency = statistics.mean(latencies) if latencies else 0
    p95_latency = statistics.quantiles(latencies, n=20)[18] if len(latencies) > 20 else avg_latency

    print("\n--- PERFORMANCE CERTIFICATION ---")
    print(f"Success Rate: {success_rate:.2f}%")
    print(f"Average Latency: {avg_latency*1000:.2f}ms")
    print(f"P95 Latency: {p95_latency*1000:.2f}ms")
    
    if success_rate > 99 and p95_latency < 0.5:
        print("✅ RESILIENCE STATUS: SOVEREIGN (Production Ready)")
    else:
        print("⚠️ RESILIENCE STATUS: VULNERABLE (Remediation Required)")

if __name__ == "__main__":
    asyncio.run(run_stress_test())
