
import os
import django
from django.db.models import Count

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.contracts.models import Contract

duplicates = Contract.objects.values('contract_hash').annotate(count=Count('contract_hash')).filter(count__gt=1)

if duplicates.exists():
    print("❌ DUPLICATE HASHES FOUND:")
    for d in duplicates:
        print(f"Hash: {d['contract_hash']} - Count: {d['count']}")
else:
    print("✅ NO DUPLICATE HASHES FOUND. Safe to add unique constraint.")
