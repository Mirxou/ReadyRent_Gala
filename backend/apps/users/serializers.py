"""
Serializers for User app
"""
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import (
    User, UserProfile, VerificationStatus, Blacklist,
    StaffRole, ActivityLog, Shift, PerformanceReview
)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile"""
    class Meta:
        model = UserProfile
        fields = [
            'first_name_ar', 'last_name_ar', 'address', 'city',
            'postal_code', 'date_of_birth', 'preferred_language'
        ]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User"""
    profile = UserProfileSerializer(read_only=True)
    password = serializers.CharField(write_only=True, required=False, validators=[validate_password])
    
    trust_score = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'phone', 'role', 'avatar',
            'is_verified', 'trust_score', 'profile', 'password', 'created_at'
        ]
        read_only_fields = ['id', 'is_verified', 'created_at']
    
    def get_trust_score(self, obj):
        try:
            if hasattr(obj, 'verification'):
                # If not verified, trust is capped at 20
                if obj.verification.status != 'verified':
                    return 20
                # Trust = 100 - Risk (Risk 0 = Trust 100)
                return max(0, 100 - obj.verification.risk_score)
            return 0
        except Exception:
            return 0

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    """Serializer for password reset request"""
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    """Serializer for password reset confirmation"""
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs


class RegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'password_confirm', 'phone']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        UserProfile.objects.create(user=user)
        # Create verification status (get_or_create to handle signal race condition)
        VerificationStatus.objects.get_or_create(user=user)
        return user


class VerificationStatusSerializer(serializers.ModelSerializer):
    """Serializer for Verification Status"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)
    
    class Meta:
        model = VerificationStatus
        fields = [
            'id', 'user', 'user_email', 'status', 'id_type', 'id_number',
            'id_front_image', 'id_back_image', 'phone_verified',
            'address_verified', 'risk_score', 'is_blacklisted',
            'blacklist_reason', 'verified_at', 'verified_by', 'verified_by_email',
            'rejection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'phone_verified', 'risk_score', 'verified_at',
            'verified_by', 'created_at', 'updated_at'
        ]


class PhoneVerificationSerializer(serializers.Serializer):
    """Serializer for phone verification"""
    code = serializers.CharField(max_length=10, required=True)
    
    def validate_code(self, value):
        if not value.isdigit():
            raise serializers.ValidationError('Code must contain only digits')
        return value


class AddressVerificationSerializer(serializers.Serializer):
    """Serializer for address verification"""
    address = serializers.CharField(required=True)
    city = serializers.CharField(required=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)


from apps.core.utils.image_firewall import ImageFirewall

class IDUploadSerializer(serializers.ModelSerializer):
    """Serializer for ID upload with Image Firewall protection"""
    selfie = serializers.ImageField(required=True)
    
    class Meta:
        model = VerificationStatus
        fields = ['id_type', 'id_number', 'id_front_image', 'id_back_image', 'selfie']
    
    def validate_id_number(self, value):
        if not value:
            raise serializers.ValidationError('ID number is required')
        return value

    def validate(self, attrs):
        # 1. Scrub EXIF & Compress Images
        if 'id_front_image' in attrs:
            attrs['id_front_image'] = ImageFirewall.scrub_exif(attrs['id_front_image'])
            attrs['id_front_image'] = ImageFirewall.compress_image(attrs['id_front_image'])
            
        if 'id_back_image' in attrs:
            attrs['id_back_image'] = ImageFirewall.scrub_exif(attrs['id_back_image'])
            attrs['id_back_image'] = ImageFirewall.compress_image(attrs['id_back_image'])

        if 'selfie' in attrs:
            attrs['selfie'] = ImageFirewall.scrub_exif(attrs['selfie'])
            attrs['selfie'] = ImageFirewall.compress_image(attrs['selfie'])

        # 2. Identity Verification (Face Match)
        # Only run if both ID Front and Selfie are provided
        if 'id_front_image' in attrs and 'selfie' in attrs:
            # Note: Verification might take time, consider async task in production
            is_match, message = ImageFirewall.verify_identity(
                attrs['id_front_image'], 
                attrs['selfie']
            )
            # Reset file pointers after reading in verify_identity
            if hasattr(attrs['id_front_image'], 'seek'): attrs['id_front_image'].seek(0)
            if hasattr(attrs['selfie'], 'seek'): attrs['selfie'].seek(0)
            
            if not is_match:
                raise serializers.ValidationError({"selfie": f"Identity Verification Failed: {message}"})

        return attrs


class BlacklistSerializer(serializers.ModelSerializer):
    """Serializer for Blacklist"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    added_by_email = serializers.EmailField(source='added_by.email', read_only=True)
    
    class Meta:
        model = Blacklist
        fields = [
            'id', 'user', 'user_email', 'reason', 'added_by', 'added_by_email',
            'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'added_by', 'created_at']


class StaffRoleSerializer(serializers.ModelSerializer):
    """Serializer for StaffRole"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name_ar', read_only=True)
    assigned_by_email = serializers.EmailField(source='assigned_by.email', read_only=True)
    
    class Meta:
        model = StaffRole
        fields = [
            'id', 'user', 'user_email', 'user_name', 'role', 'branch', 'branch_name',
            'department', 'is_active', 'assigned_at', 'assigned_by', 'assigned_by_email'
        ]
        read_only_fields = ['id', 'assigned_at']
    
    def get_user_name(self, obj):
        if obj.user.profile:
            return f"{obj.user.profile.first_name_ar} {obj.user.profile.last_name_ar}".strip()
        return obj.user.email


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for ActivityLog"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'user', 'user_email', 'user_name', 'action', 'model_name',
            'object_id', 'description', 'ip_address', 'user_agent', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_user_name(self, obj):
        if obj.user and obj.user.profile:
            return f"{obj.user.profile.first_name_ar} {obj.user.profile.last_name_ar}".strip()
        return obj.user.email if obj.user else 'System'


class ShiftSerializer(serializers.ModelSerializer):
    """Serializer for Shift"""
    staff_email = serializers.EmailField(source='staff.email', read_only=True)
    staff_name = serializers.SerializerMethodField()
    branch_name = serializers.CharField(source='branch.name_ar', read_only=True)
    
    class Meta:
        model = Shift
        fields = [
            'id', 'staff', 'staff_email', 'staff_name', 'branch', 'branch_name',
            'shift_date', 'start_time', 'end_time', 'is_completed', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_staff_name(self, obj):
        if obj.staff.profile:
            return f"{obj.staff.profile.first_name_ar} {obj.staff.profile.last_name_ar}".strip()
        return obj.staff.email


class PerformanceReviewSerializer(serializers.ModelSerializer):
    """Serializer for PerformanceReview"""
    staff_email = serializers.EmailField(source='staff.email', read_only=True)
    staff_name = serializers.SerializerMethodField()
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PerformanceReview
        fields = [
            'id', 'staff', 'staff_email', 'staff_name', 'reviewed_by', 'reviewed_by_email',
            'reviewed_by_name', 'review_period_start', 'review_period_end',
            'overall_rating', 'punctuality_rating', 'quality_rating', 'communication_rating',
            'strengths', 'areas_for_improvement', 'goals', 'comments', 'reviewed_at'
        ]
        read_only_fields = ['id', 'reviewed_at']
    
    def get_staff_name(self, obj):
        if obj.staff.profile:
            return f"{obj.staff.profile.first_name_ar} {obj.staff.profile.last_name_ar}".strip()
        return obj.staff.email
    
    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by and obj.reviewed_by.profile:
            return f"{obj.reviewed_by.profile.first_name_ar} {obj.reviewed_by.profile.last_name_ar}".strip()
        return obj.reviewed_by.email if obj.reviewed_by else None

