from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ArtisanViewSet, ArtisanReviewViewSet

router = DefaultRouter()
router.register(r'artisans', ArtisanViewSet, basename='artisan')
router.register(r'reviews', ArtisanReviewViewSet, basename='artisan-review')

urlpatterns = [
    path('', include(router.urls)),
]

