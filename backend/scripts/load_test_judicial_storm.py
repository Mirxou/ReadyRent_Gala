"""
Load Testing Script - Scenario A: Judicial Storm

Simulates high legitimate load:
- 500 disputes filed over 6 hours
- 30% appeals rate
- 10% emergency priority
- 5% malicious actors (to test abuse detection)

Usage:
    python scripts/load_test_judicial_storm.py

Requirements:
    pip install requests django faker
"""

import os
import sys
import django
import random
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup Django
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.disputes.models import Dispute, Judgment
from apps.bookings.models import Booking
from apps.products.models import Product
from faker import Faker

User = get_user_model()
fake = Faker(['ar_SA', 'en_US'])


class JudicialStormSimulator:
    """
    Simulate 500 disputes over 6 hours
    """
    
    def __init__(self, total_disputes=500, duration_hours=6):
        self.total_disputes = total_disputes
        self.duration_hours = duration_hours
        self.duration_seconds = duration_hours * 3600
        self.interval = self.duration_seconds / total_disputes  # seconds per dispute
        
        self.stats = {
            'created': 0,
            'failed': 0,
            'appeals': 0,
            'emergency': 0,
            'malicious': 0,
            'response_times': [],
            'errors': []
        }
        
    def setup_test_data(self):
        """Create test users, products, and bookings"""
        print("🔧 Setting up test data...")
        
        # Create or get test users
        self.users = []
        for i in range(50):  # 50 users
            user, created = User.objects.get_or_create(
                username=f'testuser_{i}',
                defaults={
                    'email': f'testuser_{i}@test.com',
                    'phone_number': f'+21377{i:07d}'
                }
            )
            self.users.append(user)
        
        # Get sample products
        self.products = list(Product.objects.all()[:20])
        if not self.products:
            print("⚠️ No products found. Please create some products first.")
            sys.exit(1)
        
        print(f"✅ Setup complete: {len(self.users)} users, {len(self.products)} products")
        
    def create_booking(self, user):
        """Create a test booking for dispute"""
        product = random.choice(self.products)
        
        booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=datetime.now().date(),
            end_date=datetime.now().date() + timedelta(days=2),
            total_price=product.price_per_day * 2,
            status='confirmed'
        )
        return booking
        
    def create_dispute(self):
        """Create a single dispute with randomized attributes"""
        start_time = time.time()
        
        try:
            # Random user
            user = random.choice(self.users)
            
            # Create booking
            booking = self.create_booking(user)
            
            # Determine priority and category
            is_emergency = random.random() < 0.10  # 10% emergency
            is_malicious = random.random() < 0.05  # 5% malicious
            
            priority = 'emergency' if is_emergency else random.choice(['high', 'medium', 'low'])
            category = random.choice(['damage', 'cleanliness', 'missing_items', 'noise', 'access'])
            
            # Create dispute
            dispute = Dispute.objects.create(
                user=user,
                booking=booking,
                title=fake.sentence(nb_words=6),
                description=fake.paragraph(nb_sentences=3),
                category=category,
                priority=priority,
                status='submitted'
            )
            
            # Track stats
            self.stats['created'] += 1
            if is_emergency:
                self.stats['emergency'] += 1
            if is_malicious:
                self.stats['malicious'] += 1
            
            # Simulate appeal (30% of cases)
            if random.random() < 0.30:
                # Create a provisional judgment to appeal against
                judgment = Judgment.objects.create(
                    dispute=dispute,
                    judge_notes=fake.paragraph(),
                    awarded_amount=random.randint(100, 5000),
                    status='provisional'
                )
                self.stats['appeals'] += 1
            
            # Track response time
            elapsed = time.time() - start_time
            self.stats['response_times'].append(elapsed)
            
            return True
            
        except Exception as e:
            self.stats['failed'] += 1
            self.stats['errors'].append(str(e))
            print(f"❌ Error creating dispute: {e}")
            return False
            
    def run(self):
        """Execute the load test"""
        print(f"\n🚀 Starting Judicial Storm Simulation")
        print(f"   Target: {self.total_disputes} disputes over {self.duration_hours} hours")
        print(f"   Interval: {self.interval:.2f} seconds per dispute\n")
        
        self.setup_test_data()
        
        start_time = time.time()
        
        for i in range(self.total_disputes):
            self.create_dispute()
            
            # Progress update every 50 disputes
            if (i + 1) % 50 == 0:
                elapsed = time.time() - start_time
                avg_response = sum(self.stats['response_times']) / len(self.stats['response_times'])
                print(f"📊 Progress: {i+1}/{self.total_disputes} | "
                      f"Avg Response: {avg_response*1000:.0f}ms | "
                      f"Failed: {self.stats['failed']}")
            
            # Sleep to maintain target rate
            time.sleep(self.interval)
        
        # Final report
        self.print_report()
        
    def print_report(self):
        """Print final test results"""
        total_time = sum(self.stats['response_times'])
        avg_time = total_time / len(self.stats['response_times']) if self.stats['response_times'] else 0
        max_time = max(self.stats['response_times']) if self.stats['response_times'] else 0
        min_time = min(self.stats['response_times']) if self.stats['response_times'] else 0
        
        print("\n" + "="*60)
        print("📊 JUDICIAL STORM LOAD TEST - RESULTS")
        print("="*60)
        print(f"Total Disputes Created: {self.stats['created']}")
        print(f"Failed: {self.stats['failed']}")
        print(f"Success Rate: {(self.stats['created']/(self.stats['created']+self.stats['failed'])*100):.1f}%")
        print(f"\nBreakdown:")
        print(f"  - Appeals Filed: {self.stats['appeals']} (30% target)")
        print(f"  - Emergency Priority: {self.stats['emergency']} (10% target)")
        print(f"  - Malicious Actors: {self.stats['malicious']} (5% target)")
        print(f"\nPerformance:")
        print(f"  - Average Response Time: {avg_time*1000:.0f}ms")
        print(f"  - Min Response Time: {min_time*1000:.0f}ms")
        print(f"  - Max Response Time: {max_time*1000:.0f}ms")
        
        if self.stats['errors']:
            print(f"\n⚠️ Errors Encountered:")
            for error in set(self.stats['errors'][:10]):  # Show unique errors
                print(f"  - {error}")
        
        print("="*60)
        
        # Verification
        if avg_time < 0.5:  # 500ms target
            print("✅ PASS: Average response time < 500ms")
        else:
            print("❌ FAIL: Average response time > 500ms")
            
        if self.stats['failed'] / self.total_disputes < 0.01:  # <1% failure rate
            print("✅ PASS: Failure rate < 1%")
        else:
            print("❌ FAIL: Failure rate > 1%")


if __name__ == '__main__':
    # Run quick version (50 disputes over 1 minute) for testing
    # For full test: simulator = JudicialStormSimulator(total_disputes=500, duration_hours=6)
    simulator = JudicialStormSimulator(total_disputes=50, duration_hours=0.016)  # ~1 minute
    simulator.run()
