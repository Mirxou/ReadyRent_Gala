"""
Views for Payment app
"""
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import Payment, PaymentMethod
from .serializers import (
    PaymentSerializer, PaymentCreateSerializer, PaymentMethodSerializer
)
from .services import PaymentService, BaridiMobService, BankCardService
from apps.bookings.models import Booking


class PaymentMethodListView(generics.ListAPIView):
    """List available payment methods"""
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = []


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment management"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'payment_method']
    
    def get_queryset(self):
        """Filter payments by user"""
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return Payment.objects.select_related('user', 'booking').all()
        return Payment.objects.filter(user=user).select_related('user', 'booking')
    
    def get_serializer_class(self):
        """Use different serializer for create"""
        if self.action == 'create':
            return PaymentCreateSerializer
        return PaymentSerializer
    
    def perform_create(self, serializer):
        """Create payment and initiate processing"""
        booking_id = serializer.validated_data.get('booking_id')
        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id, user=self.request.user)
            except Booking.DoesNotExist:
                pass
        
        payment = serializer.save(
            user=self.request.user,
            booking=booking,
            status='pending'
        )
        
        # Process payment based on method
        payment_data = {}
        if payment.payment_method == 'baridimob':
            payment_data['phone_number'] = serializer.validated_data.get('phone_number', '')
        elif payment.payment_method == 'bank_card':
            payment_data = {
                'card_number': serializer.validated_data.get('card_number', ''),
                'card_expiry': serializer.validated_data.get('card_expiry', ''),
                'card_cvv': serializer.validated_data.get('card_cvv', ''),
                'cardholder_name': serializer.validated_data.get('cardholder_name', ''),
            }
        
        # Initiate payment processing
        result = PaymentService.process_payment(payment, payment_data)
        
        if not result.get('success'):
            payment.status = 'failed'
            payment.failure_reason = result.get('error', 'Payment processing failed')
            payment.save()
        else:
            # Refresh payment to get updated status
            payment.refresh_from_db()
            # Update booking status if payment completed immediately (e.g., bank card)
            PaymentService.update_booking_status(payment)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def verify_otp(self, request, pk=None):
        """Verify OTP for BaridiMob payment"""
        payment = self.get_object()
        
        if payment.user != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if payment.payment_method != 'baridimob':
            return Response(
                {'error': 'This payment method does not require OTP verification'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        otp_code = request.data.get('otp_code')
        if not otp_code:
            return Response(
                {'error': 'OTP code is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        result = BaridiMobService.verify_otp(payment, otp_code)
        
        if result.get('success'):
            # Refresh payment from database to get updated status
            payment.refresh_from_db()
            # Update booking status using PaymentService (already done in verify_otp, but ensure it's done)
            PaymentService.update_booking_status(payment)
            
            return Response({
                'success': True,
                'message': result.get('message', 'Payment completed successfully'),
                'payment': PaymentSerializer(payment).data
            })
        else:
            return Response(
                {'error': result.get('error', 'OTP verification failed')},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def status(self, request, pk=None):
        """Get payment status"""
        payment = self.get_object()
        
        if payment.user != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'error': 'Permission denied'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return Response({
            'id': payment.id,
            'status': payment.status,
            'status_display': payment.get_status_display(),
            'amount': str(payment.amount),
            'currency': payment.currency,
            'transaction_id': payment.transaction_id,
            'created_at': payment.created_at,
            'completed_at': payment.completed_at,
        })


class PaymentCreateView(generics.CreateAPIView):
    """Create payment for booking"""
    serializer_class = PaymentCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """Create and process payment"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        booking_id = serializer.validated_data.get('booking_id')
        amount = serializer.validated_data.get('amount')
        payment_method = serializer.validated_data.get('payment_method')
        
        # Validate booking if provided
        booking = None
        if booking_id:
            try:
                booking = Booking.objects.get(id=booking_id, user=request.user)
                # Use booking total price if amount not provided
                if not amount:
                    amount = booking.total_price
            except Booking.DoesNotExist:
                return Response(
                    {'error': 'Booking not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        if not amount:
            return Response(
                {'error': 'Amount is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create payment
        payment = PaymentService.create_payment(
            user=request.user,
            amount=amount,
            currency=serializer.validated_data.get('currency', 'DZD'),
            booking=booking,
            payment_method=payment_method
        )
        
        # Prepare payment data
        payment_data = {}
        if payment_method == 'baridimob':
            payment_data['phone_number'] = serializer.validated_data.get('phone_number', '')
        elif payment_method == 'bank_card':
            payment_data = {
                'card_number': serializer.validated_data.get('card_number', ''),
                'card_expiry': serializer.validated_data.get('card_expiry', ''),
                'card_cvv': serializer.validated_data.get('card_cvv', ''),
                'cardholder_name': serializer.validated_data.get('cardholder_name', ''),
            }
        
        # Process payment
        result = PaymentService.process_payment(payment, payment_data)
        
        if result.get('success'):
            payment_serializer = PaymentSerializer(payment)
            
            response_data = {
                'success': True,
                'payment': payment_serializer.data,
                'message': result.get('message', 'Payment initiated successfully')
            }
            
            # Add OTP requirement for BaridiMob
            if payment_method == 'baridimob' and result.get('otp_required'):
                response_data['otp_required'] = True
                response_data['message'] = 'Please enter the OTP code sent to your phone'
            
            # Add 3D Secure requirement for bank card
            if payment_method == 'bank_card' and result.get('requires_3d_secure'):
                response_data['requires_3d_secure'] = True
                response_data['redirect_url'] = result.get('redirect_url')
            
            return Response(response_data, status=status.HTTP_201_CREATED)
        else:
            payment_serializer = PaymentSerializer(payment)
            return Response({
                'success': False,
                'payment': payment_serializer.data,
                'error': result.get('error', 'Payment processing failed')
            }, status=status.HTTP_400_BAD_REQUEST)
