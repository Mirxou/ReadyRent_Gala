from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PackagingTypeViewSet, PackagingMaterialViewSet,
    PackagingRuleViewSet, PackagingInstanceViewSet
)

router = DefaultRouter()
router.register(r'types', PackagingTypeViewSet, basename='packaging-type')
router.register(r'materials', PackagingMaterialViewSet, basename='packaging-material')
router.register(r'rules', PackagingRuleViewSet, basename='packaging-rule')
router.register(r'instances', PackagingInstanceViewSet, basename='packaging-instance')

urlpatterns = [
    path('', include(router.urls)),
]

