"""
Verification services for KYC
"""
import random
import string
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from .models import VerificationStatus, Blacklist, User


class VerificationService:
    """Service for handling KYC verification"""
    
    @staticmethod
    def generate_verification_code(length=6):
        """Generate random verification code"""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def send_sms_verification_code(phone_number, code):
        """Send SMS verification code via SMS service"""
        from .sms_service import SMSService
        
        result = SMSService.send_verification_code(phone_number, code)
        
        if result.get('success'):
            return True
        else:
            # Log error but don't fail verification process
            print(f"Error sending SMS: {result.get('error', 'Unknown error')}")
            # In development, still return True to allow testing
            # In production, you might want to return False or raise an exception
            from django.conf import settings
            if settings.DEBUG:
                return True
            return False
    
    @staticmethod
    def verify_phone_number(user, code):
        """Verify phone number with code"""
        try:
            verification = VerificationStatus.objects.get(user=user)
            
            # Check if code is expired
            if verification.phone_verification_expires and timezone.now() > verification.phone_verification_expires:
                return False, 'Code expired'
            
            # Check if code matches
            if verification.phone_verification_code != code:
                return False, 'Invalid code'
            
            # Mark as verified
            verification.phone_verified = True
            verification.phone_verification_code = ''
            verification.phone_verification_expires = None
            verification.save()
            
            return True, 'Phone verified successfully'
        except VerificationStatus.DoesNotExist:
            return False, 'Verification not found'
    
    @staticmethod
    def request_phone_verification(user):
        """Request phone verification code"""
        verification, created = VerificationStatus.objects.get_or_create(user=user)
        
        # Generate code
        code = VerificationService.generate_verification_code()
        expires_at = timezone.now() + timedelta(minutes=10)
        
        # Save code
        verification.phone_verification_code = code
        verification.phone_verification_expires = expires_at
        verification.save()
        
        # Send SMS
        if user.phone:
            VerificationService.send_sms_verification_code(user.phone, code)
        
        return code, expires_at
    
    @staticmethod
    def calculate_risk_score(user):
        """Calculate risk score for user (0-100)"""
        score = 0
        
        # Check verification status
        try:
            verification = VerificationStatus.objects.get(user=user)
            if verification.phone_verified:
                score += 20
            if verification.address_verified:
                score += 20
            if verification.id_front_image and verification.id_back_image:
                score += 30
            if verification.status == 'verified':
                score += 30
        except VerificationStatus.DoesNotExist:
            pass
        
        # Check blacklist
        if Blacklist.objects.filter(user=user, is_active=True).exists():
            score = 100  # Maximum risk
        
        # Check account age
        account_age_days = (timezone.now().date() - user.created_at.date()).days
        if account_age_days > 30:
            score -= 10  # Lower risk for older accounts
        elif account_age_days < 1:
            score += 20  # Higher risk for new accounts
        
        # Check booking history
        from apps.bookings.models import Booking
        booking_count = Booking.objects.filter(user=user).count()
        if booking_count > 0:
            score -= min(booking_count * 5, 20)  # Lower risk for users with booking history
        
        return max(0, min(100, score))
    
    @staticmethod
    def verify_address(user, address_data):
        """Verify user address"""
        verification, created = VerificationStatus.objects.get_or_create(user=user)
        
        # Update profile with address
        profile, _ = UserProfile.objects.get_or_create(user=user)
        profile.address = address_data.get('address', '')
        profile.city = address_data.get('city', 'Constantine')
        profile.postal_code = address_data.get('postal_code', '')
        profile.save()
        
        # Mark as verified (in production, integrate with address verification service)
        verification.address_verified = True
        verification.save()
        
        return True
    
    @staticmethod
    def check_blacklist(user):
        """Check if user is blacklisted"""
        return Blacklist.objects.filter(user=user, is_active=True).exists()
    
    @staticmethod
    def add_to_blacklist(user, reason, added_by):
        """Add user to blacklist"""
        blacklist_entry, created = Blacklist.objects.get_or_create(
            user=user,
            is_active=True,
            defaults={
                'reason': reason,
                'added_by': added_by
            }
        )
        
        # Update verification status
        verification, _ = VerificationStatus.objects.get_or_create(user=user)
        verification.is_blacklisted = True
        verification.blacklist_reason = reason
        verification.status = 'rejected'
        verification.save()
        
        return blacklist_entry
    
    @staticmethod
    def approve_verification(user, approved_by):
        """Approve user verification"""
        verification, created = VerificationStatus.objects.get_or_create(user=user)
        
        verification.status = 'verified'
        verification.verified_at = timezone.now()
        verification.verified_by = approved_by
        verification.save()
        
        # Update user verified status
        user.is_verified = True
        user.save()
        
        return verification
    
    @staticmethod
    def reject_verification(user, reason, rejected_by):
        """Reject user verification"""
        verification, created = VerificationStatus.objects.get_or_create(user=user)
        
        verification.status = 'rejected'
        verification.rejection_reason = reason
        verification.verified_by = rejected_by
        verification.save()
        
        return verification


