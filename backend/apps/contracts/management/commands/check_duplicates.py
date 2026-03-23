
from django.core.management.base import BaseCommand
from django.db.models import Count
from apps.contracts.models import Contract

class Command(BaseCommand):
    help = 'Checks for duplicate contract hashes'

    def handle(self, *args, **options):
        duplicates = Contract.objects.values('contract_hash').annotate(count=Count('contract_hash')).filter(count__gt=1)
        
        if duplicates.exists():
            self.stdout.write(self.style.ERROR("❌ DUPLICATE HASHES FOUND:"))
            for d in duplicates:
                self.stdout.write(f"Hash: {d['contract_hash']} - Count: {d['count']}")
        else:
            self.stdout.write(self.style.SUCCESS("✅ NO DUPLICATE HASHES FOUND. Safe to add unique constraint."))
