from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from .models import (
    User, UserProfile, VerificationStatus, Blacklist,
    StaffRole, ActivityLog, Shift, PerformanceReview
)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'role', 'is_verified', 'is_active', 'created_at']
    list_filter = ['role', 'is_verified', 'is_active', 'is_staff']
    search_fields = ['email', 'username', 'phone']
    ordering = ['-created_at']


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'city', 'preferred_language', 'created_at']
    search_fields = ['user__email', 'user__username', 'city']
    list_filter = ['city', 'preferred_language']


@admin.register(VerificationStatus)
class VerificationStatusAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'phone_verified', 'address_verified', 'risk_score', 'is_blacklisted', 'created_at']
    list_filter = ['status', 'phone_verified', 'address_verified', 'is_blacklisted', 'id_type']
    search_fields = ['user__email', 'id_number']
    readonly_fields = ['created_at', 'updated_at', 'verified_at']
    date_hierarchy = 'created_at'


@admin.register(Blacklist)
class BlacklistAdmin(admin.ModelAdmin):
    list_display = ['user', 'reason', 'is_active', 'added_by', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['user__email', 'reason']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'


@admin.register(StaffRole)
class StaffRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'branch', 'department', 'is_active', 'assigned_at', 'assigned_by']
    list_filter = ['role', 'is_active', 'branch', 'department', 'assigned_at']
    search_fields = ['user__email', 'department']
    readonly_fields = ['assigned_at']
    date_hierarchy = 'assigned_at'
    raw_id_fields = ['user', 'branch', 'assigned_by']


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ['user', 'action', 'model_name', 'object_id', 'created_at']
    list_filter = ['action', 'model_name', 'created_at']
    search_fields = ['user__email', 'description', 'model_name']
    readonly_fields = ['created_at', 'ip_address', 'user_agent']
    date_hierarchy = 'created_at'
    list_per_page = 50


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ['staff', 'branch', 'shift_date', 'start_time', 'end_time', 'is_completed', 'created_at']
    list_filter = ['branch', 'shift_date', 'is_completed', 'created_at']
    search_fields = ['staff__email', 'notes']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'shift_date'
    raw_id_fields = ['staff', 'branch']


@admin.register(PerformanceReview)
class PerformanceReviewAdmin(admin.ModelAdmin):
    list_display = ['staff', 'reviewed_by', 'review_period_start', 'review_period_end', 'overall_rating', 'reviewed_at']
    list_filter = ['overall_rating', 'review_period_start', 'review_period_end', 'reviewed_at']
    search_fields = ['staff__email', 'strengths', 'areas_for_improvement', 'comments']
    readonly_fields = ['reviewed_at']
    date_hierarchy = 'reviewed_at'
    raw_id_fields = ['staff', 'reviewed_by']

