from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BundleCategoryViewSet, BundleViewSet, BundleBookingViewSet, BundleReviewViewSet

router = DefaultRouter()
router.register(r'categories', BundleCategoryViewSet, basename='bundle-category')
router.register(r'bundles', BundleViewSet, basename='bundle')
router.register(r'bookings', BundleBookingViewSet, basename='bundle-booking')
router.register(r'reviews', BundleReviewViewSet, basename='bundle-review')

urlpatterns = [
    path('', include(router.urls)),
]

