from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReturnViewSet, RefundViewSet

router = DefaultRouter()
router.register(r'returns', ReturnViewSet, basename='return')
router.register(r'refunds', RefundViewSet, basename='refund')

urlpatterns = [
    path('', include(router.urls)),
]

