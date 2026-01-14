from rest_framework import viewsets, filters, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.exceptions import ValidationError
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from datetime import timedelta
from django.db import models
from .models import WarrantyPlan, WarrantyPurchase, WarrantyClaim, InsurancePlan
from .serializers import (
    WarrantyPlanSerializer, WarrantyPurchaseSerializer, WarrantyClaimSerializer,
    InsurancePlanSerializer
)
from .services import InsuranceService
from apps.products.models import Product


class WarrantyPlanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WarrantyPlan.objects.filter(is_active=True)
    serializer_class = WarrantyPlanSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan_type', 'coverage_type', 'is_featured']
    search_fields = ['name', 'name_ar']
    ordering_fields = ['price', 'created_at']
    ordering = ['plan_type', 'price']
    permission_classes = []
    
    @action(detail=True, methods=['get'], permission_classes=[])
    def calculate_price(self, request, pk=None):
        """Calculate warranty price for a rental price"""
        plan = self.get_object()
        rental_price = request.query_params.get('rental_price', 0)
        
        try:
            rental_price = float(rental_price)
            warranty_price = plan.calculate_price(rental_price)
            return Response({
                'warranty_price': float(warranty_price),
                'coverage_amount': float(plan.max_coverage_amount or 0),
                'deductible': float(plan.deductible)
            })
        except ValueError:
            return Response(
                {'error': 'Invalid rental_price'},
                status=status.HTTP_400_BAD_REQUEST
            )


class WarrantyPurchaseViewSet(viewsets.ModelViewSet):
    queryset = WarrantyPurchase.objects.select_related('booking', 'warranty_plan')
    serializer_class = WarrantyPurchaseSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'booking', 'warranty_plan']
    ordering_fields = ['purchased_at']
    ordering = ['-purchased_at']
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return self.queryset
        return self.queryset.filter(booking__user=user)


class WarrantyClaimViewSet(viewsets.ModelViewSet):
    queryset = WarrantyClaim.objects.select_related('warranty_purchase__booking', 'reviewed_by')
    serializer_class = WarrantyClaimSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'claim_type']
    ordering_fields = ['submitted_at']
    ordering = ['-submitted_at']
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return self.queryset
        return self.queryset.filter(warranty_purchase__booking__user=user)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def approve(self, request, pk=None):
        """Approve a warranty claim"""
        claim = self.get_object()
        approved_amount = request.data.get('approved_amount', claim.claim_amount)
        review_notes = request.data.get('review_notes', '')
        
        claim.status = 'approved'
        claim.approved_amount = approved_amount
        claim.review_notes = review_notes
        claim.reviewed_by = request.user
        claim.reviewed_at = timezone.now()
        claim.save()
        
        serializer = self.get_serializer(claim)
        return Response(serializer.data)


# Insurance Plan Views
class InsurancePlanListView(generics.ListAPIView):
    """List available insurance plans"""
    serializer_class = InsurancePlanSerializer
    permission_classes = []
    queryset = InsurancePlan.objects.filter(is_active=True)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        product_id = self.request.query_params.get('product_id')
        if product_id:
            try:
                product = Product.objects.get(pk=product_id)
                # Use product price as value for calculations
                context['product_value'] = float(product.price_per_day * 30)  # Approximate monthly value
            except Product.DoesNotExist:
                pass
        return context


class InsurancePlanDetailView(generics.RetrieveAPIView):
    """Get insurance plan details"""
    serializer_class = InsurancePlanSerializer
    permission_classes = []
    queryset = InsurancePlan.objects.filter(is_active=True)
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        product_id = self.request.query_params.get('product_id')
        if product_id:
            try:
                product = Product.objects.get(pk=product_id)
                context['product_value'] = float(product.price_per_day * 30)
            except Product.DoesNotExist:
                pass
        return context


class InsuranceCalculatorView(generics.GenericAPIView):
    """Calculate insurance price and coverage"""
    permission_classes = []
    
    def get(self, request):
        plan_id = request.query_params.get('plan_id')
        product_value = request.query_params.get('product_value')
        
        if not plan_id or not product_value:
            return Response(
                {'error': 'plan_id and product_value are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            plan = InsurancePlan.objects.get(pk=plan_id, is_active=True)
            product_value = float(product_value)
            
            price = plan.calculate_price(product_value)
            coverage = plan.calculate_coverage(product_value)
            deductible = plan.calculate_deductible(coverage)
            
            return Response({
                'plan': InsurancePlanSerializer(plan).data,
                'product_value': product_value,
                'insurance_price': float(price),
                'max_coverage': float(coverage),
                'deductible': float(deductible),
                'net_coverage': float(coverage - deductible),
            })
        except InsurancePlan.DoesNotExist:
            return Response(
                {'error': 'Insurance plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Invalid product_value'},
                status=status.HTTP_400_BAD_REQUEST
            )


class RecommendedInsuranceView(generics.GenericAPIView):
    """Get recommended insurance plan for a product"""
    permission_classes = []
    
    def get(self, request):
        product_id = request.query_params.get('product_id')
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(pk=product_id)
            product_value = float(product.price_per_day * 30)  # Approximate monthly value
            
            recommended_plan = InsuranceService.get_recommended_plan(
                product_value,
                product.category.id
            )
            
            if recommended_plan:
                serializer = InsurancePlanSerializer(
                    recommended_plan,
                    context={'product_value': product_value}
                )
                return Response({
                    'recommended_plan': serializer.data,
                    'product_value': product_value,
                })
            else:
                return Response({
                    'message': 'No insurance plan available',
                    'product_value': product_value,
                })
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class InsuranceClaimCreateView(generics.CreateAPIView):
    """Create insurance claim"""
    serializer_class = WarrantyClaimSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        warranty_purchase_id = self.request.data.get('warranty_purchase')
        try:
            from .models import WarrantyPurchase
            warranty_purchase = WarrantyPurchase.objects.get(pk=warranty_purchase_id)
            
            # Check permissions
            if warranty_purchase.booking.user != self.request.user:
                raise ValidationError('Permission denied')
            
            serializer.save()
        except WarrantyPurchase.DoesNotExist:
            raise ValidationError('Warranty purchase not found')


class AdminInsuranceClaimProcessView(generics.GenericAPIView):
    """Process insurance claim (admin only)"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, pk):
        action_type = request.data.get('action')  # 'approve' or 'reject'
        approved_amount = request.data.get('approved_amount')
        reason = request.data.get('reason', '')
        
        try:
            claim = WarrantyClaim.objects.get(pk=pk)
            
            if action_type == 'approve':
                from .services import InsuranceService
                InsuranceService.process_insurance_claim(claim, approved_amount)
                claim.reviewed_by = request.user
                claim.review_notes = reason
                claim.save()
            elif action_type == 'reject':
                from .services import InsuranceService
                InsuranceService.reject_insurance_claim(claim, reason)
                claim.reviewed_by = request.user
                claim.save()
            else:
                return Response(
                    {'error': 'Invalid action. Use "approve" or "reject"'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            serializer = WarrantyClaimSerializer(claim)
            return Response(serializer.data)
        except WarrantyClaim.DoesNotExist:
            return Response(
                {'error': 'Claim not found'},
                status=status.HTTP_404_NOT_FOUND
            )

