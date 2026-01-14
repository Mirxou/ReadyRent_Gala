"""
Custom exceptions for ReadyRent.Gala
"""
from rest_framework.exceptions import APIException
from rest_framework import status


class ProductNotFoundException(APIException):
    """Exception raised when product is not found"""
    status_code = status.HTTP_404_NOT_FOUND
    default_detail = 'Product not found'
    default_code = 'product_not_found'


class BookingConflictException(APIException):
    """Exception raised when booking dates conflict"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Booking dates conflict with existing bookings'
    default_code = 'booking_conflict'


class InsufficientInventoryException(APIException):
    """Exception raised when inventory is insufficient"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Insufficient inventory available'
    default_code = 'insufficient_inventory'


class InvalidBookingDatesException(APIException):
    """Exception raised when booking dates are invalid"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_detail = 'Invalid booking dates'
    default_code = 'invalid_booking_dates'


class PaymentRequiredException(APIException):
    """Exception raised when payment is required (for future use)"""
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_detail = 'Payment required to complete booking'
    default_code = 'payment_required'


