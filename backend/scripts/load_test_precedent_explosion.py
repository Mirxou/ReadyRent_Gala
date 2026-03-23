"""
Load Testing Script - Scenario C: Precedent Explosion

Simulates heavy precedent search load:
- 1000 concurrent embedding similarity calls
- Tests pgvector performance
- Validates caching effectiveness

Usage:
    python scripts/load_test_precedent_explosion.py

Requirements:
    pip install django faker
"""

import os
import sys
import django
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup Django
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Judgment
from apps.disputes.precedent_search_service import PrecedentSearchService


class PrecedentExplosionSimulator:
    """
    Simulate 1000 concurrent precedent searches
    """
    
    def __init__(self, total_searches=1000, concurrent_workers=20):
        self.total_searches = total_searches
        self.concurrent_workers = concurrent_workers
        
        self.stats = {
            'completed': 0,
            'cached': 0,
            'computed': 0,
            'failed': 0,
            'response_times': [],
            'errors': []
        }
        
    def get_test_judgments(self):
        """Get finalized judgments for testing"""
        judgments = list(Judgment.objects.filter(status='final')[:100])
        
        if not judgments:
            print("⚠️ No finalized judgments found. Creating test data...")
            # Create minimal test judgments
            from apps.disputes.models import Dispute
            from apps.bookings.models import Booking
            from apps.products.models import Product
            from django.contrib.auth import get_user_model
            
            User = get_user_model()
            user = User.objects.first()
            product = Product.objects.first()
            
            if not user or not product:
                print("❌ No users or products found. Please seed database first.")
                sys.exit(1)
            
            # Create 10 test judgments
            for i in range(10):
                booking = Booking.objects.create(
                    user=user,
                    product=product,
                    start_date='2026-01-01',
                    end_date='2026-01-03',
                    total_price=1000,
                    status='confirmed'
                )
                dispute = Dispute.objects.create(
                    user=user,
                    booking=booking,
                    title=f'Test Dispute {i}',
                    description='Test description',
                    category='damage',
                    status='submitted'
                )
                judgment = Judgment.objects.create(
                    dispute=dispute,
                    judge_notes=f'Test judgment {i}',
                    awarded_amount=500 + i * 100,
                    status='final'
                )
                judgments.append(judgment)
            
            print(f"✅ Created {len(judgments)} test judgments")
        
        return judgments
    
    def search_similar_cases(self, judgment, use_cache=True):
        """Search for similar cases to a judgment"""
        start_time = time.time()
        
        try:
            # Call precedent search service
            similar_cases = PrecedentSearchService.find_similar_cases(
                judgment,
                top_k=5,
                time_window_days=180,
                use_cache=use_cache
            )
            
            elapsed = time.time() - start_time
            self.stats['response_times'].append(elapsed)
            self.stats['completed'] += 1
            
            # Detect if cached (very fast response)
            if elapsed < 0.05:  # <50ms likely cached
                self.stats['cached'] += 1
            else:
                self.stats['computed'] += 1
            
            return True, elapsed
            
        except Exception as e:
            self.stats['failed'] += 1
            self.stats['errors'].append(str(e))
            return False, None
    
    def run(self):
        """Execute the precedent explosion test"""
        print(f"\n🚀 Starting Precedent Explosion Simulation")
        print(f"   Target: {self.total_searches} searches")
        print(f"   Concurrent Workers: {self.concurrent_workers}\n")
        
        # Get test judgments
        judgments = self.get_test_judgments()
        print(f"✅ Found {len(judgments)} judgments for testing\n")
        
        # First pass: Populate cache
        print("🔥 PASS 1: Cache Population (use_cache=True)")
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=self.concurrent_workers) as executor:
            futures = []
            
            # Search each judgment once to populate cache
            for judgment in judgments[:20]:  # Limit to 20 for cache population
                future = executor.submit(self.search_similar_cases, judgment, use_cache=True)
                futures.append(future)
            
            for future in as_completed(futures):
                pass
        
pass1_time = time.time() - start_time
        print(f"   Completed: {self.stats['completed']} | Time: {pass1_time:.2f}s\n")
        
        # Reset stats for second pass
        self.stats = {
            'completed': 0,
            'cached': 0,
            'computed': 0,
            'failed': 0,
            'response_times': [],
            'errors': []
        }
        
        # Second pass: Concurrent load with cache
        print("🔥 PASS 2: Concurrent Load (use_cache=True)")
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=self.concurrent_workers) as executor:
            futures = []
            
            # Repeat searches (should hit cache)
            for i in range(self.total_searches):
                judgment = judgments[i % len(judgments)]
                future = executor.submit(self.search_similar_cases, judgment, use_cache=True)
                futures.append(future)
                
                # Progress update every 100 searches
                if (i + 1) % 100 == 0:
                    completed = sum(1 for f in futures if f.done())
                    print(f"📊 Progress: {completed}/{self.total_searches} | "
                          f"Cached: {self.stats['cached']} | "
                          f"Computed: {self.stats['computed']}")
            
            for future in as_completed(futures):
                pass
        
        pass2_time = time.time() - start_time
        
        # Final report
        self.print_report(pass2_time)
    
    def print_report(self, total_time):
        """Print final test results"""
        avg_time = sum(self.stats['response_times']) / len(self.stats['response_times']) if self.stats['response_times'] else 0
        max_time = max(self.stats['response_times']) if self.stats['response_times'] else 0
        min_time = min(self.stats['response_times']) if self.stats['response_times'] else 0
        
        print("\n" + "="*60)
        print("📊 PRECEDENT EXPLOSION LOAD TEST - RESULTS")
        print("="*60)
        print(f"Total Searches: {self.stats['completed']}")
        print(f"Failed: {self.stats['failed']}")
        print(f"Success Rate: {(self.stats['completed']/(self.stats['completed']+self.stats['failed'])*100):.1f}%")
        print(f"\nCaching:")
        print(f"  - Cached Responses: {self.stats['cached']} ({self.stats['cached']/self.stats['completed']*100:.1f}%)")
        print(f"  - Computed: {self.stats['computed']} ({self.stats['computed']/self.stats['completed']*100:.1f}%)")
        print(f"\nPerformance:")
        print(f"  - Total Time: {total_time:.2f}s")
        print(f"  - Throughput: {self.stats['completed']/total_time:.1f} searches/second")
        print(f"  - Average Response Time: {avg_time*1000:.0f}ms")
        print(f"  - Min Response Time: {min_time*1000:.0f}ms")
        print(f"  - Max Response Time: {max_time*1000:.0f}ms")
        
        if self.stats['errors']:
            print(f"\n⚠️ Errors Encountered:")
            for error in set(self.stats['errors'][:5]):
                print(f"  - {error}")
        
        print("="*60)
        
        # Verification
        print("\n🔍 Verification:")
        
        if self.stats['cached'] / self.stats['completed'] > 0.80:  # >80% cache hit
            print(f"✅ PASS: High cache hit rate ({self.stats['cached']/self.stats['completed']*100:.1f}%)")
        else:
            print(f"⚠️ WARNING: Low cache hit rate ({self.stats['cached']/self.stats['completed']*100:.1f}%)")
        
        if avg_time < 0.2:  # <200ms average
            print(f"✅ PASS: Fast average response time ({avg_time*1000:.0f}ms)")
        else:
            print(f"❌ FAIL: Slow average response time ({avg_time*1000:.0f}ms)")
        
        if self.stats['failed'] / (self.stats['completed'] + self.stats['failed']) < 0.01:
            print(f"✅ PASS: Low failure rate")
        else:
            print(f"❌ FAIL: High failure rate")


if __name__ == '__main__':
    # Run quick version (100 searches with 10 workers) for testing
    # For full test: simulator = PrecedentExplosionSimulator(total_searches=1000, concurrent_workers=20)
    simulator = PrecedentExplosionSimulator(total_searches=100, concurrent_workers=10)
    simulator.run()
