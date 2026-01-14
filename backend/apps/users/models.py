"""
User models for ReadyRent.Gala
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Custom User model"""
    ROLE_CHOICES = [
        ('customer', _('Customer')),
        ('admin', _('Admin')),
        ('staff', _('Staff')),
    ]
    
    email = models.EmailField(_('email address'), unique=True)
    phone = models.CharField(_('phone number'), max_length=20, blank=True)
    role = models.CharField(_('role'), max_length=20, choices=ROLE_CHOICES, default='customer')
    avatar = models.ImageField(_('avatar'), upload_to='avatars/', blank=True, null=True)
    is_verified = models.BooleanField(_('verified'), default=False)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']
    
    class Meta:
        verbose_name = _('المستخدم')
        verbose_name_plural = _('المستخدمون')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.email


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
        return f"{self.user.email} - Profile"


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
    phone_verified = models.BooleanField(_('phone verified'), default=False)
    phone_verification_code = models.CharField(_('phone verification code'), max_length=10, blank=True)
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
        return f"{self.user.email} - {self.get_status_display()}"


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
        return f"{self.user.email} - {self.reason[:50]}"


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
        return f"{self.user.email} - {self.get_role_display()} ({branch_name})"


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
        return f"{self.user.email if self.user else 'System'} - {self.action} - {self.model_name}"


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
        return f"{self.staff.email} - {self.shift_date} ({self.start_time} - {self.end_time})"


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