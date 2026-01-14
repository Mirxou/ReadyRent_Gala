"""
Chatbot services for OpenAI integration
"""
import os
import json
import uuid
from django.conf import settings
from django.utils import timezone
from .models import ChatSession, ChatMessage, ChatIntent


class ChatbotService:
    """Service for chatbot operations"""
    
    def __init__(self):
        self.openai_api_key = getattr(settings, 'OPENAI_API_KEY', os.environ.get('OPENAI_API_KEY'))
        self.model = getattr(settings, 'OPENAI_MODEL', 'gpt-3.5-turbo')
        self.temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.7)
        self.max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 500)
    
    def create_session(self, user=None, language='ar'):
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        session = ChatSession.objects.create(
            user=user,
            session_id=session_id,
            language=language,
            status='active'
        )
        return session
    
    def get_system_prompt(self, language='ar'):
        """Get system prompt based on language"""
        prompts = {
            'ar': """أنت مساعد ذكي لمنصة ReadyRent.Gala - منصة كراء الفساتين ومستلزمات المناسبات في قسنطينة.
            مهمتك مساعدة العملاء في:
            - البحث عن المنتجات (فساتين، إكسسوارات)
            - الاستفسار عن الحجوزات
            - معلومات التسليم والتسعير
            - المساعدة في الإرجاع
            - أي استفسارات عامة
            
            كن مفيداً ومهذباً ومحترفاً. أجب بالعربية الجزائرية.""",
            'fr': """Vous êtes un assistant intelligent pour ReadyRent.Gala - plateforme de location de robes et accessoires d'événements à Constantine.
            Votre mission est d'aider les clients avec:
            - Recherche de produits (robes, accessoires)
            - Demandes de réservation
            - Informations sur la livraison et les prix
            - Aide au retour
            - Toute question générale
            
            Soyez utile, poli et professionnel.""",
            'en': """You are an intelligent assistant for ReadyRent.Gala - a platform for renting dresses and event supplies in Constantine.
            Your mission is to help customers with:
            - Product search (dresses, accessories)
            - Booking inquiries
            - Delivery and pricing information
            - Return assistance
            - Any general inquiries
            
            Be helpful, polite, and professional."""
        }
        return prompts.get(language, prompts['ar'])
    
    def send_message(self, session, message_content, role='user'):
        """Send a message and get AI response"""
        # Save user message
        user_message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=message_content
        )
        
        # Get conversation history
        previous_messages = ChatMessage.objects.filter(
            session=session
        ).order_by('created_at')[:10]  # Last 10 messages
        
        # Build messages for OpenAI
        messages = [
            {'role': 'system', 'content': self.get_system_prompt(session.language)}
        ]
        
        for msg in previous_messages:
            messages.append({
                'role': msg.role,
                'content': msg.content
            })
        
        # Call OpenAI API (mock implementation - replace with actual API call)
        ai_response = self._call_openai_api(messages)
        
        # Save AI response
        assistant_message = ChatMessage.objects.create(
            session=session,
            role='assistant',
            content=ai_response['content'],
            model_used=self.model,
            tokens_used=ai_response.get('tokens_used', 0)
        )
        
        return {
            'user_message': user_message,
            'assistant_message': assistant_message,
            'tokens_used': ai_response.get('tokens_used', 0)
        }
    
    def _call_openai_api(self, messages):
        """
        Call OpenAI API using the official OpenAI Python SDK
        """
        try:
            # Import OpenAI (requires openai package)
            from openai import OpenAI
            
            if not self.openai_api_key:
                return {
                    'content': 'مرحباً! كيف يمكنني مساعدتك اليوم؟ (OpenAI API key not configured)',
                    'tokens_used': 0
                }
            
            client = OpenAI(api_key=self.openai_api_key)
            
            response = client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=self.temperature,
                max_tokens=self.max_tokens
            )
            
            return {
                'content': response.choices[0].message.content,
                'tokens_used': response.usage.total_tokens if response.usage else 0
            }
        except ImportError:
            # Fallback mock response if OpenAI not installed
            return {
                'content': 'مرحباً! كيف يمكنني مساعدتك اليوم؟ (OpenAI package not installed. Install with: pip install openai)',
                'tokens_used': 0
            }
        except Exception as e:
            # Error handling
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"OpenAI API error: {str(e)}")
            return {
                'content': f'عذراً، حدث خطأ. يرجى المحاولة مرة أخرى. (Error: {str(e)})',
                'tokens_used': 0
            }
    
    def detect_intent(self, message_content):
        """Detect intent from user message using keyword matching and context"""
        message_lower = message_content.lower()
        
        # Intent keywords (Arabic and English)
        intent_patterns = {
            'booking': ['حجز', 'احجز', 'حجوزات', 'booking', 'book', 'reserve', 'reservation'],
            'product': ['منتج', 'فساتين', 'dress', 'product', 'item', 'قطعة'],
            'price': ['سعر', 'ثمن', 'تكلفة', 'price', 'cost', 'كم', 'بكم'],
            'availability': ['متوفر', 'متاح', 'available', 'availability', 'موجود'],
            'delivery': ['تسليم', 'توصيل', 'delivery', 'deliver', 'shipping'],
            'return': ['إرجاع', 'استرجاع', 'return', 'refund', 'إسترجاع'],
            'support': ['مساعدة', 'مساعدة', 'help', 'support', 'مشكلة', 'problem'],
            'cancel': ['إلغاء', 'cancel', 'cancellation', 'إلغاء حجز'],
        }
        
        # Detect intent
        detected_intent = 'general'
        confidence = 0.5
        extracted_entities = {}
        
        for intent_type, keywords in intent_patterns.items():
            matches = sum(1 for keyword in keywords if keyword in message_lower)
            if matches > 0:
                detected_intent = intent_type
                confidence = min(1.0, matches / len(keywords) + 0.3)
                break
        
        # Extract entities (simple extraction)
        # Extract numbers (could be prices, quantities, etc.)
        import re
        numbers = re.findall(r'\d+', message_content)
        if numbers:
            extracted_entities['numbers'] = numbers
        
        return {
            'intent_type': detected_intent,
            'confidence': confidence,
            'extracted_entities': extracted_entities
        }
    
    def escalate_to_human(self, session, staff_user=None):
        """Escalate chat session to human support"""
        session.status = 'escalated'
        session.escalated_to = staff_user
        session.escalated_at = timezone.now()
        session.save()
        return session
    
    def resolve_session(self, session):
        """Mark session as resolved"""
        session.status = 'resolved'
        session.resolved_at = timezone.now()
        session.save()
        return session

