
import pytest
from django.contrib.auth import get_user_model
from apps.disputes.models import EvidenceLog
from django.db import IntegrityError

User = get_user_model()

@pytest.fixture
def black_box_setup(db):
    user = User.objects.create_user(
        username="auditor",
        email="audit@gala.rent",
        password="testpassword"
    )
    return user

@pytest.mark.django_db
class TestEvidenceBlackBox:
    """Verifies the integrity and immutability of the Evidence Vault."""

    def test_log_is_immutable(self, black_box_setup):
        """Verifies that once a log is written, it cannot be updated."""
        user = black_box_setup
        log = EvidenceLog.objects.create(
            action="INITIAL_LOG",
            actor=user,
            metadata={"status": "sealed"}
        )
        
        # Attempt to modify
        log.action = "TAMPERED_LOG"
        with pytest.raises(ValueError) as excinfo:
            log.save()
        
        assert "The Evidence Vault is Immutable" in str(excinfo.value)
        
        # Verify DB content remains unchanged
        log.refresh_from_db()
        assert log.action == "INITIAL_LOG"

    def test_integrity_hashing(self, black_box_setup):
        """Verifies that logs are automatically hashed using BLAKE2b."""
        user = black_box_setup
        log = EvidenceLog.objects.create(
            action="HASH_TRIAL",
            actor=user,
            metadata={"test": "data"}
        )
        
        assert log.hash is not None
        assert len(log.hash) > 0
        
        # Verify hash matches predictable payload
        expected_hash = log.generate_integrity_hash()
        assert log.hash == expected_hash

    def test_cryptographic_chaining(self, black_box_setup):
        """Verifies that sequential logs are linked via previous_hash."""
        user = black_box_setup
        
        # Log 1
        log1 = EvidenceLog.objects.create(action="LOG_ALPHA", actor=user)
        # Log 2
        log2 = EvidenceLog.objects.create(action="LOG_BETA", actor=user)
        # Log 3
        log3 = EvidenceLog.objects.create(action="LOG_GAMMA", actor=user)
        
        assert log2.previous_hash == log1.hash
        assert log3.previous_hash == log2.hash
        assert log1.previous_hash is None or log1.previous_hash != log2.hash

    def test_metadata_impacts_hash(self, black_box_setup):
        """Verifies that changing metadata changes the generated hash."""
        user = black_box_setup
        
        log_a = EvidenceLog(action="LOG", actor=user, metadata={"v": 1})
        hash_a = log_a.generate_integrity_hash()
        
        log_b = EvidenceLog(action="LOG", actor=user, metadata={"v": 2})
        hash_b = log_b.generate_integrity_hash()
        
        assert hash_a != hash_b
