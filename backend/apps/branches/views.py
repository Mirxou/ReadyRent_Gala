"""
Views for Branches app
"""
from rest_framework import generics, viewsets, status, filters
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Count, Sum, Avg, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import Branch, BranchInventory, BranchStaff, BranchPerformance
from .serializers import (
    BranchSerializer, BranchInventorySerializer, BranchStaffSerializer,
    BranchPerformanceSerializer
)


class BranchListView(generics.ListAPIView):
    """List branches"""
    serializer_class = BranchSerializer
    permission_classes = []
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'city']
    search_fields = ['name', 'name_ar', 'address', 'city']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        queryset = Branch.objects.select_related('manager').prefetch_related('staff_members')
        # Only show active branches to public
        if not self.request.user.is_authenticated or self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(is_active=True)
        return queryset


class BranchDetailView(generics.RetrieveAPIView):
    """Get branch details"""
    serializer_class = BranchSerializer
    permission_classes = []
    queryset = Branch.objects.select_related('manager').prefetch_related('staff_members', 'inventory_items')


class BranchInventoryListView(generics.ListAPIView):
    """List branch inventory"""
    serializer_class = BranchInventorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'product']
    ordering_fields = ['quantity_available', 'updated_at']
    ordering = ['-quantity_available']
    
    def get_queryset(self):
        queryset = BranchInventory.objects.select_related('branch', 'product')
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        return queryset


class BranchInventoryDetailView(generics.RetrieveUpdateAPIView):
    """Get and update branch inventory"""
    serializer_class = BranchInventorySerializer
    permission_classes = [IsAuthenticated]
    queryset = BranchInventory.objects.select_related('branch', 'product')


class BranchStaffListView(generics.ListCreateAPIView):
    """List and add branch staff"""
    serializer_class = BranchStaffSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch', 'staff', 'is_active']
    ordering_fields = ['assigned_at']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        queryset = BranchStaff.objects.select_related('branch', 'staff')
        # Staff can only see their own assignments unless admin
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(staff=self.request.user)
        return queryset


class BranchPerformanceListView(generics.ListAPIView):
    """List branch performance records"""
    serializer_class = BranchPerformanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['branch']
    ordering_fields = ['period_end']
    ordering = ['-period_end']
    queryset = BranchPerformance.objects.select_related('branch')


class BranchStatsView(generics.GenericAPIView):
    """Get branch statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            branch = Branch.objects.get(pk=pk)
            
            # Calculate stats
            total_products = branch.inventory_items.count()
            total_available = branch.inventory_items.filter(quantity_available__gt=0).count()
            total_staff = branch.staff_members.filter(is_active=True).count()
            
            # Get recent performance
            recent_performance = BranchPerformance.objects.filter(branch=branch).order_by('-period_end').first()
            
            stats = {
                'branch': BranchSerializer(branch).data,
                'total_products': total_products,
                'total_available': total_available,
                'total_staff': total_staff,
                'recent_performance': BranchPerformanceSerializer(recent_performance).data if recent_performance else None,
            }
            
            return Response(stats)
        except Branch.DoesNotExist:
            return Response(
                {'error': 'Branch not found'},
                status=status.HTTP_404_NOT_FOUND
            )


# Admin Views
class AdminBranchViewSet(viewsets.ModelViewSet):
    """Admin branch management"""
    queryset = Branch.objects.select_related('manager').prefetch_related('staff_members')
    serializer_class = BranchSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'city']
    search_fields = ['name', 'name_ar', 'code', 'address']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']


class AdminBranchInventoryViewSet(viewsets.ModelViewSet):
    """Admin branch inventory management"""
    queryset = BranchInventory.objects.select_related('branch', 'product')
    serializer_class = BranchInventorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['branch', 'product']
    search_fields = ['product__name', 'product__name_ar', 'branch__name']
    ordering_fields = ['quantity_available', 'updated_at']
    ordering = ['-quantity_available']


