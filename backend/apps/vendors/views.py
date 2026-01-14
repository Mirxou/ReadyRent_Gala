"""
Views for Vendors app
"""
from rest_framework import generics, viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Vendor, VendorProduct, Commission, VendorPerformance
from .serializers import (
    VendorSerializer, VendorProductSerializer, CommissionSerializer,
    VendorPerformanceSerializer
)


class VendorRegistrationView(generics.CreateAPIView):
    """Vendor registration"""
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        # Check if user already has a vendor profile
        if hasattr(self.request.user, 'vendor_profile'):
            raise ValidationError('User already has a vendor profile')
        serializer.save(user=self.request.user, status='pending')


class VendorProfileView(generics.RetrieveUpdateAPIView):
    """Get and update vendor profile"""
    serializer_class = VendorSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        if not hasattr(self.request.user, 'vendor_profile'):
            raise ValidationError('Vendor profile not found')
        return self.request.user.vendor_profile


class VendorListView(generics.ListAPIView):
    """List vendors"""
    serializer_class = VendorSerializer
    permission_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_verified', 'city']
    search_fields = ['business_name', 'business_name_ar', 'description', 'description_ar']
    ordering_fields = ['created_at', 'rating', 'total_sales']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Vendor.objects.select_related('user', 'verified_by').all()
        # Only show active vendors to public
        if not self.request.user.is_authenticated or self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(status='active', is_verified=True)
        return queryset


class VendorDetailView(generics.RetrieveAPIView):
    """Get vendor details"""
    serializer_class = VendorSerializer
    permission_classes = []
    queryset = Vendor.objects.select_related('user', 'verified_by').prefetch_related('products__product')


class VendorProductListView(generics.ListCreateAPIView):
    """List and add vendor products"""
    serializer_class = VendorProductSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['vendor']
    ordering_fields = ['added_at']
    ordering = ['-added_at']
    
    def get_queryset(self):
        queryset = VendorProduct.objects.select_related('vendor', 'product')
        # Vendors can only see their own products unless admin
        if self.request.user.role not in ['admin', 'staff']:
            if not hasattr(self.request.user, 'vendor_profile'):
                return queryset.none()
            queryset = queryset.filter(vendor=self.request.user.vendor_profile)
        return queryset
    
    def perform_create(self, serializer):
        # Auto-assign vendor if user is a vendor
        if hasattr(self.request.user, 'vendor_profile'):
            serializer.save(vendor=self.request.user.vendor_profile)
        else:
            raise ValidationError('User is not a vendor')


class VendorDashboardView(generics.GenericAPIView):
    """Vendor dashboard statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        if not hasattr(request.user, 'vendor_profile'):
            return Response(
                {'error': 'Vendor profile not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        vendor = request.user.vendor_profile
        
        # Calculate stats
        total_products = vendor.products.count()
        total_bookings = Commission.objects.filter(vendor=vendor).count()
        total_revenue = Commission.objects.filter(vendor=vendor).aggregate(
            total=Sum('sale_amount')
        )['total'] or 0
        total_commission = Commission.objects.filter(vendor=vendor).aggregate(
            total=Sum('commission_amount')
        )['total'] or 0
        pending_commission = Commission.objects.filter(
            vendor=vendor,
            status='pending'
        ).aggregate(total=Sum('commission_amount'))['total'] or 0
        
        # Recent bookings
        recent_bookings = Commission.objects.filter(vendor=vendor).order_by('-calculated_at')[:10]
        
        stats = {
            'vendor': VendorSerializer(vendor).data,
            'total_products': total_products,
            'total_bookings': total_bookings,
            'total_revenue': float(total_revenue),
            'total_commission': float(total_commission),
            'pending_commission': float(pending_commission),
            'recent_bookings': CommissionSerializer(recent_bookings, many=True).data,
        }
        
        return Response(stats)


# Admin Views
class AdminVendorViewSet(viewsets.ModelViewSet):
    """Admin vendor management"""
    queryset = Vendor.objects.select_related('user', 'verified_by').all()
    serializer_class = VendorSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_verified']
    search_fields = ['business_name', 'business_name_ar', 'user__email']
    ordering_fields = ['created_at', 'total_sales', 'rating']
    ordering = ['-created_at']
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve vendor"""
        vendor = self.get_object()
        vendor.status = 'active'
        vendor.is_verified = True
        vendor.verified_at = timezone.now()
        vendor.verified_by = request.user
        vendor.save()
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend vendor"""
        vendor = self.get_object()
        vendor.status = 'suspended'
        vendor.save()
        serializer = self.get_serializer(vendor)
        return Response(serializer.data)


class AdminCommissionListView(generics.ListAPIView):
    """List all commissions (admin only)"""
    serializer_class = CommissionSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['vendor', 'status']
    ordering_fields = ['calculated_at']
    ordering = ['-calculated_at']
    queryset = Commission.objects.select_related('vendor', 'product', 'booking').all()


class AdminCommissionProcessView(generics.GenericAPIView):
    """Process commission payment (admin only)"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        payment_reference = request.data.get('payment_reference', '')
        
        try:
            commission = Commission.objects.get(pk=pk)
            if commission.status != 'calculated':
                return Response(
                    {'error': 'Commission must be calculated before payment'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            commission.status = 'paid'
            commission.paid_at = timezone.now()
            commission.payment_reference = payment_reference
            commission.save()
            
            serializer = CommissionSerializer(commission)
            return Response(serializer.data)
        except Commission.DoesNotExist:
            return Response(
                {'error': 'Commission not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class VendorPerformanceListView(generics.ListAPIView):
    """List vendor performance records"""
    serializer_class = VendorPerformanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['vendor']
    ordering_fields = ['period_end']
    ordering = ['-period_end']
    
    def get_queryset(self):
        queryset = VendorPerformance.objects.select_related('vendor')
        # Vendors can only see their own performance unless admin
        if self.request.user.role not in ['admin', 'staff']:
            if not hasattr(self.request.user, 'vendor_profile'):
                return queryset.none()
            queryset = queryset.filter(vendor=self.request.user.vendor_profile)
        return queryset

