from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HygieneRecordViewSet, HygieneCertificateViewSet

router = DefaultRouter()
router.register(r'hygiene-records', HygieneRecordViewSet, basename='hygiene-record')
router.register(r'certificates', HygieneCertificateViewSet, basename='hygiene-certificate')

urlpatterns = [
    path('', include(router.urls)),
]

