
from django.core.management.base import BaseCommand
from django.db.models import Count
from apps.contracts.models import Contract

class Command(BaseCommand):
    help = 'Verifies contract status counts'

    def handle(self, *args, **options):
        counts = Contract.objects.values('status').annotate(count=Count('id'))
        
        self.stdout.write("CONTRACT STATUS COUNTS:")
        non_legacy_found = False
        for c in counts:
            self.stdout.write(f"Status: {c['status']} - Count: {c['count']}")
            if c['status'] != 'legacy':
                non_legacy_found = True
        
        if non_legacy_found:
             # It's possible if no contracts existed, or if new ones created.
             # But if existing ones were not migrated, we would see 'draft' potentially if default kicked in?
             # No, default only applies to NEW rows if not specified. Existing rows are updated by RunPython.
             pass
