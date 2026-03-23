"""
Contract Service
Generates immutable digital evidence for bookings.
"""
import hashlib
import json
from django.utils import timezone
from .models import Contract

class ContractService:
    @staticmethod
    def create_contract(booking):
        """
        Creates a 'Smart Contract' snapshot of a booking.
        This freezes the state of the deal forever.
        """
        if hasattr(booking, 'contract'):
            return booking.contract

        # 1. Gather Data (The "Terms")
        snapshot_data = {
            'meta': {
                'contract_type': 'P2P_RENTAL_AGREEMENT',
                'version': '1.0',
                'timestamp': timezone.now().isoformat(),
                'platform': 'STANDARD.Rent',
            },
            'parties': {
                'renter': {
                    'id': booking.user.id,
                    'username': str(booking.user.username),
                    'email': str(booking.user.email),
                    'is_verified': bool(booking.user.is_verified)
                },
                'owner': {
                    'id': booking.product.owner.id,
                    'username': str(booking.product.owner.username),
                    'email': str(booking.product.owner.email),
                }
            },
            'asset': {
                'id': booking.product.id,
                'name': str(booking.product.name),
                'category': str(booking.product.category.slug),
                'condition': 'Defined in listing',
            },
            'terms': {
                'booking_id': booking.id,
                'start_date': booking.start_date.isoformat(),
                'end_date': booking.end_date.isoformat(),
                'total_days': (booking.end_date - booking.start_date).days,
                'price_per_day': float(booking.product.price_per_day),
                'currency': 'DZD'
            }
        }

        # 2. Serialize to Canonical JSON (Sorted Keys for consistent hashing)
        # using ensure_ascii=False to support Arabic characters in hash if needed, 
        # though IDs/slugs are safer for hash. formatting as string.
        json_str = json.dumps(snapshot_data, sort_keys=True, default=str)

        # 3. Sign (SHA-256 Hash)
        contract_hash = hashlib.sha256(json_str.encode('utf-8')).hexdigest()

        # 4. Mint the Contract
        contract = Contract.objects.create(
            booking=booking,
            snapshot=snapshot_data,
            contract_hash=contract_hash,
            version='1.0'
        )
        
        return contract

    @staticmethod
    def verify_integrity(contract):
        """
        Verifies that the database snapshot hasn't been tampered with.
        Re-calculates hash and compares with stored signature.
        """
        # Re-serialize stored snapshot
        json_str = json.dumps(contract.snapshot, sort_keys=True, default=str)
        current_hash = hashlib.sha256(json_str.encode('utf-8')).hexdigest()
        
        return current_hash == contract.contract_hash
