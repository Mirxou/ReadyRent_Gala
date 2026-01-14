"""
URLs for Booking app
"""
from django.urls import path
from .views import (
    CartView, CartItemCreateView, CartItemDeleteView,
    BookingCreateView, BookingListView, BookingDetailView,
    BookingUpdateView, BookingStatusUpdateView, BookingCancelView,
    AdminBookingListView, AdminBookingUpdateView, AdminBookingStatsView,
    WaitlistListView, WaitlistCreateView, WaitlistDeleteView,
    DamageAssessmentCreateView, DamageAssessmentDetailView,
    DamagePhotoCreateView, InspectionChecklistCreateView,
    InspectionChecklistUpdateView, DamageClaimCreateView, DamageClaimDetailView,
    CancellationPolicyView, EarlyReturnView, RefundListView
)

app_name = 'bookings'

urlpatterns = [
    path('cart/', CartView.as_view(), name='cart'),
    path('cart/items/', CartItemCreateView.as_view(), name='cart-item-create'),
    path('cart/items/<int:pk>/', CartItemDeleteView.as_view(), name='cart-item-delete'),
    path('create/', BookingCreateView.as_view(), name='booking-create'),
    path('', BookingListView.as_view(), name='booking-list'),
    path('<int:pk>/', BookingDetailView.as_view(), name='booking-detail'),
    path('<int:pk>/update/', BookingUpdateView.as_view(), name='booking-update'),
    path('<int:pk>/status/', BookingStatusUpdateView.as_view(), name='booking-status-update'),
    path('<int:pk>/cancel/', BookingCancelView.as_view(), name='booking-cancel'),
    path('<int:pk>/cancellation-policy/', CancellationPolicyView.as_view(), name='cancellation-policy'),
    path('<int:pk>/early-return/', EarlyReturnView.as_view(), name='early-return'),
    path('refunds/', RefundListView.as_view(), name='refund-list'),
    
    # Waitlist routes
    path('waitlist/', WaitlistListView.as_view(), name='waitlist-list'),
    path('waitlist/add/', WaitlistCreateView.as_view(), name='waitlist-add'),
    path('waitlist/<int:pk>/', WaitlistDeleteView.as_view(), name='waitlist-delete'),
    
    # Admin routes
    path('admin/', AdminBookingListView.as_view(), name='admin-booking-list'),
    path('admin/stats/', AdminBookingStatsView.as_view(), name='admin-booking-stats'),
    path('admin/<int:pk>/', AdminBookingUpdateView.as_view(), name='admin-booking-update'),
    
    # Damage Assessment routes
    path('damage-assessment/', DamageAssessmentCreateView.as_view(), name='damage-assessment-create'),
    path('damage-assessment/<int:pk>/', DamageAssessmentDetailView.as_view(), name='damage-assessment-detail'),
    path('damage-photos/', DamagePhotoCreateView.as_view(), name='damage-photo-create'),
    path('inspection-checklist/', InspectionChecklistCreateView.as_view(), name='inspection-checklist-create'),
    path('inspection-checklist/<int:pk>/', InspectionChecklistUpdateView.as_view(), name='inspection-checklist-update'),
    path('damage-claims/', DamageClaimCreateView.as_view(), name='damage-claim-create'),
    path('damage-claims/<int:pk>/', DamageClaimDetailView.as_view(), name='damage-claim-detail'),
]

