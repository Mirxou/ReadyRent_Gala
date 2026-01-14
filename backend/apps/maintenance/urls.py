from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MaintenanceScheduleViewSet, MaintenanceRecordViewSet, MaintenancePeriodViewSet,
    MaintenancePeriodListView, MaintenanceScheduleView
)

router = DefaultRouter()
router.register(r'schedules', MaintenanceScheduleViewSet, basename='maintenance-schedule')
router.register(r'records', MaintenanceRecordViewSet, basename='maintenance-record')
router.register(r'periods', MaintenancePeriodViewSet, basename='maintenance-period')

urlpatterns = [
    path('', include(router.urls)),
    path('periods/list/', MaintenancePeriodListView.as_view(), name='maintenance-period-list'),
    path('schedules/list/', MaintenanceScheduleView.as_view(), name='maintenance-schedule-list'),
]

