from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ContractGenerationView, SignAgreementView, ContractViewSet

router = DefaultRouter()
router.register(r'digital', ContractViewSet, basename='contract')

urlpatterns = [
    path('generate/', ContractGenerationView.as_view(), name='generate-contract'),
    path('sign/<int:pk>/', SignAgreementView.as_view(), name='sign-contract'),
    path('', include(router.urls)),
]
