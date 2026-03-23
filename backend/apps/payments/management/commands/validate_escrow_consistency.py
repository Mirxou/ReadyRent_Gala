from django.core.management.base import BaseCommand
from apps.bookings.models import Booking
from apps.payments.states import EscrowState

class Command(BaseCommand):
    help = 'Validate consistency between Booking.escrow_status and EscrowHold.state'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting Escrow Consistency Check...'))
        
        inconsistent_count = 0
        bookings = Booking.objects.select_related('escrow_hold').all()
        
        for booking in bookings:
            if not hasattr(booking, 'escrow_hold'):
                # Orphaned bookings (valid in Phase 2 transition if unpaid)
                continue
                
            canonical_state = booking.escrow_hold.state
            cached_status = booking.escrow_status
            
            # Map canonical to legacy for comparison
            expected_status = 'UNKNOWN'
            if canonical_state == EscrowState.HELD:
                expected_status = 'HELD'
            elif canonical_state == EscrowState.RELEASED:
                expected_status = 'RELEASED'
            elif canonical_state == EscrowState.REFUNDED:
                expected_status = 'REFUNDED'
            elif canonical_state == EscrowState.DISPUTED:
                expected_status = 'DISPUTED'
            elif canonical_state == EscrowState.PENDING:
                expected_status = 'INITIATED'
                
            if cached_status != expected_status:
                self.stdout.write(self.style.ERROR(
                    f"[MISMATCH] Booking {booking.id}: "
                    f"Hold State={canonical_state} ({expected_status}) != "
                    f"Booking Status={cached_status}"
                ))
                inconsistent_count += 1
                
        if inconsistent_count == 0:
            self.stdout.write(self.style.SUCCESS('✅ All Escrow States are Consistent!'))
        else:
            self.stdout.write(self.style.ERROR(f'❌ Found {inconsistent_count} inconsistent records.'))
