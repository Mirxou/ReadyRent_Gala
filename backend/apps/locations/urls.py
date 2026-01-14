from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AddressViewSet, DeliveryZoneViewSet,
    DeliveryRequestViewSet, DeliveryTrackingViewSet
)

router = DefaultRouter()
router.register(r'addresses', AddressViewSet, basename='address')
router.register(r'delivery-zones', DeliveryZoneViewSet, basename='delivery-zone')
router.register(r'deliveries', DeliveryRequestViewSet, basename='delivery')
router.register(r'tracking', DeliveryTrackingViewSet, basename='delivery-tracking')

urlpatterns = [
    path('', include(router.urls)),
]

