from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Return, ReturnItem, Refund
from .serializers import ReturnSerializer, ReturnItemSerializer, RefundSerializer


class ReturnViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing returns
    """
    queryset = Return.objects.select_related(
        'booking', 'booking__product', 'booking__user', 'inspector'
    ).prefetch_related('items', 'refund').all()
    serializer_class = ReturnSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'booking__user']
    search_fields = ['booking__product__name', 'return_notes', 'inspection_notes']
    ordering_fields = ['requested_at', 'created_at']
    ordering = ['-requested_at']
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        """Filter returns based on user role"""
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return self.queryset
        return self.queryset.filter(booking__user=user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve return request"""
        return_request = self.get_object()
        if return_request.status != 'requested':
            return Response(
                {'error': 'Only requested returns can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_request.status = 'approved'
        scheduled_date = request.data.get('scheduled_pickup_date')
        if scheduled_date:
            return_request.scheduled_pickup_date = scheduled_date
        return_request.save()
        
        serializer = self.get_serializer(return_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def mark_received(self, request, pk=None):
        """Mark return as received"""
        return_request = self.get_object()
        if return_request.status not in ['scheduled', 'in_transit']:
            return Response(
                {'error': 'Return must be scheduled or in transit'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_request.status = 'received'
        return_request.received_at = timezone.now()
        return_request.save()
        
        serializer = self.get_serializer(return_request)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def complete_inspection(self, request, pk=None):
        """Complete inspection"""
        return_request = self.get_object()
        if return_request.status != 'inspecting':
            return Response(
                {'error': 'Return must be under inspection'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        condition = request.data.get('condition', 'good')
        inspection_notes = request.data.get('inspection_notes', '')
        damage_assessment = request.data.get('damage_assessment', '')
        damage_cost = request.data.get('damage_cost', 0)
        
        return_request.inspection_notes = inspection_notes
        return_request.damage_assessment = damage_assessment
        return_request.damage_cost = damage_cost
        return_request.inspector = request.user
        return_request.inspection_date = timezone.now()
        
        if condition in ['excellent', 'good', 'fair']:
            return_request.status = 'accepted'
        elif condition == 'damaged':
            return_request.status = 'damaged'
        else:
            return_request.status = 'rejected'
        
        return_request.save()
        
        # Update return items
        items_data = request.data.get('items', [])
        for item_data in items_data:
            item_id = item_data.get('id')
            if item_id:
                item = return_request.items.get(id=item_id)
                item.condition = item_data.get('condition', condition)
                item.notes = item_data.get('notes', '')
                item.save()
        
        serializer = self.get_serializer(return_request)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_returns(self, request):
        """Get current user's returns"""
        my_returns = self.queryset.filter(booking__user=request.user)
        serializer = self.get_serializer(my_returns, many=True)
        return Response(serializer.data)


class RefundViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing refunds
    """
    queryset = Refund.objects.select_related('return_request__booking').all()
    serializer_class = RefundSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'refund_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def process_refund(self, request, pk=None):
        """Process refund"""
        refund = self.get_object()
        if refund.status != 'approved':
            return Response(
                {'error': 'Refund must be approved to process'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refund.status = 'processed'
        refund.processed_at = timezone.now()
        transaction_ref = request.data.get('transaction_reference', '')
        if transaction_ref:
            refund.transaction_reference = transaction_ref
        refund.save()
        
        serializer = self.get_serializer(refund)
        return Response(serializer.data)

