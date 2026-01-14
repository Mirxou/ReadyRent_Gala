"""
Security configuration and utilities
"""
from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
import re
import os


class SecurityValidator:
    """Security validation utilities"""
    
    @staticmethod
    def validate_password_strength(password):
        """
        Validate password strength
        Requirements:
        - At least 8 characters
        - At least one uppercase letter
        - At least one lowercase letter
        - At least one number
        - At least one special character
        """
        if len(password) < 8:
            raise ValidationError("Password must be at least 8 characters long")
        
        if not re.search(r'[A-Z]', password):
            raise ValidationError("Password must contain at least one uppercase letter")
        
        if not re.search(r'[a-z]', password):
            raise ValidationError("Password must contain at least one lowercase letter")
        
        if not re.search(r'\d', password):
            raise ValidationError("Password must contain at least one number")
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValidationError("Password must contain at least one special character")
        
        return True
    
    @staticmethod
    def validate_file_upload(file, allowed_types=None, max_size_mb=10):
        """
        Validate file upload
        """
        if allowed_types is None:
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
        
        # Check file type
        if file.content_type not in allowed_types:
            raise ValidationError(f"File type {file.content_type} is not allowed. Allowed types: {allowed_types}")
        
        # Check file size (default 10MB)
        max_size_bytes = max_size_mb * 1024 * 1024
        if file.size > max_size_bytes:
            raise ValidationError(f"File size exceeds {max_size_mb}MB limit")
        
        # Check file extension
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf']
        file_extension = os.path.splitext(file.name)[1].lower()
        if file_extension not in allowed_extensions:
            raise ValidationError(f"File extension {file_extension} is not allowed")
        
        return True
    
    @staticmethod
    def sanitize_input(input_string):
        """
        Basic input sanitization
        Note: Django templates auto-escape, but this is for API responses
        """
        if not isinstance(input_string, str):
            return input_string
        
        # Remove null bytes
        input_string = input_string.replace('\x00', '')
        
        # Remove control characters except newlines and tabs
        input_string = re.sub(r'[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]', '', input_string)
        
        return input_string


class SecurityConfig:
    """Security configuration checker"""
    
    @staticmethod
    def check_production_settings():
        """
        Check if production security settings are enabled
        """
        issues = []
        
        if settings.DEBUG:
            issues.append("DEBUG is enabled - should be False in production")
        
        if not settings.SECURE_SSL_REDIRECT:
            issues.append("SECURE_SSL_REDIRECT is disabled - should be True in production")
        
        if not settings.SESSION_COOKIE_SECURE:
            issues.append("SESSION_COOKIE_SECURE is disabled - should be True in production")
        
        if not settings.CSRF_COOKIE_SECURE:
            issues.append("CSRF_COOKIE_SECURE is disabled - should be True in production")
        
        if 'localhost' in settings.ALLOWED_HOSTS or '127.0.0.1' in settings.ALLOWED_HOSTS:
            if len(settings.ALLOWED_HOSTS) == 2:
                issues.append("ALLOWED_HOSTS contains only localhost - should include production domain")
        
        if settings.SECRET_KEY == 'django-insecure-change-me-in-production':
            issues.append("SECRET_KEY is using default value - must be changed in production")
        
        return issues
    
    @staticmethod
    def check_cors_settings():
        """Check CORS settings"""
        issues = []
        
        if '*' in settings.CORS_ALLOWED_ORIGINS:
            issues.append("CORS_ALLOWED_ORIGINS contains '*' - should be specific domains in production")
        
        if settings.CORS_ALLOW_CREDENTIALS and '*' in settings.CORS_ALLOWED_ORIGINS:
            issues.append("CORS_ALLOW_CREDENTIALS is True with wildcard origins - security risk")
        
        return issues

