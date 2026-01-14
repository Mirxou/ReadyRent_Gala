from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg
from decimal import Decimal
from .models import BundleCategory, Bundle, BundleItem, BundleBooking, BundleReview
from .serializers import (
    BundleCategorySerializer, BundleSerializer, BundleItemSerializer,
    BundleBookingSerializer, BundleReviewSerializer
)


class BundleCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing bundle categories
    """
    queryset = BundleCategory.objects.filter(is_active=True).prefetch_related('bundles')
    serializer_class = BundleCategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'name_ar']
    permission_classes = []


class BundleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing bundles
    """
    queryset = Bundle.objects.filter(is_active=True).select_related('category').prefetch_related('items__product')
    serializer_class = BundleSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    search_fields = ['name', 'name_ar', 'description']
    ordering_fields = ['bundle_price', 'rating', 'created_at', 'total_bookings']
    ordering = ['-is_featured', '-created_at']
    permission_classes = []
    
    @action(detail=True, methods=['get'], permission_classes=[])
    def calculate_price(self, request, pk=None):
        """Calculate bundle price for given dates"""
        bundle = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': 'start_date and end_date are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from datetime import datetime
        try:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            days = (end - start).days + 1
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if days < bundle.min_days:
            return Response(
                {'error': f'Minimum {bundle.min_days} days required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if bundle.max_days and days > bundle.max_days:
            return Response(
                {'error': f'Maximum {bundle.max_days} days allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate base price for the period
        base_price = bundle.base_price * days
        bundle_price = bundle.bundle_price * days
        discount_amount = bundle.get_discount_amount() * days
        savings = base_price - bundle_price
        
        return Response({
            'days': days,
            'base_price': float(base_price),
            'bundle_price': float(bundle_price),
            'discount_amount': float(discount_amount),
            'savings': float(savings),
            'discount_percentage': float(bundle.get_discount_percentage())
        })


class BundleBookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bundle bookings
    """
    queryset = BundleBooking.objects.select_related('bundle', 'user').prefetch_related('individual_bookings')
    serializer_class = BundleBookingSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'bundle', 'user']
    ordering_fields = ['created_at', 'start_date']
    ordering = ['-created_at']
    
    def get_permissions(self):
        if self.action in ['create', 'list', 'retrieve']:
            return [IsAuthenticated()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        """Filter bookings by user"""
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return self.queryset
        return self.queryset.filter(user=user)
    
    def perform_create(self, serializer):
        """Create bundle booking with price calculation"""
        bundle = serializer.validated_data['bundle']
        start_date = serializer.validated_data['start_date']
        end_date = serializer.validated_data['end_date']
        days = serializer.validated_data['total_days']
        
        # Calculate prices
        base_price = bundle.base_price * days
        bundle_price = bundle.bundle_price * days
        discount_amount = bundle.get_discount_amount() * days
        
        serializer.save(
            user=self.request.user,
            base_price=base_price,
            discount_amount=discount_amount,
            total_price=bundle_price
        )
        
        # Create individual bookings for each bundle item
        from apps.bookings.models import Booking
        
        individual_bookings_list = []
        for bundle_item in bundle.items.filter(is_required=True):
            if bundle_item.product:
                # Calculate price for this item (proportional to bundle discount)
                item_base_price = bundle_item.get_price() * total_days
                # Apply same discount percentage as bundle
                discount_percentage = bundle.get_discount_percentage()
                item_discount = (item_base_price * discount_percentage) / 100
                item_total_price = item_base_price - item_discount
                
                # Create individual booking
                individual_booking = Booking.objects.create(
                    user=request.user,
                    product=bundle_item.product,
                    start_date=start_date,
                    end_date=end_date,
                    total_days=total_days,
                    total_price=item_total_price,
                    status='pending',
                    notes=f'جزء من حزمة: {bundle.name_ar}'
                )
                individual_bookings_list.append(individual_booking)
        
        # Link individual bookings to bundle booking
        if individual_bookings_list:
            bundle_booking.individual_bookings.set(individual_bookings_list)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_bookings(self, request):
        """Get current user's bundle bookings"""
        my_bookings = self.queryset.filter(user=request.user)
        serializer = self.get_serializer(my_bookings, many=True)
        return Response(serializer.data)


class BundleReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing bundle reviews
    """
    queryset = BundleReview.objects.select_related('bundle_booking__bundle', 'bundle_booking__user')
    serializer_class = BundleReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create review and update bundle rating"""
        review = serializer.save()
        
        # Update bundle rating
        bundle = review.bundle_booking.bundle
        reviews = BundleReview.objects.filter(bundle_booking__bundle=bundle)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        bundle.rating = Decimal(str(avg_rating or 0))
        bundle.save()

