from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from .models import PackagingType, PackagingMaterial, PackagingRule, PackagingInstance
from .serializers import (
    PackagingTypeSerializer, PackagingMaterialSerializer,
    PackagingRuleSerializer, PackagingInstanceSerializer
)


class PackagingTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PackagingType.objects.filter(is_active=True)
    serializer_class = PackagingTypeSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['size']
    search_fields = ['name', 'name_ar']
    permission_classes = []


class PackagingMaterialViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PackagingMaterial.objects.filter(is_active=True)
    serializer_class = PackagingMaterialSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['material_type', 'is_reusable']
    search_fields = ['name', 'name_ar']
    permission_classes = []


class PackagingRuleViewSet(viewsets.ModelViewSet):
    queryset = PackagingRule.objects.filter(is_active=True).select_related('product', 'product_category', 'packaging_type')
    serializer_class = PackagingRuleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['product_category', 'product', 'packaging_type']
    permission_classes = [IsAdminUser]


class PackagingInstanceViewSet(viewsets.ModelViewSet):
    queryset = PackagingInstance.objects.select_related('booking', 'packaging_type', 'prepared_by').prefetch_related('materials_used')
    serializer_class = PackagingInstanceSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['booking', 'status', 'packaging_type']
    ordering_fields = ['prepared_at']
    ordering = ['-prepared_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def suggested_for_booking(self, request):
        """Get suggested packaging for a booking"""
        from apps.bookings.models import Booking
        booking_id = request.query_params.get('booking_id')
        product_id = request.query_params.get('product_id')
        rental_days = request.query_params.get('rental_days')
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from apps.products.models import Product
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Find matching packaging rule
        rule = PackagingRule.objects.filter(
            is_active=True,
        ).filter(
            models.Q(product=product) | models.Q(product_category=product.category)
        ).order_by('-priority').first()
        
        if not rule:
            # Default packaging
            default_type = PackagingType.objects.filter(is_active=True, size='medium').first()
            if not default_type:
                default_type = PackagingType.objects.filter(is_active=True).first()
            
            if default_type:
                serializer = PackagingTypeSerializer(default_type)
                return Response({
                    'suggested_packaging': serializer.data,
                    'reason': 'Default packaging'
                })
            return Response({'suggested_packaging': None})
        
        # Check rental days condition
        if rental_days:
            try:
                rental_days = int(rental_days)
                if rule.min_rental_days and rental_days < rule.min_rental_days:
                    return Response({'suggested_packaging': None, 'reason': 'Rental period too short'})
                if rule.max_rental_days and rental_days > rule.max_rental_days:
                    return Response({'suggested_packaging': None, 'reason': 'Rental period too long'})
            except ValueError:
                pass
        
        serializer = PackagingTypeSerializer(rule.packaging_type)
        return Response({
            'suggested_packaging': serializer.data,
            'reason': f'Based on product category: {product.category.name_ar}' if product.category else 'Based on product'
        })

