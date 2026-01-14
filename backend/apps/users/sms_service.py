"""
SMS service for phone verification
Supports multiple SMS providers: Twilio, AWS SNS, or custom provider
"""
import requests
from django.conf import settings
from django.utils.translation import gettext_lazy as _


class SMSService:
    """Service for sending SMS messages"""
    
    # Configuration from settings
    PROVIDER = getattr(settings, 'SMS_PROVIDER', 'twilio')  # 'twilio', 'aws_sns', 'custom'
    TWILIO_ACCOUNT_SID = getattr(settings, 'TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = getattr(settings, 'TWILIO_AUTH_TOKEN', '')
    TWILIO_PHONE_NUMBER = getattr(settings, 'TWILIO_PHONE_NUMBER', '')
    
    AWS_SNS_REGION = getattr(settings, 'AWS_SNS_REGION', 'us-east-1')
    AWS_ACCESS_KEY_ID = getattr(settings, 'AWS_ACCESS_KEY_ID', '')
    AWS_SECRET_ACCESS_KEY = getattr(settings, 'AWS_SECRET_ACCESS_KEY', '')
    
    CUSTOM_SMS_API_URL = getattr(settings, 'CUSTOM_SMS_API_URL', '')
    CUSTOM_SMS_API_KEY = getattr(settings, 'CUSTOM_SMS_API_KEY', '')
    
    @classmethod
    def send_verification_code(cls, phone_number: str, code: str) -> dict:
        """
        Send SMS verification code
        
        Args:
            phone_number: Phone number (format: 213XXXXXXXXX or +213XXXXXXXXX)
            code: Verification code (6 digits)
        
        Returns:
            dict with success status and message_id or error
        """
        # Format phone number
        phone = cls._format_phone_number(phone_number)
        
        # Choose provider
        if cls.PROVIDER == 'twilio':
            return cls._send_via_twilio(phone, code)
        elif cls.PROVIDER == 'aws_sns':
            return cls._send_via_aws_sns(phone, code)
        elif cls.PROVIDER == 'custom':
            return cls._send_via_custom(phone, code)
        else:
            # Fallback: just log (for development)
            print(f"[SMS] Verification code {code} for {phone}")
            return {'success': True, 'message': 'SMS sent (development mode)'}
    
    @classmethod
    def _format_phone_number(cls, phone_number: str) -> str:
        """Format phone number to E.164 format"""
        phone = phone_number.replace('+', '').replace(' ', '').replace('-', '').replace('(', '').replace(')', '')
        
        # Add Algeria country code if missing
        if not phone.startswith('213'):
            if phone.startswith('0'):
                phone = '213' + phone[1:]
            else:
                phone = '213' + phone
        
        return phone
    
    @classmethod
    def _send_via_twilio(cls, phone_number: str, code: str) -> dict:
        """Send SMS via Twilio"""
        if not cls.TWILIO_ACCOUNT_SID or not cls.TWILIO_AUTH_TOKEN or not cls.TWILIO_PHONE_NUMBER:
            return {
                'success': False,
                'error': 'Twilio not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in settings.'
            }
        
        try:
            url = f"https://api.twilio.com/2010-04-01/Accounts/{cls.TWILIO_ACCOUNT_SID}/Messages.json"
            
            message = f"رمز التحقق من ReadyRent.Gala: {code}\n\nلا تشارك هذا الرمز مع أي شخص."
            
            data = {
                'From': cls.TWILIO_PHONE_NUMBER,
                'To': f'+{phone_number}',
                'Body': message
            }
            
            response = requests.post(
                url,
                data=data,
                auth=(cls.TWILIO_ACCOUNT_SID, cls.TWILIO_AUTH_TOKEN),
                timeout=10
            )
            
            if response.status_code == 201:
                result = response.json()
                return {
                    'success': True,
                    'message_id': result.get('sid'),
                    'message': 'SMS sent successfully via Twilio'
                }
            else:
                return {
                    'success': False,
                    'error': f'Twilio API error: {response.text}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error sending SMS via Twilio: {str(e)}'
            }
    
    @classmethod
    def _send_via_aws_sns(cls, phone_number: str, code: str) -> dict:
        """Send SMS via AWS SNS"""
        try:
            import boto3
            
            if not cls.AWS_ACCESS_KEY_ID or not cls.AWS_SECRET_ACCESS_KEY:
                return {
                    'success': False,
                    'error': 'AWS SNS not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in settings.'
                }
            
            sns_client = boto3.client(
                'sns',
                region_name=cls.AWS_SNS_REGION,
                aws_access_key_id=cls.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=cls.AWS_SECRET_ACCESS_KEY
            )
            
            message = f"رمز التحقق من ReadyRent.Gala: {code}\n\nلا تشارك هذا الرمز مع أي شخص."
            
            response = sns_client.publish(
                PhoneNumber=f'+{phone_number}',
                Message=message
            )
            
            return {
                'success': True,
                'message_id': response.get('MessageId'),
                'message': 'SMS sent successfully via AWS SNS'
            }
        except ImportError:
            return {
                'success': False,
                'error': 'boto3 not installed. Install it with: pip install boto3'
            }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error sending SMS via AWS SNS: {str(e)}'
            }
    
    @classmethod
    def _send_via_custom(cls, phone_number: str, code: str) -> dict:
        """Send SMS via custom API"""
        if not cls.CUSTOM_SMS_API_URL or not cls.CUSTOM_SMS_API_KEY:
            return {
                'success': False,
                'error': 'Custom SMS API not configured. Please set CUSTOM_SMS_API_URL and CUSTOM_SMS_API_KEY in settings.'
            }
        
        try:
            message = f"رمز التحقق من ReadyRent.Gala: {code}\n\nلا تشارك هذا الرمز مع أي شخص."
            
            payload = {
                'phone': phone_number,
                'message': message,
                'code': code
            }
            
            headers = {
                'Authorization': f'Bearer {cls.CUSTOM_SMS_API_KEY}',
                'Content-Type': 'application/json',
            }
            
            response = requests.post(
                cls.CUSTOM_SMS_API_URL,
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'message_id': result.get('message_id'),
                    'message': 'SMS sent successfully via custom API'
                }
            else:
                return {
                    'success': False,
                    'error': f'Custom SMS API error: {response.text}'
                }
        except Exception as e:
            return {
                'success': False,
                'error': f'Error sending SMS via custom API: {str(e)}'
            }
