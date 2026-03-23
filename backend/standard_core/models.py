import uuid
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from .managers import UserManager as SovereignUserManager

class Constitution(models.Model):
    """
    The Living Law (Singleton).
    Configures the Global parameters of the Sovereign.
    """
    # Singleton Guard
    is_active = models.BooleanField(default=True) 
    
    # Global Kill Switch
    is_halted = models.BooleanField(default=False, help_text="Emergency Brake. Stops all logic.")
    
    # Economic Laws
    auto_approve_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("5000.00"))
    high_value_threshold = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("10000.00"))
    
    # Default Risk Parameters
    laws = models.JSONField(default=dict, blank=True, help_text="Dynamic configuration keys.")
    
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Constitution")
        verbose_name_plural = _("Constitution")

    def save(self, *args, **kwargs):
        self.__class__.objects.exclude(id=self.id).delete() # Enforce Singleton
        super().save(*args, **kwargs)

    @classmethod
    def get_solo(cls):
        obj, created = cls.objects.get_or_create(id=1)
        return obj

    def __str__(self):
        status = "HALTED" if self.is_halted else "ACTIVE"
        return f"Sovereign Constitution ({status})"

class User(AbstractBaseUser, PermissionsMixin):
    """
    The Sovereign User (Level 1 Entity).
    Maps directly to SOVEREIGN_ERD.mermaid.
    
    Attributes:
        id (UUID): The Sovereign ID.
        email (String): Unique Identifier.
        phone_number (String): Verified contact.
        is_verified (Boolean): Identity Shield Status.
        trust_score (Decimal): 0-100 (Risk Engine).
        device_fingerprint (JSON): Security Binding.
        date_joined (DateTime): Immutable timestamp.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(_('email address'), unique=True)
    phone_number = models.CharField(_('phone number'), max_length=20, unique=True)
    
    # Identity Shield
    is_verified = models.BooleanField(_('verified identity'), default=False)
    
    # Risk Engine Interface
    trust_score = models.DecimalField(
        _('trust score'), 
        max_digits=5, 
        decimal_places=2, 
        default=50.00
    )
    
    # Security
    device_fingerprint = models.JSONField(default=dict, blank=True)
    
    # Classification (Sovereign Pivot)
    class BusinessMode(models.TextChoices):
        PERSONAL = 'PERSONAL', _('Personal (Freelancer)')
        PROFESSIONAL = 'PROFESSIONAL', _('Professional (Auto-Entrepreneur)')

    business_mode = models.CharField(
        max_length=20,
        choices=BusinessMode.choices,
        default=BusinessMode.PERSONAL
    )

    # Metadata
    date_joined = models.DateTimeField(default=timezone.now)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)

    objects = SovereignUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['phone_number']

    # Fix clash with standard auth.User
    groups = models.ManyToManyField(
        'auth.Group',
        verbose_name=_('groups'),
        blank=True,
        help_text=_(
            'The groups this user belongs to. A user will get all permissions '
            'granted to each of their groups.'
        ),
        related_name="sovereign_user_set",
        related_query_name="sovereign_user",
    )
    user_permissions = models.ManyToManyField(
        'auth.Permission',
        verbose_name=_('user permissions'),
        blank=True,
        help_text=_('Specific permissions for this user.'),
        related_name="sovereign_user_set",
        related_query_name="sovereign_user",
    )



# ==========================================
# 2. ASSET CORE (POLYMORPHIC BASE)
# ==========================================
class Asset(models.Model):
    """
    The Base Asset Entity (Level 2).
    - Can be anything: Dress, Car, Excavator.
    - Owned by a User (P2P).
    - Polymorphic Parent.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(User, on_delete=models.PROTECT, related_name="assets")
    
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    # Classification
    # Note: 'vertical_type' is a logical grouper, but the code relies on OneToOne links (Specs).
    # We keep it for fast filtering without joins.
    class VerticalType(models.TextChoices):
        FASHION = 'FASHION', _('Fashion & Events')
        VEHICLE = 'VEHICLE', _('Vehicles')
        REAL_ESTATE = 'REAL_ESTATE', _('Real Estate')
        EQUIPMENT = 'EQUIPMENT', _('Equipment')
        GENERIC = 'GENERIC', _('Other')

    vertical_type = models.CharField(
        max_length=20,
        choices=VerticalType.choices,
        default=VerticalType.GENERIC
    )

    # Status
    class Status(models.TextChoices):
        DRAFT = 'DRAFT', _('Draft')
        ACTIVE = 'ACTIVE', _('Active')
        RENTED = 'RENTED', _('Rented')
        MAINTENANCE = 'MAINTENANCE', _('Maintenance')
        ARCHIVED = 'ARCHIVED', _('Archived')

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT
    )

    # Economics
    daily_price = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='DZD')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.vertical_type})"


# ==========================================
# 2.1 VERTICAL EXTENSIONS (SPECS)
# ==========================================

class FashionSpec(models.Model):
    """
    Vertical Extension: Fashion.
    Linked 1:1 to Asset.
    """
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, primary_key=True)
    
    # Specific Attributes
    size = models.CharField(max_length=10) # S, M, L, XL
    brand = models.CharField(max_length=50)
    material = models.CharField(max_length=50, blank=True)
    color_hex = models.CharField(max_length=7, blank=True) # #RRGGBB
    
    def __str__(self):
        return f"Fashion: {self.asset.title} ({self.size})"


class VehicleSpec(models.Model):
    """
    Vertical Extension: Vehicles (Driveables).
    Linked 1:1 to Asset.
    """
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, primary_key=True)
    
    # Specific Attributes
    make = models.CharField(max_length=50) # Mercedes, Toyota
    model = models.CharField(max_length=50) # S-Class, Camry
    year = models.PositiveIntegerField()
    transmission = models.CharField(max_length=20, default='MANUAL') # AUTO, MANUAL
    fuel_type = models.CharField(max_length=20, default='GASOLINE') # GASOLINE, DIESEL, HYBRID, ELECTRIC
    
    def __str__(self):
        return f"Vehicle: {self.make} {self.model} ({self.year})"


class RealEstateSpec(models.Model):
    """
    Vertical Extension: Real Estate (Livables).
    Linked 1:1 to Asset.
    """
    asset = models.OneToOneField(Asset, on_delete=models.CASCADE, primary_key=True)
    
    # Specific Attributes
    property_type = models.CharField(max_length=50, default='APARTMENT') # APARTMENT, HALL, VILLA
    capacity = models.PositiveIntegerField() # Number of guests/residents
    
    # Location (Simple Lat/Lon for now)
    location_lat = models.DecimalField(max_digits=9, decimal_places=6)
    location_lon = models.DecimalField(max_digits=9, decimal_places=6)
    
    has_parking = models.BooleanField(default=False)
    
    def __str__(self):
        return f"RealEstate: {self.property_type} (Cap: {self.capacity})"


# ==========================================
# 3. BOOKING ENGINE (COMMITMENT LAYER)
# ==========================================

class Booking(models.Model):
    """
    The Commitment Contract (Level 3).
    - Maps to SOVEREIGN_ERD.mermaid.
    - Represents a 'secured promise' between Renter and Owner.
    - Active Guarantor Principle: Freezes state at moment of booking.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Parties
    renter = models.ForeignKey(User, on_delete=models.PROTECT, related_name="bookings_as_renter")
    # Asset (Snapshot Link)
    asset = models.ForeignKey(Asset, on_delete=models.PROTECT, related_name="bookings")
    
    # Timeline
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Financial Snapshot (The "Frozen" Price)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    # Default to 0.00 to satisfy NOT NULL constraint during initial insert before logic runs
    locked_price = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00")) 
    
    # Status (Lifecycle)
    class Status(models.TextChoices):
        PENDING = 'PENDING', _('Pending Approval') # Initial State
        SECURED = 'SECURED', _('Secured (Guarantor Active)') # Deposit/Payment Locked
        ACTIVE = 'ACTIVE', _('Active (Handover)') # Possession taken
        COMPLETED = 'COMPLETED', _('Completed') # Returned & Verified
        DISPUTED = 'DISPUTED', _('Disputed') # Flagged for Human/AI Review
        CANCELLED = 'CANCELLED', _('Cancelled')

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    
    # Verification & Meta
    smart_agreement_hash = models.CharField(max_length=64, blank=True) # Link to PDF/JSON contract
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Active Guarantor Logic: Snapshot the price on creation
        # Use _state.adding for correct UUID new instance detection
        if self._state.adding and (self.locked_price is None or self.locked_price == Decimal("0.00")):
            if self.asset:
                 self.locked_price = self.asset.daily_price
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking {self.id} ({self.status})"
