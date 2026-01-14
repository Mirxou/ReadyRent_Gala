from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from .models import InventoryItem, StockAlert, StockMovement
from .serializers import InventoryItemSerializer, StockAlertSerializer, StockMovementSerializer


class InventoryItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing inventory items
    """
    queryset = InventoryItem.objects.select_related('product').all()
    serializer_class = InventoryItemSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'quantity_available', 'low_stock_threshold']  # Only actual model fields
    search_fields = ['product__name', 'product__name_ar', 'product__slug']
    ordering_fields = ['quantity_available', 'created_at', 'updated_at']
    ordering = ['-updated_at']
    
    def get_queryset(self):
        """Allow filtering by stock status using query parameters"""
        queryset = super().get_queryset()
        
        # Filter by low stock status (using quantity_available <= low_stock_threshold)
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock is not None:
            from django.db.models import F
            low_stock = low_stock.lower() == 'true'
            if low_stock:
                queryset = queryset.filter(
                    quantity_available__lte=F('low_stock_threshold')
                )
            else:
                queryset = queryset.filter(
                    quantity_available__gt=F('low_stock_threshold')
                )
        
        # Filter by in stock status
        in_stock = self.request.query_params.get('in_stock', None)
        if in_stock is not None:
            in_stock = in_stock.lower() == 'true'
            if in_stock:
                queryset = queryset.filter(quantity_available__gt=0)
            else:
                queryset = queryset.filter(quantity_available=0)
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def adjust_stock(self, request, pk=None):
        """Adjust stock manually"""
        inventory_item = self.get_object()
        quantity_change = request.data.get('quantity_change', 0)
        notes = request.data.get('notes', '')
        
        try:
            quantity_change = int(quantity_change)
            previous_quantity = inventory_item.quantity_available
            
            if quantity_change > 0:
                # Stock in
                inventory_item.quantity_total += quantity_change
                inventory_item.quantity_available += quantity_change
                movement_type = 'in'
            elif quantity_change < 0:
                # Stock out
                if abs(quantity_change) > inventory_item.quantity_available:
                    return Response(
                        {'error': 'Cannot reduce stock below available quantity'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                inventory_item.quantity_available += quantity_change  # quantity_change is negative
                movement_type = 'out'
            else:
                return Response(
                    {'error': 'Quantity change must not be zero'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            inventory_item.save()
            
            # Record movement
            StockMovement.objects.create(
                inventory_item=inventory_item,
                movement_type='adjustment',
                quantity=abs(quantity_change),
                previous_quantity=previous_quantity,
                new_quantity=inventory_item.quantity_available,
                notes=notes,
                created_by=request.user
            )
            
            serializer = self.get_serializer(inventory_item)
            return Response(serializer.data)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity_change value'},
                status=status.HTTP_400_BAD_REQUEST
            )


class StockAlertViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing stock alerts
    """
    queryset = StockAlert.objects.select_related('inventory_item__product', 'acknowledged_by').all()
    serializer_class = StockAlertSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'alert_type']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAdminUser]
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def acknowledge(self, request, pk=None):
        """Acknowledge an alert"""
        alert = self.get_object()
        alert.status = 'acknowledged'
        alert.acknowledged_by = request.user
        from django.utils import timezone
        alert.acknowledged_at = timezone.now()
        alert.save()
        
        serializer = self.get_serializer(alert)
        return Response(serializer.data)


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing stock movements
    """
    queryset = StockMovement.objects.select_related('inventory_item__product', 'created_by').all()
    serializer_class = StockMovementSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['movement_type', 'inventory_item']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    permission_classes = [IsAdminUser]

