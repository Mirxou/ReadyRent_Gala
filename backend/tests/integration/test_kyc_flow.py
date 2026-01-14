"""
Integration tests for KYC verification flow
"""
import pytest
from django.contrib.auth import get_user_model
from apps.users.models import VerificationStatus, IdentityDocument
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.mark.integration
@pytest.mark.django_db
class TestKYCVerificationFlow:
    """Test complete KYC verification flow"""
    
    def test_kyc_submission_flow(self, regular_user):
        """Test: User submits KYC documents -> Status changes -> Admin reviews"""
        
        # 1. User submits verification request
        verification = VerificationStatus.objects.create(
            user=regular_user,
            status='submitted',
            id_type='national_id',
            id_number='1234567890'
        )
        
        assert verification.status == 'submitted'
        assert verification.user == regular_user
        
        # 2. Admin reviews (simulate admin action)
        verification.status = 'under_review'
        verification.save()
        assert verification.status == 'under_review'
        
        # 3. Admin approves
        admin_user = User.objects.create_user(
            email='admin@test.com',
            password='admin123',
            username='admin',
            role='admin',
            is_staff=True
        )
        
        verification.status = 'verified'
        verification.verified_by = admin_user
        verification.save()
        
        assert verification.status == 'verified'
        assert verification.verified_by == admin_user
        
        # 4. User is now verified
        regular_user.refresh_from_db()
        # Note: You might need to sync verification status to user.is_verified
        # This depends on your implementation
    
    def test_kyc_rejection_flow(self, regular_user):
        """Test: User submits KYC -> Admin rejects -> User can resubmit"""
        
        verification = VerificationStatus.objects.create(
            user=regular_user,
            status='submitted',
            id_type='national_id',
            id_number='1234567890'
        )
        
        # Admin rejects
        verification.status = 'rejected'
        verification.rejection_reason = 'Invalid ID document'
        verification.save()
        
        assert verification.status == 'rejected'
        assert verification.rejection_reason == 'Invalid ID document'
        
        # User can resubmit
        verification.status = 'submitted'
        verification.rejection_reason = ''
        verification.save()
        
        assert verification.status == 'submitted'
    
    def test_blacklist_user(self, regular_user):
        """Test: User is blacklisted -> Cannot make bookings"""
        
        verification = VerificationStatus.objects.create(
            user=regular_user,
            status='verified',
            is_blacklisted=True,
            blacklist_reason='Suspicious activity'
        )
        
        assert verification.is_blacklisted
        assert verification.blacklist_reason == 'Suspicious activity'
        
        # User should not be able to make bookings
        # This would be tested in booking view tests

