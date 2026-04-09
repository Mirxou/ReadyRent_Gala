"""
Sovereign Verification Service
Handles multi-tier KYC transitions and biometric face matching simulations.
Ref: AUDIT_BASELINE.md §12.2 GAP-02
"""
import logging
from django.db import transaction
from django.utils import timezone
from apps.users.models import VerificationStatus, VerificationLevel, FaceVerification, IdentityDocument, BusinessProfile, UserProfile
from apps.disputes.models import EvidenceLog

logger = logging.getLogger("apps.users.verification")

class VerificationService:
    @staticmethod
    def upgrade_verification_level(user, target_level, actor=None):
        """
        Upgrades a user's status level (Basic -> Standard -> Premium).
        Enforces prerequisites for each level.
        """
        v_status, _ = VerificationStatus.objects.get_or_create(user=user)
        v_level, _ = VerificationLevel.objects.get_or_create(user=user)

        if v_level.level == target_level:
            return v_level, "Already at this level."

        # PREREQUISITES
        if target_level == 'standard':
            identity_document, _ = IdentityDocument.objects.get_or_create(user=user)
            if not v_status.phone_verified or not (v_status.id_front_image or identity_document.front_image):
                raise ValueError("Phone and ID verification required for Standard level.")
        
        if target_level == 'premium':
            # Premium requires Face Matching to be successful
            face_ok = hasattr(v_status, 'face_verification') and v_status.face_verification.status == 'matched'
            business_profile, _ = BusinessProfile.objects.get_or_create(user=user)
            kyb_ok = business_profile.status == 'verified'
            if not face_ok and not kyb_ok:
                raise ValueError("Face matching or KYB verification required for Premium level.")

        with transaction.atomic():
            old_level = v_level.level
            v_level.level = target_level
            v_level.upgraded_at = timezone.now()
            v_level.upgraded_by = actor
            v_level.save()

            if target_level in ('standard', 'premium'):
                v_status.status = 'verified'
                v_status.verified_at = timezone.now()
                v_status.save()

            # 🔐 Audit the upgrade in the Evidence Vault (WORM)
            EvidenceLog.objects.create(
                action='KYC_LEVEL_UPGRADE',
                actor=actor or user,
                metadata={
                    'user_id': user.id,
                    'old_level': old_level,
                    'new_level': target_level,
                    'limit': v_level.transaction_limit
                }
            )

        logger.info(f"User {user.email} upgraded to {target_level} by {actor.email if actor else 'System'}")
        return v_level, f"Successfully upgraded to {target_level}."

    @staticmethod
    def perform_face_matching(user, actor=None):
        """
        Sovereign AI Simulator: Matches ID selfie with ID card image.
        In production, this would call a biometric provider (DeepFace/AWS Rekognition).
        """
        v_status, _ = VerificationStatus.objects.get_or_create(user=user)
        if not v_status.selfie or not v_status.id_front_image:
            raise ValueError("Missing images for face matching.")

        face_v, _ = FaceVerification.objects.get_or_create(verification=v_status)
        
        # SIMULATION LOGIC: If images exist, we "match" them. 
        # For a masterpiece feel, we simulate a 'processing' delay in the real view, 
        # but here we set the result.
        
        with transaction.atomic():
            profile, _ = UserProfile.objects.get_or_create(user=user)
            face_v.status = 'matched'
            face_v.processed_at = timezone.now()
            # Generate a Mock AI Identifier
            face_v.face_id = f"SOV-AI-MATCH-{user.id}-{timezone.now().timestamp()}"
            face_v.save()

            v_status.status = 'verified'
            v_status.verified_at = timezone.now()
            v_status.save()

            identity_document, _ = IdentityDocument.objects.get_or_create(user=user)
            identity_document.status = 'verified'
            identity_document.age_verified = bool(getattr(profile, 'is_adult', False))
            identity_document.verified_at = timezone.now()
            identity_document.save(update_fields=['status', 'age_verified', 'verified_at', 'updated_at'])

            # Record in Evidence Vault
            EvidenceLog.objects.create(
                action='BIOMETRIC_FACE_MATCH',
                actor=actor or user,
                metadata={
                    'user_id': user.id,
                    'status': 'matched',
                    'provider': 'Sovereign-AI-Beta'
                }
            )

        logger.info(f"Face Matching SUCCESS for User {user.email}")
        return face_v

    @staticmethod
    def verify_business_profile(user, data, actor=None):
        """Approve KYB record for a business user."""
        business_profile, _ = BusinessProfile.objects.get_or_create(user=user)
        business_profile.business_name = data.get('business_name', business_profile.business_name)
        business_profile.commercial_register_number = data.get('commercial_register_number', business_profile.commercial_register_number)
        business_profile.tax_id = data.get('tax_id', business_profile.tax_id)
        business_profile.nis_number = data.get('nis_number', business_profile.nis_number)
        business_profile.legal_representative_name = data.get('legal_representative_name', business_profile.legal_representative_name)
        business_profile.legal_representative_id = data.get('legal_representative_id', business_profile.legal_representative_id)
        business_profile.address = data.get('address', business_profile.address)
        business_profile.city = data.get('city', business_profile.city)
        business_profile.status = 'verified'
        business_profile.verified_at = timezone.now()
        business_profile.verified_by = actor
        business_profile.save()

        logger.info(f"KYB SUCCESS for User {user.email}")
        return business_profile
