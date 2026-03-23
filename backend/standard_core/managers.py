from django.contrib.auth.models import BaseUserManager
from django.utils.translation import gettext_lazy as _

class UserManager(BaseUserManager):
    """
    Sovereign User Manager.
    Enforces 'email' as the identifier and requires 'phone_number'.
    Maps to SOVEREIGN_ERD requirements.
    """
    def create_user(self, email, phone_number, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        if not phone_number:
            raise ValueError(_('The Phone Number must be set'))
        
        email = self.normalize_email(email)
        user = self.model(email=email, phone_number=phone_number, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, phone_number, password, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        extra_fields.setdefault('is_verified', True) # Root should be verified by definition

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser must have is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser must have is_superuser=True.'))
            
        return self.create_user(email, phone_number, password, **extra_fields)
