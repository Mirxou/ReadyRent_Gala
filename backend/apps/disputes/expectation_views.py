"""
API Views for Expectation Setting (Phase 23, Step 4)

Endpoints for pre-booking widgets and pre-dispute warnings.
"""
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404

from .expectation_setter import ExpectationSetter
from apps.products.models import Product
from apps.bookings.models import Booking


from django.views.decorators.cache import cache_page


@api_view(['GET'])
@permission_classes([AllowAny])
@cache_page(60 * 10)  # Cache for 10 minutes - varies by product category
def booking_expectations(request, product_id):
    """
    GET /api/disputes/expectations/booking/<product_id>/
    
    Pre-booking expectation widget.
    
    Shows typical outcomes for this product category BEFORE user books.
    
    Sovereign Safeguard #4: Uses scenario language, NOT percentages.
    """
    product = get_object_or_404(Product, id=product_id)
    
    expectations = ExpectationSetter.get_booking_expectations(product)
    
    return Response(expectations)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def dispute_warning(request):
    """
    POST /api/disputes/expectations/dispute-warning/
    
    Pre-dispute warning with similar cases.
    
    Shows user similar cases BEFORE they escalate to formal dispute.
    
    Request body:
    {
        "booking_id": 123,
        "dispute_category": "damage"
    }
    
    Sovereign Safeguard #4: Encourages settlement, manages expectations.
    """
    booking_id = request.data.get('booking_id')
    dispute_category = request.data.get('dispute_category', 'general')
    
    if not booking_id:
        return Response(
            {'error': 'booking_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verify booking exists and user has access
    try:
        booking = Booking.objects.get(id=booking_id)
        
        # Check user is involved in booking
        if request.user not in [booking.user, booking.product.owner]:
            return Response(
                {'error': 'You do not have access to this booking'},
                status=status.HTTP_403_FORBIDDEN
            )
        
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    warning = ExpectationSetter.get_dispute_warning(booking_id, dispute_category)
    
    return Response(warning)
