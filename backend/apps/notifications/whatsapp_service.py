"""
WhatsApp Business API service
"""
import requests
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class WhatsAppService:
    """Service for sending WhatsApp messages via WhatsApp Business API"""
    
    # Configuration from settings
    API_URL = getattr(settings, 'WHATSAPP_API_URL', '')
    API_TOKEN = getattr(settings, 'WHATSAPP_API_TOKEN', '')
    PHONE_NUMBER_ID = getattr(settings, 'WHATSAPP_PHONE_NUMBER_ID', '')
    BUSINESS_ACCOUNT_ID = getattr(settings, 'WHATSAPP_BUSINESS_ACCOUNT_ID', '')
    
    @classmethod
    def send_message(cls, to_phone: str, message: str, template_name: str = None, template_params: list = None):
        """
        Send WhatsApp message
        
        Args:
            to_phone: Recipient phone number (with country code, e.g., +213XXXXXXXXX)
            message: Plain text message (if not using template)
            template_name: Template name (if using template)
            template_params: Template parameters (if using template)
        
        Returns:
            dict with success status and message_id
        """
        if not cls.API_URL or not cls.API_TOKEN or not cls.PHONE_NUMBER_ID:
            print("WhatsApp API not configured")
            return {'success': False, 'error': 'WhatsApp API not configured'}
        
        # Format phone number (remove + if present, ensure country code)
        phone_number = to_phone.replace('+', '').replace(' ', '').replace('-', '')
        if not phone_number.startswith('213'):
            # Assume Algeria if no country code
            phone_number = '213' + phone_number.lstrip('0')
        
        url = f"{cls.API_URL}/{cls.PHONE_NUMBER_ID}/messages"
        headers = {
            'Authorization': f'Bearer {cls.API_TOKEN}',
            'Content-Type': 'application/json',
        }
        
        if template_name:
            # Send template message
            payload = {
                'messaging_product': 'whatsapp',
                'to': phone_number,
                'type': 'template',
                'template': {
                    'name': template_name,
                    'language': {
                        'code': 'ar'
                    },
                    'components': []
                }
            }
            
            # Add parameters if provided
            if template_params:
                payload['template']['components'] = [{
                    'type': 'body',
                    'parameters': [
                        {'type': 'text', 'text': str(param)} for param in template_params
                    ]
                }]
        else:
            # Send plain text message
            payload = {
                'messaging_product': 'whatsapp',
                'to': phone_number,
                'type': 'text',
                'text': {
                    'body': message
                }
            }
        
        try:
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            return {
                'success': True,
                'message_id': data.get('messages', [{}])[0].get('id', ''),
            }
        except requests.exceptions.RequestException as e:
            print(f"Error sending WhatsApp message: {e}")
            return {
                'success': False,
                'error': str(e),
            }
    
    @classmethod
    def send_booking_confirmation(cls, phone: str, booking_id: int, product_name: str, start_date: str, end_date: str):
        """Send booking confirmation via WhatsApp"""
        message = _(
            f'تم تأكيد حجزك بنجاح!\n'
            f'رقم الحجز: {booking_id}\n'
            f'المنتج: {product_name}\n'
            f'من: {start_date}\n'
            f'إلى: {end_date}\n'
            f'شكراً لاستخدامك ReadyRent.Gala'
        )
        return cls.send_message(phone, message)
    
    @classmethod
    def send_booking_reminder(cls, phone: str, booking_id: int, product_name: str, start_date: str, days_before: int = 1):
        """Send booking reminder via WhatsApp"""
        message = _(
            f'تذكير: حجزك قريب!\n'
            f'المنتج: {product_name}\n'
            f'تاريخ البدء: {start_date}\n'
            f'باقي {days_before} يوم(أيام)\n'
            f'نتمنى لك مناسبة سعيدة!'
        )
        return cls.send_message(phone, message)
    
    @classmethod
    def send_return_reminder(cls, phone: str, booking_id: int, product_name: str, return_date: str, days_before: int = 1):
        """Send return reminder via WhatsApp"""
        message = _(
            f'تذكير: موعد إرجاع المنتج قريب!\n'
            f'المنتج: {product_name}\n'
            f'تاريخ الإرجاع: {return_date}\n'
            f'باقي {days_before} يوم(أيام)\n'
            f'يرجى التواصل معنا لترتيب الاستلام'
        )
        return cls.send_message(phone, message)
    
    @classmethod
    def send_delivery_update(cls, phone: str, delivery_status: str, tracking_url: str = None):
        """Send delivery status update via WhatsApp"""
        status_messages = {
            'assigned': 'تم تعيين سائق للتسليم',
            'picked_up': 'تم استلام المنتج من المتجر',
            'in_transit': 'المنتج في الطريق إليك',
            'delivered': 'تم التسليم بنجاح',
        }
        
        message = _(
            f'تحديث حالة التسليم:\n'
            f'{status_messages.get(delivery_status, delivery_status)}\n'
        )
        
        if tracking_url:
            message += f'\n{tracking_url}'
        
        return cls.send_message(phone, message)
    
    @classmethod
    def send_waitlist_notification(cls, phone: str, product_id: int, product_name: str):
        """Send waitlist notification when product becomes available"""
        message = _(
            f'أخبار سارة! المنتج متوفر الآن!\n'
            f'المنتج: {product_name}\n'
            f'يمكنك الآن الحجز من خلال الموقع.\n'
            f'شكراً لاستخدامك ReadyRent.Gala'
        )
        return cls.send_message(phone, message)
