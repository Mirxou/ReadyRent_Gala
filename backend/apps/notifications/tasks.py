"""
Celery tasks for notifications
"""
from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from apps.bookings.models import Booking, Waitlist
from apps.returns.models import Return
from apps.maintenance.services import MaintenanceService
from .services import (
    send_booking_reminder_email,
    send_return_reminder_email,
    send_waitlist_notification
)


@shared_task
def send_booking_reminders():
    """Send booking reminders for bookings starting soon"""
    # Find bookings starting in 1 day
    tomorrow = timezone.now().date() + timedelta(days=1)
    
    upcoming_bookings = Booking.objects.filter(
        start_date=tomorrow,
        status__in=['confirmed', 'pending']
    ).select_related('user', 'product')
    
    for booking in upcoming_bookings:
        send_booking_reminder_email(booking, days_before=1)
    
    return f"Sent {upcoming_bookings.count()} booking reminders"


@shared_task
def send_return_reminders():
    """Send return reminders for bookings ending soon"""
    # Find bookings ending in 1 day
    tomorrow = timezone.now().date() + timedelta(days=1)
    
    ending_bookings = Booking.objects.filter(
        end_date=tomorrow,
        status='in_use'
    ).select_related('user', 'product')
    
    for booking in ending_bookings:
        send_return_reminder_email(booking)
    
    return f"Sent {ending_bookings.count()} return reminders"


@shared_task
def send_daily_reminders():
    """Send all daily reminders"""
    booking_count = send_booking_reminders()
    return_count = send_return_reminders()
    return f"Booking reminders: {booking_count}, Return reminders: {return_count}"


@shared_task
def check_waitlist_availability(product_id=None):
    """Check if products in waitlist are now available and notify users"""
    from apps.products.models import Product
    
    # Get all non-notified waitlist items
    waitlist_query = Waitlist.objects.filter(notified=False).select_related('product', 'user')
    
    if product_id:
        waitlist_query = waitlist_query.filter(product_id=product_id)
    
    notified_count = 0
    
    for waitlist_item in waitlist_query:
        product = waitlist_item.product
        
        # Check if product is available (not in maintenance and has inventory)
        # For simplicity, check if product status is available
        if product.status != 'available':
            continue
        
        # Check maintenance periods if preferred dates are set
        if waitlist_item.preferred_start_date and waitlist_item.preferred_end_date:
            is_available = MaintenanceService.is_product_available_for_dates(
                product,
                waitlist_item.preferred_start_date,
                waitlist_item.preferred_end_date
            )
            
            if not is_available:
                continue
        
        # Check if there are active bookings for the preferred dates
        if waitlist_item.preferred_start_date and waitlist_item.preferred_end_date:
            conflicting_bookings = Booking.objects.filter(
                product=product,
                status__in=['pending', 'confirmed', 'in_use'],
                start_date__lte=waitlist_item.preferred_end_date,
                end_date__gte=waitlist_item.preferred_start_date
            ).exists()
            
            if conflicting_bookings:
                continue
        
        # Product is available! Send notification
        try:
            send_waitlist_notification(waitlist_item)
            notified_count += 1
        except Exception as e:
            print(f"Error notifying waitlist item {waitlist_item.id}: {e}")
    
    return f"Notified {notified_count} users about product availability"

