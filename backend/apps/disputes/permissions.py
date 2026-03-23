from rest_framework import permissions

class IsDisputeOwner(permissions.BasePermission):
    """
    Permission: User can only access their own disputes.
    """
    def has_object_permission(self, request, view, obj):
        # obj is a Dispute
        return obj.user == request.user

class IsOfferParty(permissions.BasePermission):
    """
    Permission: User can only interact with offers from their own disputes.
    """
    def has_object_permission(self, request, view, obj):
        # obj is a SettlementOffer
        return obj.session.dispute.user == request.user

class IsStaffOnly(permissions.BasePermission):
    """
    Permission: Only staff can access (Admin actions).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_staff
