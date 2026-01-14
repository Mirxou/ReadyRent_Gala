from rest_framework import viewsets, generics, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from .models import MaintenanceSchedule, MaintenanceRecord, MaintenancePeriod
from .serializers import MaintenanceScheduleSerializer, MaintenanceRecordSerializer, MaintenancePeriodSerializer


class MaintenanceScheduleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing maintenance schedules
    """
    queryset = MaintenanceSchedule.objects.select_related('product').all()
    serializer_class = MaintenanceScheduleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'maintenance_type', 'is_active', 'required_between_rentals']
    search_fields = ['product__name', 'product__name_ar']
    ordering_fields = ['created_at', 'updated_at']
    ordering = ['product', 'maintenance_type']
    permission_classes = [IsAdminUser]


class MaintenanceRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing maintenance records
    """
    queryset = MaintenanceRecord.objects.select_related(
        'product', 'assigned_to', 'related_booking'
    ).prefetch_related('period').all()
    serializer_class = MaintenanceRecordSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'status', 'maintenance_type', 'assigned_to']
    search_fields = ['product__name', 'notes']
    ordering_fields = ['scheduled_start', 'created_at']
    ordering = ['-scheduled_start']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def start_maintenance(self, request, pk=None):
        """Start maintenance"""
        record = self.get_object()
        if record.status != 'scheduled':
            return Response(
                {'error': 'Maintenance must be scheduled to start'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        record.status = 'in_progress'
        record.actual_start = timezone.now()
        record.save()
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def complete_maintenance(self, request, pk=None):
        """Complete maintenance"""
        record = self.get_object()
        if record.status != 'in_progress':
            return Response(
                {'error': 'Maintenance must be in progress to complete'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        record.status = 'completed'
        record.actual_end = timezone.now()
        notes = request.data.get('notes', '')
        if notes:
            record.notes = f"{record.notes}\n{notes}" if record.notes else notes
        record.save()
        
        serializer = self.get_serializer(record)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def upcoming(self, request):
        """Get upcoming maintenance records"""
        upcoming = self.queryset.filter(
            status__in=['scheduled', 'in_progress'],
            scheduled_start__gte=timezone.now()
        )[:10]
        serializer = self.get_serializer(upcoming, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def overdue(self, request):
        """Get overdue maintenance records"""
        overdue = [record for record in self.queryset.all() if record.is_overdue()]
        serializer = self.get_serializer(overdue, many=True)
        return Response(serializer.data)


class MaintenancePeriodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing maintenance periods
    """
    queryset = MaintenancePeriod.objects.select_related('maintenance_record__product').all()
    serializer_class = MaintenancePeriodSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['blocks_bookings']
    ordering_fields = ['start_datetime']
    ordering = ['start_datetime']
    permission_classes = [IsAuthenticated]


class MaintenancePeriodListView(generics.ListAPIView):
    """List maintenance periods for a product"""
    serializer_class = MaintenancePeriodSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        product_id = self.request.query_params.get('product')
        queryset = MaintenancePeriod.objects.filter(
            blocks_bookings=True
        ).select_related('maintenance_record__product')
        
        if product_id:
            queryset = queryset.filter(maintenance_record__product_id=product_id)
        
        return queryset


class MaintenanceScheduleView(generics.ListAPIView):
    """List maintenance schedules"""
    serializer_class = MaintenanceScheduleSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return MaintenanceSchedule.objects.filter(is_active=True).select_related('product')

