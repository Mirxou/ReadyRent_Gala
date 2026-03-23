"""
Load Testing Script - Scenario B: Malicious Burst

Simulates malicious attack:
- 1000 requests in 5 minutes
- Mix of valid and invalid requests
- Tests rate limiting and abuse detection

Usage:
    python scripts/load_test_malicious_burst.py

Requirements:
    pip install requests
"""

import requests
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime


class MaliciousBurstSimulator:
    """
    Simulate aggressive API abuse
    """
    
    def __init__(self, total_requests=1000, duration_minutes=5, base_url='http://localhost:8000'):
        self.total_requests = total_requests
        self.duration_minutes = duration_minutes
        self.duration_seconds = duration_minutes * 60
        self.base_url = base_url
        
        self.stats = {
            'sent': 0,
            'success_200': 0,
            'throttled_429': 0,
            'failed_4xx': 0,
            'failed_5xx': 0,
            'response_times': [],
            'errors': []
        }
        
    def send_request(self, endpoint, method='GET', data=None):
        """Send a single HTTP request"""
        start_time = time.time()
        
        try:
            url = f"{self.base_url}{endpoint}"
            
            if method == 'GET':
                response = requests.get(url, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, timeout=10)
            else:
                response = requests.request(method, url, json=data, timeout=10)
            
            elapsed = time.time() - start_time
            self.stats['response_times'].append(elapsed)
            self.stats['sent'] += 1
            
            # Track status codes
            if response.status_code == 200:
                self.stats['success_200'] += 1
            elif response.status_code == 429:
                self.stats['throttled_429'] += 1
            elif 400 <= response.status_code < 500:
                self.stats['failed_4xx'] += 1
            elif 500 <= response.status_code < 600:
                self.stats['failed_5xx'] += 1
            
            return response.status_code, elapsed
            
        except requests.exceptions.Timeout:
            self.stats['errors'].append('Timeout')
            return None, None
        except requests.exceptions.ConnectionError:
            self.stats['errors'].append('Connection Error')
            return None, None
        except Exception as e:
            self.stats['errors'].append(str(e))
            return None, None
    
    def generate_malicious_patterns(self):
        """Generate mix of attack patterns"""
        patterns = []
        
        # Pattern 1: Spam public metrics (40%)
        for _ in range(int(self.total_requests * 0.4)):
            patterns.append(('GET', '/api/disputes/public/metrics/'))
        
        # Pattern 2: Spam judgment ledger (30%)
        for _ in range(int(self.total_requests * 0.3)):
            patterns.append(('GET', '/api/disputes/public/judgments/'))
        
        # Pattern 3: Invalid dispute creation (20%)
        for _ in range(int(self.total_requests * 0.2)):
            patterns.append(('POST', '/api/disputes/disputes/create/', {
                'invalid': 'data',
                'spam': True
            }))
        
        # Pattern 4: Precedent search spam (10%)
        for _ in range(int(self.total_requests * 0.1)):
            patterns.append(('GET', '/api/disputes/expectations/booking/999999/'))
        
        # Shuffle for realism
        random.shuffle(patterns)
        return patterns
    
    def run(self):
        """Execute the burst attack simulation"""
        print(f"\n🚀 Starting Malicious Burst Simulation")
        print(f"   Target: {self.total_requests} requests over {self.duration_minutes} minutes")
        print(f"   Base URL: {self.base_url}\n")
        
        patterns = self.generate_malicious_patterns()
        interval = self.duration_seconds / self.total_requests
        
        start_time = time.time()
        
        # Use thread pool for concurrent requests
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = []
            
            for i, pattern in enumerate(patterns):
                method, endpoint = pattern[0], pattern[1]
                data = pattern[2] if len(pattern) > 2 else None
                
                future = executor.submit(self.send_request, endpoint, method, data)
                futures.append(future)
                
                # Progress update every 100 requests
                if (i + 1) % 100 == 0:
                    elapsed = time.time() - start_time
                    print(f"📊 Sent: {i+1}/{self.total_requests} | "
                          f"Throttled: {self.stats['throttled_429']} | "
                          f"Errors: {len(self.stats['errors'])}")
                
                # Maintain burst rate
                time.sleep(interval)
            
            # Wait for all requests to complete
            for future in as_completed(futures):
                pass
        
        # Final report
        self.print_report()
    
    def print_report(self):
        """Print final test results"""
        total = self.stats['sent']
        avg_time = sum(self.stats['response_times']) / len(self.stats['response_times']) if self.stats['response_times'] else 0
        max_time = max(self.stats['response_times']) if self.stats['response_times'] else 0
        
        print("\n" + "="*60)
        print("📊 MALICIOUS BURST LOAD TEST - RESULTS")
        print("="*60)
        print(f"Total Requests Sent: {total}")
        print(f"\nStatus Codes:")
        print(f"  - 200 Success: {self.stats['success_200']} ({self.stats['success_200']/total*100:.1f}%)")
        print(f"  - 429 Throttled: {self.stats['throttled_429']} ({self.stats['throttled_429']/total*100:.1f}%)")
        print(f"  - 4xx Client Error: {self.stats['failed_4xx']} ({self.stats['failed_4xx']/total*100:.1f}%)")
        print(f"  - 5xx Server Error: {self.stats['failed_5xx']} ({self.stats['failed_5xx']/total*100:.1f}%)")
        print(f"\nPerformance:")
        print(f"  - Average Response Time: {avg_time*1000:.0f}ms")
        print(f"  - Max Response Time: {max_time*1000:.0f}ms")
        
        if self.stats['errors']:
            print(f"\n⚠️ Connection Errors: {len(self.stats['errors'])}")
            unique_errors = list(set(self.stats['errors']))[:5]
            for error in unique_errors:
                print(f"  - {error}: {self.stats['errors'].count(error)} times")
        
        print("="*60)
        
        # Verification
        print("\n🔍 Verification:")
        
        # Check rate limiting is working
        if self.stats['throttled_429'] > 0:
            print(f"✅ PASS: Rate limiting active ({self.stats['throttled_429']} throttled)")
        else:
            print("⚠️ WARNING: No rate limiting detected")
        
        # Check server didn't crash
        if self.stats['failed_5xx'] / total < 0.05:  # <5% 5xx errors
            print(f"✅ PASS: Server stable (<5% 5xx errors)")
        else:
            print(f"❌ FAIL: High server error rate ({self.stats['failed_5xx']/total*100:.1f}%)")
        
        # Check average response time under load
        if avg_time < 2.0:  # 2 second target under attack
            print(f"✅ PASS: Response time acceptable under load")
        else:
            print(f"⚠️ WARNING: High response time under load ({avg_time:.2f}s)")


if __name__ == '__main__':
    # Run quick version (100 requests over 30 seconds) for testing
    # For full test: simulator = MaliciousBurstSimulator(total_requests=1000, duration_minutes=5)
    simulator = MaliciousBurstSimulator(total_requests=100, duration_minutes=0.5)
    simulator.run()
