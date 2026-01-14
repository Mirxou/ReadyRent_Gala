"""
URLs for Payment app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PaymentMethodListView,
    PaymentViewSet,
    PaymentCreateView
)
from .webhooks import BaridiMobWebhookView, BankCardWebhookView

app_name = 'payments'

router = DefaultRouter()
router.register(r'payments', PaymentViewSet, basename='payment')

urlpatterns = [
    path('', include(router.urls)),
    path('methods/', PaymentMethodListView.as_view(), name='payment-methods'),
    path('create/', PaymentCreateView.as_view(), name='payment-create'),
    
    # Webhooks
    path('webhooks/baridimob/', BaridiMobWebhookView.as_view(), name='baridimob-webhook'),
    path('webhooks/bank-card/', BankCardWebhookView.as_view(), name='bank-card-webhook'),
]
