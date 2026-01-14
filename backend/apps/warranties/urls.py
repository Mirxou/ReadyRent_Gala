from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WarrantyPlanViewSet, WarrantyPurchaseViewSet, WarrantyClaimViewSet,
    InsurancePlanListView, InsurancePlanDetailView, InsuranceCalculatorView,
    RecommendedInsuranceView, InsuranceClaimCreateView, AdminInsuranceClaimProcessView
)

router = DefaultRouter()
router.register(r'plans', WarrantyPlanViewSet, basename='warranty-plan')
router.register(r'purchases', WarrantyPurchaseViewSet, basename='warranty-purchase')
router.register(r'claims', WarrantyClaimViewSet, basename='warranty-claim')

urlpatterns = [
    path('', include(router.urls)),
    
    # Insurance plan routes
    path('insurance/plans/', InsurancePlanListView.as_view(), name='insurance-plan-list'),
    path('insurance/plans/<int:pk>/', InsurancePlanDetailView.as_view(), name='insurance-plan-detail'),
    path('insurance/calculator/', InsuranceCalculatorView.as_view(), name='insurance-calculator'),
    path('insurance/recommended/', RecommendedInsuranceView.as_view(), name='recommended-insurance'),
    path('insurance/claims/', InsuranceClaimCreateView.as_view(), name='insurance-claim-create'),
    path('insurance/claims/<int:pk>/process/', AdminInsuranceClaimProcessView.as_view(), name='admin-insurance-claim-process'),
]

