"""
User models for ReadyRent.Gala
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager  # type: ignore
from django.db import models  # type: ignore
from django.utils import timezone  # type: ignore
from django.utils.text import slugify  # type: ignore
from django.utils.translation import gettext_lazy as _  # type: ignore
from apps.core.crypto.hashing import compute_pii_hash, get_pii_hash_key  # type: ignore
from apps.core.crypto.normalization import normalize_email, normalize_phone  # type: ignore
from apps.core.crypto.fields import EncryptedCharField  # type: ignore


class UserManager(BaseUserManager):
    """
    Custom manager that uses HMAC shadow columns for auth lookups.
    Phase 16: All auth paths go through email_hash, never plaintext email.
    """

    def get_by_natural_key(self, username):
        """
        Override for hash-based email lookup.
        Called by Django's ModelBackend during ALL auth paths:
        - Login
        - Admin login
        - Password reset
        - JWT token validation
        """
        email_hash = compute_pii_hash(
            normalize_email(username),
            get_pii_hash_key()
        )
        return self.get(email_hash=email_hash)

    def _generate_username(self, email):
        base = slugify((email or '').split('@')[0]) or 'user'
        candidate = base[:150]
        suffix = 1

        while self.model.objects.filter(username=candidate).exists():
            suffix_text = f'-{suffix}'
            candidate = f"{base[:150 - len(suffix_text)]}{suffix_text}"
            suffix += 1

        return candidate

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required.')
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        extra_fields.setdefault('username', self._generate_username(email))
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom User model"""
    ROLE_CHOICES = [
        ('customer', _('Customer')),
        ('admin', _('Admin')),
        ('staff', _('Staff')),
    ]

    objects = UserManager()

    # Phase 16C.4a: email is now EncryptedCharField (AES at rest).
    # plaintext backup is in email_plaintext_backup column (DB-only, no Python field).
    # After 16C.4b the backup column will be dropped permanently.
    # ⚠ DO NOT add email_plaintext_backup back to the model class.
    # ⚠ DO NOT filter on this field directly — use email_hash for all lookups.
    email = EncryptedCharField(_('email address'), unique=True)
    supabase_user_id = models.UUIDField(_('Supabase User ID'), unique=True, null=True, blank=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default='customer')
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(_('verified'), default=False)

    # Phase 16A: HMAC Shadow Columns (search index for encrypted fields)
    # These are populated on every save(). Query via these, never via plaintext fields.
    email_hash = models.CharField(
        _('email hash'), max_length=88, null=True, blank=True, db_index=True,
        help_text='HMAC-SHA256 of normalized email. NULL until backfill. Used for auth lookup.'
    )
    phone_hash = models.CharField(
        _('phone hash'), max_length=88, null=True, blank=True, db_index=True,
        help_text='HMAC-SHA256 of normalized phone. NULL until backfill. Used for OTP lookup.'
    )

    # ─────────────────────────────────────────────────────────────────────────
    # Phase 16C Shadow Encrypted Fields — CUTOVER COMPLETE (16C.4a)
    # ─────────────────────────────────────────────────────────────────────────

    # Sovereign Tracking Fields (Phase 31: Ethics as Data)
    last_dispute_attempt_at = models.DateTimeField(_('last dispute attempt'), null=True, blank=True)
    emotional_lock_until = models.DateTimeField(_('emotional lock until'), null=True, blank=True)
    consecutive_emotional_attempts = models.IntegerField(_('consecutive emotional attempts'), default=0)
    merit_score = models.IntegerField(_('merit score'), default=50)

    # 🛡️ SOVEREIGN UNIFICATION (Phase 32): Unified Trust Architecture
    # Range: 0 (Critical Risk) to 100 (Maximum Trust)
    trust_score = models.DecimalField(
        _('sovereign trust score'), 
        max_digits=5, 
        decimal_places=2, 
        default=50.00
    )

    # 🛡️ SOVEREIGN GUARD: Two-Factor Authentication (Phase 5)
    is_2fa_enabled = models.BooleanField(_('2FA Enabled'), default=False)
    totp_secret = EncryptedCharField(_('TOTP Secret'), max_length=32, null=True, blank=True)

    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)


    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = _('المستخدم')
        verbose_name_plural = _('المستخدمون')
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        """Compute HMAC shadow hashes before every save.

        Phase 16C.4a: self.email is now an EncryptedCharField.
        from_db_value() decrypts transparently on read, so self.email
        returns the plaintext canonical value — hashing works unchanged.
        """
        try:
            key = get_pii_hash_key()
            if self.email:
                self.email_hash = compute_pii_hash(normalize_email(self.email), key)
            if self.phone:
                self.phone_hash = compute_pii_hash(normalize_phone(self.phone), key)
        except RuntimeError:
            # PII_HASH_KEY not configured (e.g., during initial migrations).
            self.email_hash = None
            self.phone_hash = None
        super().save(*args, **kwargs)

    def __str__(self):
        # Never expose email in repr to prevent log leakage
        return f"User #{self.id}"

    def __repr__(self):
        return f"<User id={self.id}>"


class UserProfile(models.Model):
    """Extended user profile"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile',
        verbose_name=_('user'))
    first_name_ar = models.CharField(_('first name (Arabic)'), max_length=100, blank=True)
    last_name_ar = models.CharField(_('last name (Arabic)'), max_length=100, blank=True)
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, default='Constantine')
    postal_code = models.CharField(_('postal code'), max_length=10, blank=True)
    date_of_birth = models.DateField(_('date of birth'), null=True, blank=True)
    preferred_language = models.CharField(_('preferred language'), max_length=10, default='ar', choices=[
        ('ar', 'العربية'),
        ('fr', 'Français'),
    ])
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('الملف الشخصي')
        verbose_name_plural = _('الملفات الشخصية')
    
    def __str__(self):
        return f"User #{self.user_id} - Profile"

    @property
    def age(self):
        if not self.date_of_birth:
            return None
        today = timezone.now().date()
        years = today.year - self.date_of_birth.year
        if (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day):
            years -= 1
        return years

    @property
    def is_adult(self):
        age = self.age
        return age is not None and age >= 18


class VerificationStatus(models.Model):
    """KYC Verification Status"""
    VERIFICATION_STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('submitted', _('Submitted')),
        ('under_review', _('Under Review')),
        ('verified', _('Verified')),
        ('rejected', _('Rejected')),
    ]
    
    ID_TYPE_CHOICES = [
        ('national_id', _('National ID')),
        ('passport', _('Passport')),
        ('driver_license', _('Driver License')),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='verification',
        verbose_name=_('user'))
    status = models.CharField(_('status'), max_length=20, choices=VERIFICATION_STATUS_CHOICES, default='pending')
    id_type = models.CharField(_('ID type'), max_length=20, choices=ID_TYPE_CHOICES, blank=True)
    id_number = models.CharField(_('ID number'), max_length=50, blank=True)
    id_front_image = models.ImageField(_('ID front image'), upload_to='verification/id_front/', blank=True, null=True)
    id_back_image = models.ImageField(_('ID back image'), upload_to='verification/id_back/', blank=True, null=True)
    selfie = models.ImageField(_('selfie'), upload_to='verification/selfie/', blank=True, null=True)
    phone_verified = models.BooleanField(_('phone verified'), default=False)
    phone_verification_code = models.CharField(_('phone verification code'), max_length=128, blank=True)
    phone_verification_expires = models.DateTimeField(_('phone verification expires'), null=True, blank=True)
    address_verified = models.BooleanField(_('address verified'), default=False)
    risk_score = models.IntegerField(_('risk score'), default=0, help_text=_('Risk score from 0-100'))
    is_blacklisted = models.BooleanField(_('blacklisted'), default=False)
    blacklist_reason = models.TextField(_('blacklist reason'), blank=True)
    verified_at = models.DateTimeField(_('verified at'), null=True, blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='verifications_approved',
        verbose_name=_('verified_by'))
    rejection_reason = models.TextField(_('rejection reason'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('حالة التحقق')
        verbose_name_plural = _('حالات التحقق')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"User #{self.user_id} - {self.get_status_display()}"


# ─────────────────────────────────────────────────────────────────────────────
# GAP-02 FIX (2026-03-31): KYC Completion — VerificationLevel + FaceVerification
# Ref: AUDIT_BASELINE.md §12.2 GAP-02
# ─────────────────────────────────────────────────────────────────────────────

class VerificationLevel(models.Model):
    """
    KYC Tier System — enforces transaction limits per verified level.
    BASIC   → phone verified only       → max 10,000 DZD/transaction
    STANDARD → ID + selfie verified     → max 50,000 DZD/transaction
    PREMIUM  → full KYB / biometric     → unlimited (B2B / power users)
    """
    LEVEL_CHOICES = [
        ('basic',    _('Basic — Phone Only')),
        ('standard', _('Standard — ID + Selfie')),
        ('premium',  _('Premium — Biometric / KYB')),
    ]

    LIMIT_MAP = {
        'basic':    10_000,
        'standard': 50_000,
        'premium':  None,   # No limit
    }

    user = models.OneToOneField(
        User, on_delete=models.CASCADE,
        related_name='verification_level',
        verbose_name=_('user')
    )
    level = models.CharField(
        _('verification level'), max_length=20,
        choices=LEVEL_CHOICES, default='basic'
    )
    upgraded_at = models.DateTimeField(_('upgraded at'), null=True, blank=True)
    upgraded_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='kyc_level_upgrades', verbose_name=_('upgraded by')
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('مستوى التحقق')
        verbose_name_plural = _('مستويات التحقق')

    @property
    def transaction_limit(self):
        """Returns max DZD per transaction, or None if unlimited."""
        return self.LIMIT_MAP.get(self.level)

    def can_transact(self, amount) -> bool:
        """Check if user is allowed to initiate a transaction of this amount."""
        limit = self.transaction_limit
        if limit is None:
            return True
        return amount <= limit

    def __str__(self):
        return f"{self.user} — {self.get_level_display()}"


class FaceVerification(models.Model):
    """
    AI Biometric Verification record.
    Stores encrypted face descriptor reference (NOT the image — image stays in
    VerificationStatus.selfie). Only the AI-generated face_id token is stored,
    encrypted with EncryptedCharField (AES-256), so raw biometrics never touch
    the DB in plaintext.
    """
    STATUS_CHOICES = [
        ('pending',   _('Pending')),
        ('matched',   _('Face Matched ✅')),
        ('mismatch',  _('Face Mismatch ❌')),
        ('low_quality', _('Low Quality Image')),
        ('error',     _('Processing Error')),
    ]

    verification = models.OneToOneField(
        VerificationStatus, on_delete=models.CASCADE,
        related_name='face_verification',
        verbose_name=_('verification record')
    )
    status = models.CharField(
        _('status'), max_length=20,
        choices=STATUS_CHOICES, default='pending'
    )
    # Encrypted AI face descriptor token — never stores raw biometric data
    face_id = EncryptedCharField(
        _('face ID token'), max_length=512,
        blank=True,
        help_text='Encrypted AI face descriptor token. Raw biometrics are never stored.'
    )
    confidence_score = models.DecimalField(
        _('confidence score'), max_digits=5, decimal_places=4,
        null=True, blank=True,
        help_text='AI match confidence: 0.0000 → 1.0000. Threshold: 0.8500'
    )
    liveness_passed = models.BooleanField(_('liveness check passed'), default=False)
    model_version = models.CharField(
        _('AI model version'), max_length=50, blank=True,
        help_text='e.g. deepface-v2.1 — for drift tracking'
    )
    processed_at = models.DateTimeField(_('processed at'), null=True, blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)

    class Meta:
        verbose_name = _('التحقق البيومتري')
        verbose_name_plural = _('التحققات البيومترية')

    def is_verified(self) -> bool:
        return self.status == 'matched' and self.liveness_passed

    def __str__(self):
        return f"FaceVerification({self.verification.user}) — {self.get_status_display()}"


class IdentityDocument(models.Model):
    """KYC identity document record."""

    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('submitted', _('Submitted')),
        ('verified', _('Verified')),
        ('rejected', _('Rejected')),
        ('expired', _('Expired')),
    ]

    DOCUMENT_TYPE_CHOICES = [
        ('national_id', _('National ID')),
        ('passport', _('Passport')),
        ('driver_license', _('Driver License')),
        ('residence_permit', _('Residence Permit')),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='identity_document',
        verbose_name=_('user')
    )
    document_type = models.CharField(_('document type'), max_length=30, choices=DOCUMENT_TYPE_CHOICES, default='national_id')
    document_number = EncryptedCharField(_('document number'), max_length=120, blank=True)
    issuing_country = models.CharField(_('issuing country'), max_length=2, default='DZ')
    issue_date = models.DateField(_('issue date'), null=True, blank=True)
    expiry_date = models.DateField(_('expiry date'), null=True, blank=True)
    front_image = models.ImageField(_('front image'), upload_to='kyc/documents/front/', blank=True, null=True)
    back_image = models.ImageField(_('back image'), upload_to='kyc/documents/back/', blank=True, null=True)
    ocr_confidence = models.DecimalField(_('ocr confidence'), max_digits=5, decimal_places=4, null=True, blank=True)
    age_verified = models.BooleanField(_('age verified'), default=False)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_at = models.DateTimeField(_('verified at'), null=True, blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='identity_documents_verified',
        verbose_name=_('verified by')
    )
    rejection_reason = models.TextField(_('rejection reason'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('وثيقة هوية')
        verbose_name_plural = _('وثائق الهوية')
        ordering = ['-created_at']

    def __str__(self):
        return f"IdentityDocument(User #{self.user_id}, {self.document_type})"

    def is_expired(self):
        return bool(self.expiry_date and timezone.now().date() > self.expiry_date)

    def is_verified(self):
        return self.status == 'verified' and not self.is_expired()


class BusinessProfile(models.Model):
    """KYB profile for business users and vendors."""

    STATUS_CHOICES = [
        ('pending', _('Pending')),
        ('under_review', _('Under Review')),
        ('verified', _('Verified')),
        ('rejected', _('Rejected')),
    ]

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='business_profile',
        verbose_name=_('user')
    )
    business_name = models.CharField(_('business name'), max_length=255, blank=True)
    commercial_register_number = EncryptedCharField(_('commercial register number'), max_length=120, blank=True)
    tax_id = EncryptedCharField(_('tax id'), max_length=120, blank=True)
    nis_number = EncryptedCharField(_('nis number'), max_length=120, blank=True)
    legal_representative_name = models.CharField(_('legal representative name'), max_length=255, blank=True)
    legal_representative_id = EncryptedCharField(_('legal representative id'), max_length=120, blank=True)
    beneficial_owners = models.JSONField(_('beneficial owners'), default=list, blank=True)
    address = models.TextField(_('address'), blank=True)
    city = models.CharField(_('city'), max_length=100, blank=True)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='pending')
    verified_at = models.DateTimeField(_('verified at'), null=True, blank=True)
    verified_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='business_profiles_verified',
        verbose_name=_('verified by')
    )
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)

    class Meta:
        verbose_name = _('ملف تجاري')
        verbose_name_plural = _('الملفات التجارية')
        ordering = ['-created_at']

    def __str__(self):
        return f"BusinessProfile(User #{self.user_id}, {self.business_name or 'Unspecified'})"

    def is_verified(self):
        return self.status == 'verified'


class Blacklist(models.Model):
    """Blacklist for suspicious users"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='blacklist_entries',
        verbose_name=_('user'))
    reason = models.TextField(_('reason'))
    added_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='blacklist_additions',
        verbose_name=_('added_by'))
    is_active = models.BooleanField(_('active'), default=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('قائمة الحظر')
        verbose_name_plural = _('قوائم الحظر')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Blacklist(User #{self.user_id}) - {self.reason[:50]}"


class StaffRole(models.Model):
    """Staff role with detailed permissions"""
    ROLE_CHOICES = [
        ('admin', _('Administrator')),
        ('manager', _('Manager')),
        ('staff', _('Staff')),
        ('delivery', _('Delivery Staff')),
        ('support', _('Support Staff')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='staff_roles',
        verbose_name=_('user'))
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES)
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='staff_role_assignments',
        verbose_name=_('branch'))
    department = models.CharField(_('department'), max_length=100, blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    assigned_at = models.DateTimeField(_('assigned at'), auto_now_add=True)
    assigned_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='role_assignments',
        verbose_name=_('assigned_by'))
    
    class Meta:
        verbose_name = _('دور الموظف')
        verbose_name_plural = _('أدوار الموظفين')
        unique_together = ['user', 'role', 'branch']
        ordering = ['-assigned_at']
    
    def __str__(self):
        branch_name = self.branch.name_ar if self.branch else 'All Branches'
        return f"User #{self.user_id} - {self.get_role_display()} ({branch_name})"


class ActivityLog(models.Model):
    """Activity logging for staff"""
    ACTION_CHOICES = [
        ('create', _('Create')),
        ('update', _('Update')),
        ('delete', _('Delete')),
        ('view', _('View')),
        ('approve', _('Approve')),
        ('reject', _('Reject')),
        ('login', _('Login')),
        ('logout', _('Logout')),
        ('other', _('Other')),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='activity_logs',
        verbose_name=_('user'))
    action = models.CharField(_('action'), max_length=20, choices=ACTION_CHOICES)
    model_name = models.CharField(_('model name'), max_length=100)
    object_id = models.IntegerField(_('object ID'), null=True, blank=True)
    description = models.TextField(_('description'))
    ip_address = models.GenericIPAddressField(_('IP address'), null=True, blank=True)
    user_agent = models.TextField(_('user agent'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('سجل النشاط')
        verbose_name_plural = _('سجلات النشاط')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['action', 'created_at']),
            models.Index(fields=['model_name', 'object_id']),
        ]
    
    def __str__(self):
        user_display = f"User #{self.user_id}" if self.user else 'System'
        return f"{user_display} - {self.action} - {self.model_name}"


class Shift(models.Model):
    """Shift scheduling for staff"""
    staff = models.ForeignKey(User, on_delete=models.CASCADE, related_name='shifts',
        verbose_name=_('staff'))
    branch = models.ForeignKey(
        'branches.Branch',
        on_delete=models.CASCADE,
        related_name='shifts',
        verbose_name=_('branch'))
    shift_date = models.DateField(_('shift date'))
    start_time = models.TimeField(_('start time'))
    end_time = models.TimeField(_('end time'))
    is_completed = models.BooleanField(_('completed'), default=False)
    notes = models.TextField(_('notes'), blank=True)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('المناوبة')
        verbose_name_plural = _('المناوبات')
        ordering = ['shift_date', 'start_time']
        indexes = [
            models.Index(fields=['staff', 'shift_date']),
            models.Index(fields=['branch', 'shift_date']),
        ]
    
    def __str__(self):
        return f"Shift(User #{self.staff_id}) - {self.shift_date} ({self.start_time} - {self.end_time})"


class PerformanceReview(models.Model):
    """Performance review for staff"""
    RATING_CHOICES = [
        (1, _('Poor')),
        (2, _('Below Average')),
        (3, _('Average')),
        (4, _('Good')),
        (5, _('Excellent')),
    ]
    
    staff = models.ForeignKey(User, on_delete=models.CASCADE, related_name='performance_reviews',
        verbose_name=_('staff'))
    reviewed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviews_conducted',
        verbose_name=_('reviewed_by'))
    review_period_start = models.DateField(_('review period start'))
    review_period_end = models.DateField(_('review period end'))
    
    # Ratings
    overall_rating = models.IntegerField(_('overall rating'), choices=RATING_CHOICES)
    punctuality_rating = models.IntegerField(_('punctuality rating'), choices=RATING_CHOICES)
    quality_rating = models.IntegerField(_('quality rating'), choices=RATING_CHOICES)
    communication_rating = models.IntegerField(_('communication rating'), choices=RATING_CHOICES)
    
    # Review details
    strengths = models.TextField(_('strengths'), blank=True)
    areas_for_improvement = models.TextField(_('areas for improvement'), blank=True)
    goals = models.TextField(_('goals'), blank=True)
    comments = models.TextField(_('comments'), blank=True)
    
    reviewed_at = models.DateTimeField(_('reviewed at'), auto_now_add=True)
    
    class Meta:
        verbose_name = _('تقييم الأداء')
        verbose_name_plural = _('تقييمات الأداء')
        ordering = ['-reviewed_at']
        indexes = [
            models.Index(fields=['staff', 'reviewed_at']),
        ]
    
    def __str__(self):
        return f"Review for {self.staff.email} - {self.review_period_start} to {self.review_period_end}"
