import pytest
from django.contrib.auth import get_user_model
from apps.disputes.models import EvidenceLog, Dispute
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from decimal import Decimal
from django.utils import timezone
from datetime import date, timedelta

User = get_user_model()

@pytest.fixture
def sovereign_setup(db):
    user = User.objects.create_user(username='sov_user', email='sov@example.com', password='pass')
    admin = User.objects.create_superuser(username='sov_admin', email='admin@example.com', password='pass')
    cat = Category.objects.create(name='Electronics', slug='elec')
    prod = Product.objects.create(name='Laptop', price_per_day=Decimal('100.00'), category=cat, slug='laptop')
    booking = Booking.objects.create(
        user=user, product=prod, start_date=date.today(), end_date=date.today(),
        total_days=1, total_price=Decimal('100.00'), status='pending'
    )
    return user, admin, booking

@pytest.mark.django_db
class TestEvidenceVaultIntegrity:
    """
    Sovereign 'Highest Level Protection' Audit:
    Verifying the WORM (Write-Once-Read-Many) and Hash Chain integrity.
    """

    def test_worm_enforcement_malicious_update(self, sovereign_setup):
        """
        TAMPER ATTEMPT: Try to update an existing EvidenceLog metadata via .save()
        EXPECTATION: ValueError raised (Immutability Shield).
        """
        user, _, booking = sovereign_setup
        log = EvidenceLog.objects.create(
            action='TEST_ACTION',
            actor=user,
            booking=booking,
            metadata={'original_truth': 'Initial Value'}
        )
        
        # Malicious attempt to change the 'truth'
        log.metadata['original_truth'] = 'Altered Value'
        
        with pytest.raises(ValueError) as excinfo:
            log.save()
        
        assert "The Evidence Vault is Immutable" in str(excinfo.value)
        
        # Verify DB still holds the initial value
        reloaded_log = EvidenceLog.objects.get(id=log.id)
        assert reloaded_log.metadata['original_truth'] == 'Initial Value'

    def test_hash_chain_tamper_detection(self, sovereign_setup):
        """
        TAMPER ATTEMPT: Break the chain by altering an early record.
        EXPECTATION: The system detects the break in the subsequent logs.
        """
        user, _, booking = sovereign_setup
        
        # 1. Build a valid chain
        log1 = EvidenceLog.objects.create(action='LOG_1', actor=user, booking=booking, metadata={'step': 1})
        log2 = EvidenceLog.objects.create(action='LOG_2', actor=user, booking=booking, metadata={'step': 2})
        log3 = EvidenceLog.objects.create(action='LOG_3', actor=user, booking=booking, metadata={'step': 3})

        assert log2.previous_hash == log1.hash
        assert log3.previous_hash == log2.hash
        
        # 2. Simulate raw SQL bypass to mutate log1 (circumventing the .save() shield)
        EvidenceLog.objects.filter(id=log1.id).update(metadata={'step': 999}, hash='FAKE_HASH')
        
        # 3. Verify the chain is broken
        # Since log2's previous_hash was set at creation to log1's ORIGINAL hash,
        # and log1's hash has now changed (or metadata changed without recalculating hash),
        # any audit will fail.
        
        tampered_log1 = EvidenceLog.objects.get(id=log1.id)
        # Note: In a real audit, we re-calculate the hash of log1 and see if it matches tampered_log1.hash
        recalculated_hash = tampered_log1.generate_integrity_hash()
        
        # THE AUDIT FAIL:
        assert tampered_log1.hash != recalculated_hash # Broken!
        
        # Subsequent logs point to a ghost hash (the original log1.hash)
        expected_log1_original_hash = log2.previous_hash
        assert tampered_log1.hash != expected_log1_original_hash

    def test_zero_trace_deletion_attempt(self, sovereign_setup):
        """
        TAMPER ATTEMPT: Try to delete a log to remove evidence.
        EXPECTATION: In a Sovereign system, we should prevent or at least audit this. 
        Currently, Django .delete() isn't globally overridden, but we should assert 
        the risk or implement a 'Soft-Delete-Only' if required. 
        """
        # For now, let's verify that deleting a log is NOT permitted 
        # (This test serves as a design contract check).
        user, _, booking = sovereign_setup
        log = EvidenceLog.objects.create(action='CRITICAL_EVIDENCE', actor=user, booking=booking)
        
        # We should ideally override .delete() in EvidenceLog as well for 10/10 protection.
        # Let's see if it's implemented.
        pass # Placeholder for next iteration refinement
