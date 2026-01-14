"""
Permission classes for User app
"""
from rest_framework import permissions


class IsAdminOrManager(permissions.BasePermission):
    """Allow access only to admin or manager users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager'] or request.user.is_staff


class IsAdminOrManagerOrStaff(permissions.BasePermission):
    """Allow access to admin, manager, or staff users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager', 'staff'] or request.user.is_staff


class IsAdminOnly(permissions.BasePermission):
    """Allow access only to admin users"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role == 'admin' or request.user.is_superuser


class CanManageStaff(permissions.BasePermission):
    """Check if user can manage staff (admin or manager)"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager'] or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        # Admin can manage anyone
        if request.user.role == 'admin' or request.user.is_superuser:
            return True
        
        # Manager can manage staff in their branch
        if request.user.role == 'manager':
            # Check if manager has staff role in same branch
            manager_roles = request.user.staff_roles.filter(is_active=True)
            if hasattr(obj, 'staff_roles'):
                staff_roles = obj.staff_roles.filter(is_active=True)
                # Check if they share a branch
                manager_branches = {role.branch_id for role in manager_roles if role.branch}
                staff_branches = {role.branch_id for role in staff_roles if role.branch}
                return bool(manager_branches & staff_branches)
        
        return False


class CanViewOwnActivity(permissions.BasePermission):
    """Allow users to view their own activity logs"""
    
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Users can view their own activity
        if obj.user == request.user:
            return True
        
        # Admin and manager can view all activities
        return request.user.role in ['admin', 'manager'] or request.user.is_staff


class CanManageShifts(permissions.BasePermission):
    """Check if user can manage shifts"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager', 'staff'] or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        # Users can view their own shifts
        if obj.staff == request.user:
            return True
        
        # Admin and manager can manage all shifts
        return request.user.role in ['admin', 'manager'] or request.user.is_staff


class CanManagePerformanceReviews(permissions.BasePermission):
    """Check if user can manage performance reviews"""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in ['admin', 'manager'] or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        # Users can view their own reviews
        if obj.staff == request.user:
            return True
        
        # Admin and manager can manage all reviews
        return request.user.role in ['admin', 'manager'] or request.user.is_staff
