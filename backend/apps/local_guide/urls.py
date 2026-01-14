from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ServiceCategoryViewSet, LocalServiceViewSet, ServiceReviewViewSet

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet, basename='service-category')
router.register(r'services', LocalServiceViewSet, basename='local-service')
router.register(r'reviews', ServiceReviewViewSet, basename='service-review')

urlpatterns = [
    path('', include(router.urls)),
]

