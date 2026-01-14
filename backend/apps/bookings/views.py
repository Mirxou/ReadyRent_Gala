"""
Views for Booking app
"""
from rest_framework import generics, status, filters
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from django.db.models import Count, Sum, Q
from django_filters.rest_framework import DjangoFilterBackend
from .models import (
    Booking, Cart, CartItem, Waitlist,
    DamageAssessment, DamagePhoto, InspectionChecklist, DamageClaim,
    Refund, Cancellation
)
from .serializers import (
    BookingSerializer, BookingUpdateSerializer, CartSerializer, CartItemSerializer,
    WaitlistSerializer, DamageAssessmentSerializer, DamagePhotoSerializer,
    InspectionChecklistSerializer, DamageClaimSerializer,
    RefundSerializer, CancellationSerializer
)
from .services import BookingService
from .availability_service import AvailabilityService
from .policies import CancellationPolicy, RefundPolicy
from apps.products.models import Product
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


class CartView(generics.RetrieveAPIView):
    """Get user's cart"""
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        cart, created = Cart.objects.get_or_create(user=self.request.user)
        return cart


class CartItemCreateView(generics.CreateAPIView):
    """Add item to cart"""
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(cart=cart)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CartItemDeleteView(generics.DestroyAPIView):
    """Remove item from cart"""
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        return CartItem.objects.filter(cart=cart)


class BookingCreateView(generics.CreateAPIView):
    """Create booking from cart"""
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        items = cart.items.all()
        
        if not items.exists():
            return Response(
                {'error': 'Cart is empty'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get same-day delivery option from request data
        same_day_delivery = request.data.get('same_day_delivery', False) if hasattr(request, 'data') else False
        
        bookings = []
        for item in items:
            # Check availability before creating booking
            availability = AvailabilityService.check_availability(
                product_id=item.product.id,
                start_date=item.start_date,
                end_date=item.end_date
            )
            
            if not availability['available']:
                return Response(
                    {
                        'error': availability['message'],
                        'reason': availability['reason'],
                        'product_id': item.product.id,
                        'product_name': item.product.name_ar
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calculate total days and price
            total_days = (item.end_date - item.start_date).days + 1
            total_price = item.product.price_per_day * total_days * item.quantity
            
            booking = Booking.objects.create(
                user=request.user,
                product=item.product,
                start_date=item.start_date,
                end_date=item.end_date,
                total_days=total_days,
                total_price=total_price,
                status='pending'
            )
            bookings.append(booking)
            
            # Invalidate availability cache
            AvailabilityService.invalidate_cache(
                product_id=item.product.id,
                start_date=item.start_date,
                end_date=item.end_date
            )
            
            # Create delivery request if same-day delivery is requested
            if same_day_delivery:
                from apps.locations.models import DeliveryRequest
                from apps.locations.services import LocationService
                
                # Get user's default address
                from apps.locations.models import Address
                default_address = Address.objects.filter(
                    user=request.user,
                    is_default=True
                ).first()
                
                if default_address and default_address.latitude and default_address.longitude:
                    # Find delivery zone
                    zone = LocationService.find_delivery_zone(
                        float(default_address.latitude),
                        float(default_address.longitude)
                    )
                    
                    # Check same-day availability
                    same_day_info = None
                    if zone:
                        same_day_info = LocationService.check_same_day_delivery_available(zone)
                    
                    # Create delivery request
                    if same_day_info and same_day_info.get('available'):
                        DeliveryRequest.objects.create(
                            booking=booking,
                            delivery_type='delivery',
                            delivery_address=default_address,
                            delivery_zone=zone,
                            delivery_date=item.start_date,
                            delivery_fee=same_day_info.get('fee', 0),
                            status='pending'
                        )
        
        # Clear cart
        items.delete()
        
        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BookingListView(generics.ListAPIView):
    """List user's bookings"""
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related('product', 'user')


class BookingDetailView(generics.RetrieveAPIView):
    """Get booking details"""
    serializer_class = BookingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related('product', 'user')


# Admin Views
class AdminBookingListView(generics.ListAPIView):
    """List all bookings for admin"""
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'product', 'user']
    search_fields = ['user__email', 'product__name', 'product__name_ar']
    ordering_fields = ['created_at', 'start_date', 'end_date', 'total_price']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return Booking.objects.select_related('product', 'user').prefetch_related('product__images').all()


class AdminBookingUpdateView(generics.UpdateAPIView):
    """Update booking (admin only)"""
    serializer_class = BookingSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return Booking.objects.select_related('product', 'user').all()


class BookingUpdateView(generics.UpdateAPIView):
    """Update booking (user can update their own bookings)"""
    serializer_class = BookingUpdateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user).select_related('product', 'user')
    
    def get_serializer_class(self):
        # Use BookingSerializer for admin, BookingUpdateSerializer for users
        if self.request.user.role in ['admin', 'staff']:
            return BookingSerializer
        return BookingUpdateSerializer


class BookingStatusUpdateView(generics.GenericAPIView):
    """Update booking status only"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions: user can only update their own bookings unless admin
            if booking.user != request.user and request.user.role not in ['admin', 'staff']:
                return Response(
                    {'error': 'You do not have permission to update this booking'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            new_status = request.data.get('status')
            if not new_status:
                return Response(
                    {'error': 'Status is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Validate status transition
            valid_statuses = ['pending', 'confirmed', 'in_use', 'completed', 'cancelled']
            if new_status not in valid_statuses:
                return Response(
                    {'error': 'Invalid status'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            booking.status = new_status
            booking.save()
            
            # Send real-time update via WebSocket (non-blocking)
            try:
                channel_layer = get_channel_layer()
                if channel_layer:
                    room_group_name = f'bookings_{booking.user.id}'
                    async_to_sync(channel_layer.group_send)(
                        room_group_name,
                        {
                            'type': 'booking_update',
                            'booking': {
                                'id': booking.id,
                                'status': booking.status,
                                'product_id': booking.product.id,
                                'product_name': booking.product.name_ar,
                                'start_date': booking.start_date.isoformat(),
                                'end_date': booking.end_date.isoformat(),
                                'total_price': str(booking.total_price),
                                'updated_at': booking.updated_at.isoformat(),
                            }
                        }
                    )
            except Exception as e:
                # Log error but don't fail the update
                import logging
                logger = logging.getLogger(__name__)
                logger.warning(f"Failed to send booking update via WebSocket (non-critical): {e}")
            
            serializer = BookingSerializer(booking)
            return Response(serializer.data)
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class BookingCancelView(generics.GenericAPIView):
    """Cancel booking with refund processing"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions
            if booking.user != request.user and request.user.role not in ['admin', 'staff']:
                return Response(
                    {'error': 'You do not have permission to cancel this booking'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            reason = request.data.get('reason', '')
            
            # Cancel booking using service
            try:
                cancellation, refund = BookingService.cancel_booking(booking, request.user, reason)
                
                # Calculate fee info for response
                fee_info = CancellationPolicy.calculate_cancellation_fee(booking)
                
                return Response({
                    'message': 'Booking cancelled successfully',
                    'cancellation': CancellationSerializer(cancellation).data,
                    'refund': RefundSerializer(refund).data if refund else None,
                    'fee_info': fee_info,
                })
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class CancellationPolicyView(generics.GenericAPIView):
    """Get cancellation policy information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions
            if booking.user != request.user and request.user.role not in ['admin', 'staff']:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if can cancel
            can_cancel, message = CancellationPolicy.can_cancel(booking)
            
            # Calculate fee info
            fee_info = CancellationPolicy.calculate_cancellation_fee(booking)
            
            return Response({
                'can_cancel': can_cancel,
                'message': message,
                'fee_info': fee_info,
                'policy': {
                    'cancellation_fees': CancellationPolicy.CANCELLATION_FEES,
                    'no_refund_after_start': CancellationPolicy.NO_REFUND_AFTER_START,
                    'early_return_refund_rate': CancellationPolicy.EARLY_RETURN_REFUND_RATE,
                }
            })
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class EarlyReturnView(generics.GenericAPIView):
    """Process early return"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
            
            # Check permissions
            if booking.user != request.user and request.user.role not in ['admin', 'staff']:
                return Response(
                    {'error': 'Permission denied'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            return_date_str = request.data.get('return_date')
            if not return_date_str:
                return Response(
                    {'error': 'return_date is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            from datetime import datetime
            return_date = datetime.strptime(return_date_str, '%Y-%m-%d').date()
            
            try:
                refund, refund_info = BookingService.process_early_return(booking, return_date, request.user)
                
                return Response({
                    'message': 'Early return processed',
                    'refund': RefundSerializer(refund).data if refund else None,
                    'refund_info': refund_info,
                })
            except ValueError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except Booking.DoesNotExist:
            return Response(
                {'error': 'Booking not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class RefundListView(generics.ListAPIView):
    """List user's refunds"""
    serializer_class = RefundSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Refund.objects.filter(booking__user=self.request.user).select_related('booking')
        return queryset


class AdminBookingStatsView(generics.GenericAPIView):
    """Get booking statistics for admin dashboard"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        
        # Total stats
        total_bookings = Booking.objects.count()
        pending_bookings = Booking.objects.filter(status='pending').count()
        confirmed_bookings = Booking.objects.filter(status='confirmed').count()
        in_use_bookings = Booking.objects.filter(status='in_use').count()
        completed_bookings = Booking.objects.filter(status='completed').count()
        cancelled_bookings = Booking.objects.filter(status='cancelled').count()
        
        # Revenue stats
        total_revenue = Booking.objects.filter(status__in=['confirmed', 'in_use', 'completed']).aggregate(
            total=Sum('total_price')
        )['total'] or 0
        
        this_month_revenue = Booking.objects.filter(
            status__in=['confirmed', 'in_use', 'completed'],
            created_at__gte=this_month_start
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        last_month_revenue = Booking.objects.filter(
            status__in=['confirmed', 'in_use', 'completed'],
            created_at__gte=last_month_start,
            created_at__lte=last_month_end
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Today's stats
        today_bookings = Booking.objects.filter(
            created_at__date=today
        ).count()
        
        today_revenue = Booking.objects.filter(
            created_at__date=today,
            status__in=['confirmed', 'in_use', 'completed']
        ).aggregate(total=Sum('total_price'))['total'] or 0
        
        # Upcoming bookings
        upcoming_bookings = Booking.objects.filter(
            start_date__gte=today,
            status__in=['pending', 'confirmed']
        ).count()
        
        # Status breakdown
        status_breakdown = Booking.objects.values('status').annotate(
            count=Count('id')
        )
        
        stats = {
            'totals': {
                'bookings': total_bookings,
                'revenue': float(total_revenue),
                'pending': pending_bookings,
                'confirmed': confirmed_bookings,
                'in_use': in_use_bookings,
                'completed': completed_bookings,
                'cancelled': cancelled_bookings,
            },
            'this_month': {
                'revenue': float(this_month_revenue),
            },
            'last_month': {
                'revenue': float(last_month_revenue),
            },
            'today': {
                'bookings': today_bookings,
                'revenue': float(today_revenue),
            },
            'upcoming': {
                'bookings': upcoming_bookings,
            },
            'status_breakdown': list(status_breakdown),
        }
        
        return Response(stats)


class WaitlistListView(generics.ListAPIView):
    """Get user's waitlist"""
    serializer_class = WaitlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Waitlist.objects.filter(
            user=self.request.user
        ).select_related('product', 'user').order_by('-created_at')


class WaitlistCreateView(generics.CreateAPIView):
    """Add product to waitlist"""
    serializer_class = WaitlistSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        product_id = request.data.get('product_id')
        preferred_start_date = request.data.get('preferred_start_date')
        preferred_end_date = request.data.get('preferred_end_date')
        
        if not product_id:
            return Response(
                {'error': 'product_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Product not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if already in waitlist
        waitlist_item, created = Waitlist.objects.get_or_create(
            user=request.user,
            product=product,
            defaults={
                'preferred_start_date': preferred_start_date,
                'preferred_end_date': preferred_end_date,
            }
        )
        
        if not created:
            # Update preferred dates if provided
            if preferred_start_date:
                waitlist_item.preferred_start_date = preferred_start_date
            if preferred_end_date:
                waitlist_item.preferred_end_date = preferred_end_date
            waitlist_item.save()
            return Response(
                {'message': 'Product already in waitlist', 'id': waitlist_item.id},
                status=status.HTTP_200_OK
            )
        
        serializer = self.get_serializer(waitlist_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class WaitlistDeleteView(generics.DestroyAPIView):
    """Remove product from waitlist"""
    serializer_class = WaitlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Waitlist.objects.filter(user=self.request.user)


# Damage Assessment Views
class DamageAssessmentCreateView(generics.CreateAPIView):
    """Create damage assessment"""
    serializer_class = DamageAssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        booking_id = self.request.data.get('booking_id')
        try:
            booking = Booking.objects.get(pk=booking_id)
            # Only allow assessment for completed bookings or by admin
            if booking.status != 'completed' and self.request.user.role not in ['admin', 'staff']:
                raise ValidationError('Can only assess completed bookings')
            serializer.save(booking=booking, assessed_by=self.request.user)
        except Booking.DoesNotExist:
            raise ValidationError('Booking not found')


class DamageAssessmentDetailView(generics.RetrieveUpdateAPIView):
    """Get or update damage assessment"""
    serializer_class = DamageAssessmentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DamageAssessment.objects.select_related('booking', 'assessed_by').prefetch_related(
            'photos', 'checklist_items'
        )
        # Users can only see their own assessments unless admin
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(booking__user=self.request.user)
        return queryset


class DamagePhotoCreateView(generics.CreateAPIView):
    """Upload damage photo"""
    serializer_class = DamagePhotoSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        assessment_id = self.request.data.get('assessment_id')
        try:
            assessment = DamageAssessment.objects.get(pk=assessment_id)
            # Check permissions
            if assessment.booking.user != self.request.user and self.request.user.role not in ['admin', 'staff']:
                raise ValidationError('Permission denied')
            serializer.save(assessment=assessment)
        except DamageAssessment.DoesNotExist:
            raise ValidationError('Assessment not found')


class InspectionChecklistCreateView(generics.CreateAPIView):
    """Create inspection checklist item"""
    serializer_class = InspectionChecklistSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        assessment_id = self.request.data.get('assessment_id')
        try:
            assessment = DamageAssessment.objects.get(pk=assessment_id)
            # Only admin/staff can create checklist items
            if self.request.user.role not in ['admin', 'staff']:
                raise ValidationError('Permission denied')
            serializer.save(assessment=assessment)
        except DamageAssessment.DoesNotExist:
            raise ValidationError('Assessment not found')


class InspectionChecklistUpdateView(generics.UpdateAPIView):
    """Update inspection checklist item"""
    serializer_class = InspectionChecklistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = InspectionChecklist.objects.select_related('assessment__booking')
        # Only admin/staff can update checklist items
        if self.request.user.role not in ['admin', 'staff']:
            return queryset.none()
        return queryset


class DamageClaimCreateView(generics.CreateAPIView):
    """Create damage claim"""
    serializer_class = DamageClaimSerializer
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        assessment_id = self.request.data.get('assessment_id')
        try:
            assessment = DamageAssessment.objects.get(pk=assessment_id)
            # Only booking owner can create claim
            if assessment.booking.user != self.request.user:
                raise ValidationError('Permission denied')
            # Check if claim already exists
            if hasattr(assessment, 'claim'):
                raise ValidationError('Claim already exists')
            serializer.save(assessment=assessment)
        except DamageAssessment.DoesNotExist:
            raise ValidationError('Assessment not found')


class DamageClaimDetailView(generics.RetrieveUpdateAPIView):
    """Get or update damage claim"""
    serializer_class = DamageClaimSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = DamageClaim.objects.select_related('assessment__booking')
        # Users can see their own claims, admins can see all
        if self.request.user.role not in ['admin', 'staff']:
            queryset = queryset.filter(assessment__booking__user=self.request.user)
        return queryset
    
    def perform_update(self, serializer):
        # Only admin can update claim status and approved amount
        if self.request.user.role not in ['admin', 'staff']:
            # Users can only update their own claim description
            instance = self.get_object()
            if instance.assessment.booking.user != self.request.user:
                raise ValidationError('Permission denied')
            # Only allow updating claim_description
            allowed_fields = ['claim_description']
            for field in serializer.validated_data:
                if field not in allowed_fields:
                    raise ValidationError(f'Cannot update {field}')
        
        serializer.save()

