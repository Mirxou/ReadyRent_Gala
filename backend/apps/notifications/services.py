"""
Notification services for ReadyRent.Gala
"""
from django.core.mail import send_mail
from django.conf import settings
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import Notification
from .whatsapp_service import WhatsAppService

channel_layer = get_channel_layer()


def send_email_notification(user, subject, message, html_message=None):
    """Send email notification"""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False


def create_notification(user, notification_type, title, message):
    """Create and save notification"""
    notification = Notification.objects.create(
        user=user,
        type=notification_type,
        title=title,
        message=message
    )
    
    # Send real-time notification via WebSocket
    if channel_layer and user:
        room_group_name = f'notifications_{user.id}'
        async_to_sync(channel_layer.group_send)(
            room_group_name,
            {
                'type': 'notification_message',
                'notification': {
                    'id': notification.id,
                    'type': notification.type,
                    'title': notification.title,
                    'message': notification.message,
                    'is_read': notification.is_read,
                    'created_at': notification.created_at.isoformat(),
                }
            }
        )
    
    return notification


def send_booking_confirmation(booking):
    """Send booking confirmation notification"""
    user = booking.user
    subject = _('Booking Confirmed - ReadyRent.Gala')
    message = _(
        f'Your booking for {booking.product.name_ar or booking.product.name} '
        f'from {booking.start_date} to {booking.end_date} has been confirmed.'
    )
    
    # Create in-app notification
    create_notification(
        user=user,
        notification_type='booking_confirmed',
        title=_('Booking Confirmed'),
        message=message
    )
    
    # Send email
    send_email_notification(user, subject, message)
    
    # Send WhatsApp notification if phone number available
    if hasattr(user, 'phone') and user.phone:
        try:
            product_name = booking.product.name_ar or booking.product.name
            WhatsAppService.send_booking_confirmation(
                user.phone,
                booking.id,
                product_name,
                str(booking.start_date),
                str(booking.end_date)
            )
        except Exception as e:
            print(f"Error sending WhatsApp notification: {e}")


def send_booking_confirmation_email(booking):
    """Send booking confirmation email"""
    user = booking.user
    product_name = booking.product.name_ar or booking.product.name
    
    subject = f'تأكيد الحجز - ReadyRent.Gala'
    html_message = f"""
    <div dir="rtl">
        <h2>تم تأكيد حجزك بنجاح!</h2>
        <p>عزيزي/عزيزتي {user.username},</p>
        <p>نود إعلامك بأن حجزك للمنتج <strong>{product_name}</strong> قد تم تأكيده.</p>
        <p><strong>تفاصيل الحجز:</strong></p>
        <ul>
            <li>المنتج: {product_name}</li>
            <li>من: {booking.start_date}</li>
            <li>إلى: {booking.end_date}</li>
            <li>عدد الأيام: {booking.total_days}</li>
            <li>المبلغ الإجمالي: {booking.total_price} دج</li>
        </ul>
        <p>شكراً لاستخدامك ReadyRent.Gala</p>
    </div>
    """
    message = f'تم تأكيد حجزك للمنتج {product_name} من {booking.start_date} إلى {booking.end_date}'
    
    # Create in-app notification
    create_notification(
        user=user,
        notification_type='booking_confirmed',
        title='تم تأكيد الحجز',
        message=message
    )
    
    # Send email
    send_email_notification(user, subject, message, html_message)
    
    # Send WhatsApp notification if phone number available
    if hasattr(user, 'phone') and user.phone:
        WhatsAppService.send_booking_confirmation(
            user.phone,
            booking.id,
            product_name,
            str(booking.start_date),
            str(booking.end_date)
        )


def send_booking_reminder_email(booking, days_before=1):
    """Send booking reminder email"""
    user = booking.user
    product_name = booking.product.name_ar or booking.product.name
    
    subject = f'تذكير بالحجز - ReadyRent.Gala'
    html_message = f"""
    <div dir="rtl">
        <h2>تذكير بالحجز</h2>
        <p>عزيزي/عزيزتي {user.username},</p>
        <p>نود تذكيرك بأن حجزك للمنتج <strong>{product_name}</strong> سيبدأ بعد {days_before} يوم/أيام.</p>
        <p><strong>تفاصيل الحجز:</strong></p>
        <ul>
            <li>المنتج: {product_name}</li>
            <li>من: {booking.start_date}</li>
            <li>إلى: {booking.end_date}</li>
        </ul>
        <p>يرجى التأكد من الاستعداد لاستلام المنتج في الموعد المحدد.</p>
        <p>شكراً لاستخدامك ReadyRent.Gala</p>
    </div>
    """
    message = f'تذكير: حجزك للمنتج {product_name} سيبدأ بعد {days_before} يوم/أيام'
    
    create_notification(
        user=user,
        notification_type='booking_reminder',
        title='تذكير بالحجز',
        message=message
    )
    
    send_email_notification(user, subject, message, html_message)
    
    # Send WhatsApp reminder if phone number available
    if hasattr(user, 'phone') and user.phone:
        try:
            WhatsAppService.send_booking_reminder(
                user.phone,
                booking.id,
                product_name,
                str(booking.start_date),
                days_before
            )
        except Exception as e:
            print(f"Error sending WhatsApp reminder: {e}")


def send_return_reminder_email(booking):
    """Send return reminder email"""
    user = booking.user
    product_name = booking.product.name_ar or booking.product.name
    
    subject = f'تذكير بإرجاع المنتج - ReadyRent.Gala'
    html_message = f"""
    <div dir="rtl">
        <h2>تذكير بإرجاع المنتج</h2>
        <p>عزيزي/عزيزتي {user.username},</p>
        <p>نود تذكيرك بأن مدة استئجار المنتج <strong>{product_name}</strong> ستنتهي قريباً.</p>
        <p><strong>تفاصيل الحجز:</strong></p>
        <ul>
            <li>المنتج: {product_name}</li>
            <li>تاريخ الإرجاع: {booking.end_date}</li>
        </ul>
        <p>يرجى إرجاع المنتج في التاريخ المحدد لتجنب أي رسوم إضافية.</p>
        <p>شكراً لاستخدامك ReadyRent.Gala</p>
    </div>
    """
    message = f'تذكير: يجب إرجاع المنتج {product_name} في {booking.end_date}'
    
    create_notification(
        user=user,
        notification_type='return_reminder',
        title='تذكير بالإرجاع',
        message=message
    )
    
    send_email_notification(user, subject, message, html_message)
    
    # Send WhatsApp reminder if phone number available
    if hasattr(user, 'phone') and user.phone:
        try:
            WhatsAppService.send_return_reminder(
                user.phone,
                booking.id,
                product_name,
                str(booking.end_date),
                1
            )
        except Exception as e:
            print(f"Error sending WhatsApp return reminder: {e}")


def send_return_confirmation_email(return_request):
    """Send return confirmation email"""
    booking = return_request.booking
    user = booking.user
    product_name = booking.product.name_ar or booking.product.name
    
    subject = f'تأكيد استلام الإرجاع - ReadyRent.Gala'
    html_message = f"""
    <div dir="rtl">
        <h2>تم استلام إرجاع المنتج</h2>
        <p>عزيزي/عزيزتي {user.username},</p>
        <p>نود إعلامك بأننا قد استلمنا إرجاع المنتج <strong>{product_name}</strong> بنجاح.</p>
        <p><strong>تفاصيل الإرجاع:</strong></p>
        <ul>
            <li>المنتج: {product_name}</li>
            <li>تاريخ الاستلام: {return_request.received_at or return_request.actual_pickup_date}</li>
            <li>الحالة: {return_request.get_status_display()}</li>
        </ul>
        <p>شكراً لاستخدامك ReadyRent.Gala</p>
    </div>
    """
    message = f'تم استلام إرجاع المنتج {product_name} بنجاح'
    
    create_notification(
        user=user,
        notification_type='return_confirmed',
        title='تم استلام الإرجاع',
        message=message
    )
    
    send_email_notification(user, subject, message, html_message)
    
    # Send WhatsApp notification if phone number available
    if hasattr(user, 'phone') and user.phone:
        try:
            WhatsAppService.send_message(
                user.phone,
                f'تم استلام إرجاع المنتج {product_name} بنجاح. شكراً لاستخدامك ReadyRent.Gala'
            )
        except Exception as e:
            print(f"Error sending WhatsApp notification: {e}")


def send_waitlist_notification(waitlist_item):
    """Send notification when product becomes available for waitlist"""
    user = waitlist_item.user
    product = waitlist_item.product
    product_name = product.name_ar or product.name
    
    subject = f'المنتج متوفر الآن - ReadyRent.Gala'
    html_message = f"""
    <div dir="rtl">
        <h2>المنتج متوفر الآن!</h2>
        <p>عزيزي/عزيزتي {user.username},</p>
        <p>نود إعلامك بأن المنتج <strong>{product_name}</strong> الذي كنت تنتظره أصبح متوفراً الآن.</p>
        <p>يمكنك الآن الحجز من خلال الموقع.</p>
        <p><a href="{settings.FRONTEND_URL or 'http://localhost:3001'}/products/{product.id}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">احجز الآن</a></p>
        <p>شكراً لاستخدامك ReadyRent.Gala</p>
    </div>
    """
    message = f'المنتج {product_name} أصبح متوفراً الآن. يمكنك الحجز من خلال الموقع.'
    
    # Create in-app notification
    create_notification(
        user=user,
        notification_type='product_available',
        title='المنتج متوفر الآن',
        message=message
    )
    
    # Send email
    send_email_notification(user, subject, message, html_message)
    
    # Send WhatsApp notification if phone number available
    if hasattr(user, 'phone') and user.phone:
        try:
            WhatsAppService.send_waitlist_notification(
                user.phone,
                product.id,
                product_name
            )
        except Exception as e:
            print(f"Error sending WhatsApp notification: {e}")
    
    # Mark waitlist item as notified
    waitlist_item.notified = True
    waitlist_item.notified_at = timezone.now()
    waitlist_item.save()

