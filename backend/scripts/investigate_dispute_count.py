"""
Investigate Dispute.count() Performance Issue

This script analyzes why counting disputes takes 936ms for 1 record.
"""
import os
import sys
import django
import time
from django.db import connection

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.disputes.models import Dispute
from django.db import reset_queries

print("=" * 80)
print("INVESTIGATING: Dispute.count() Performance Issue")
print("=" * 80)
print()

# Test 1: Simple count with query logging
print("Test 1: Simple count() with SQL logging...")
reset_queries()

start = time.time()
count = Dispute.objects.count()
duration = (time.time() - start) * 1000

print(f"Result: {count} disputes in {duration:.2f}ms")
print(f"Queries executed: {len(connection.queries)}")
print()

if connection.queries:
    print("SQL Query:")
    print(connection.queries[0]['sql'])
    print(f"Time: {connection.queries[0]['time']}s")
print()

# Test 2: Count with all() explicit
print("Test 2: Count with .all()...")
reset_queries()

start = time.time()
count = Dispute.objects.all().count()
duration = (time.time() - start) * 1000

print(f"Result: {count} disputes in {duration:.2f}ms")
print(f"Queries executed: {len(connection.queries)}")
print()

# Test 3: Raw SQL count
print("Test 3: Raw SQL COUNT(*)...")
from django.db import connection

start = time.time()
with connection.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) FROM disputes_dispute")
    count = cursor.fetchone()[0]
duration = (time.time() - start) * 1000

print(f"Result: {count} disputes in {duration:.2f}ms")
print()

# Test 4: Check for any middleware/signals
print("Test 4: Checking for signals on Dispute model...")
from django.db.models import signals

signal_types = [
    ('pre_init', signals.pre_init),
    ('post_init', signals.post_init),
    ('pre_save', signals.pre_save),
    ('post_save', signals.post_save),
    ('pre_delete', signals.pre_delete),
    ('post_delete', signals.post_delete),
]

for signal_name, signal in signal_types:
    receivers = signal.receivers
    dispute_receivers = [r for r in receivers if 'dispute' in str(r).lower()]
    if dispute_receivers:
        print(f"  {signal_name}: {len(dispute_receivers)} receivers")

print()

# Test 5: Check indexes
print("Test 5: Analyzing table indexes...")
with connection.cursor() as cursor:
    cursor.execute("""
        SELECT name, sql 
        FROM sqlite_master 
        WHERE type='index' AND tbl_name='disputes_dispute'
    """)
    indexes = cursor.fetchall()
    
if indexes:
    print(f"Found {len(indexes)} indexes:")
    for idx_name, idx_sql in indexes:
        print(f"  - {idx_name}")
        if idx_sql:
            print(f"    {idx_sql}")
else:
    print("⚠️  NO INDEXES FOUND!")

print()
print("=" * 80)
print("DIAGNOSIS COMPLETE")
print("=" * 80)
