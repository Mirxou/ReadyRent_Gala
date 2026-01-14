from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InventoryItemViewSet, StockAlertViewSet, StockMovementViewSet

router = DefaultRouter()
router.register(r'inventory', InventoryItemViewSet, basename='inventory')
router.register(r'stock-alerts', StockAlertViewSet, basename='stock-alerts')
router.register(r'stock-movements', StockMovementViewSet, basename='stock-movements')

urlpatterns = [
    path('', include(router.urls)),
]

