from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Address, DeliveryZone, DeliveryRequest, DeliveryTracking
from .serializers import (
    AddressSerializer, DeliveryZoneSerializer,
    DeliveryRequestSerializer, DeliveryTrackingSerializer
)
from .services import GoogleMapsService, LocationService


class AddressViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing addresses
    """
    serializer_class = AddressSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['is_default', 'is_active', 'city']
    ordering_fields = ['is_default', 'created_at']
    ordering = ['-is_default', '-created_at']
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter addresses by current user"""
        return Address.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user when creating address"""
        serializer.save(user=self.request.user)


class DeliveryZoneViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing delivery zones
    """
    queryset = DeliveryZone.objects.filter(is_active=True)
    serializer_class = DeliveryZoneSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['city']
    search_fields = ['name', 'name_ar']
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['get'], permission_classes=[AllowAny])
    def check_same_day(self, request, pk=None):
        """Check if same-day delivery is available for this zone"""
        zone = self.get_object()
        result = LocationService.check_same_day_delivery_available(zone)
        return Response(result)


class DeliveryRequestViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing delivery requests
    """
    queryset = DeliveryRequest.objects.select_related(
        'booking', 'booking__product', 'delivery_address',
        'pickup_address', 'delivery_zone', 'assigned_driver'
    ).prefetch_related('tracking_history').all()
    serializer_class = DeliveryRequestSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'delivery_type', 'assigned_driver', 'delivery_zone']
    ordering_fields = ['delivery_date', 'created_at']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'update_tracking']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        """Filter delivery requests based on user role"""
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return self.queryset
        return self.queryset.filter(booking__user=user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def update_tracking(self, request, pk=None):
        """Update GPS tracking for delivery"""
        delivery = self.get_object()
        
        # Check if user is assigned driver or admin
        if delivery.assigned_driver != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'error': 'Not authorized to update tracking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        status_update = request.data.get('status', '')
        
        if not latitude or not longitude:
            return Response(
                {'error': 'Latitude and longitude are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update current position
        delivery.current_latitude = latitude
        delivery.current_longitude = longitude
        delivery.last_tracking_update = timezone.now()
        delivery.save()
        
        # Update status if provided
        if status_update:
            old_status = delivery.status
            delivery.status = status_update
            delivery.save()
            
            # Send WhatsApp notification if status changed
            if old_status != status_update and delivery.booking.user.phone:
                try:
                    from apps.notifications.whatsapp_service import WhatsAppService
                    tracking_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')}/bookings/{delivery.booking.id}/tracking"
                    WhatsAppService.send_delivery_update(
                        delivery.booking.user.phone,
                        status_update,
                        tracking_url
                    )
                except Exception as e:
                    print(f"Error sending WhatsApp delivery update: {e}")
        
        # Create tracking record
        DeliveryTracking.objects.create(
            delivery_request=delivery,
            latitude=latitude,
            longitude=longitude,
            status=status_update or delivery.status
        )
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def assign_driver(self, request, pk=None):
        """Assign driver to delivery"""
        delivery = self.get_object()
        driver_id = request.data.get('driver_id')
        
        if not driver_id:
            return Response(
                {'error': 'driver_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.users.models import User
        try:
            driver = User.objects.get(id=driver_id, role='staff')
        except User.DoesNotExist:
            return Response(
                {'error': 'Driver not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        delivery.assigned_driver = driver
        delivery.status = 'assigned'
        delivery.save()
        
        # Send WhatsApp notification
        if delivery.booking.user.phone:
            try:
                from apps.notifications.whatsapp_service import WhatsAppService
                tracking_url = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')}/bookings/{delivery.booking.id}/tracking"
                WhatsAppService.send_delivery_update(
                    delivery.booking.user.phone,
                    'assigned',
                    tracking_url
                )
            except Exception as e:
                print(f"Error sending WhatsApp notification: {e}")
        
        serializer = self.get_serializer(delivery)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_deliveries(self, request):
        """Get current user's deliveries"""
        my_deliveries = self.queryset.filter(booking__user=request.user)
        serializer = self.get_serializer(my_deliveries, many=True)
        return Response(serializer.data)


class DeliveryTrackingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing delivery tracking history
    """
    queryset = DeliveryTracking.objects.select_related('delivery_request').all()
    serializer_class = DeliveryTrackingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['delivery_request']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    permission_classes = [IsAuthenticated]

