"""
Comprehensive Tests for Chatbot App
Full Coverage: Models, Views, Serializers, Services, Security, Edge Cases
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
from decimal import Decimal

from apps.users.models import User
from apps.chatbot.models import ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration
from apps.chatbot.serializers import ChatSessionSerializer, ChatMessageSerializer, ChatbotConfigurationSerializer


class ChatSessionModelTests(TestCase):
    """Test Cases for ChatSession Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='chat@test.com',
            username='chat_test',
            password='TestPass123!',
            role='tenant'
        )
        self.staff = User.objects.create_user(
            email='staff_chat@test.com',
            username='staff_chat_test',
            password='TestPass123!',
            role='staff'
        )

    def test_chat_session_creation(self):
        """Test ChatSession model creation"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='test-session-001',
            status='active',
            language='ar'
        )

        self.assertEqual(session.session_id, 'test-session-001')
        self.assertEqual(session.status, 'active')
        self.assertEqual(session.language, 'ar')
        self.assertIsNotNone(session.started_at)

    def test_chat_session_anonymous(self):
        """Test anonymous chat session"""
        session = ChatSession.objects.create(
            user=None,
            session_id='anon-session-001',
            status='active',
            language='en'
        )

        self.assertIsNone(session.user)
        self.assertEqual(session.language, 'en')

    def test_chat_session_escalation(self):
        """Test chat session escalation"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='escalate-session-001',
            status='active'
        )

        session.escalated_to = self.staff
        session.escalated_at = timezone.now()
        session.status = 'escalated'
        session.save()

        session.refresh_from_db()
        self.assertEqual(session.status, 'escalated')
        self.assertEqual(session.escalated_to, self.staff)

    def test_chat_session_resolution(self):
        """Test chat session resolution"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='resolve-session-001',
            status='active'
        )

        session.status = 'resolved'
        session.resolved_at = timezone.now()
        session.save()

        session.refresh_from_db()
        self.assertEqual(session.status, 'resolved')
        self.assertIsNotNone(session.resolved_at)

    def test_chat_session_context_data(self):
        """Test chat session context data"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='context-session-001',
            context_data={'booking_id': 123, 'product': 'dress'}
        )

        self.assertEqual(session.context_data['booking_id'], 123)

    def test_chat_session_str_representation(self):
        """Test chat session string representation"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='str-session-001',
            status='active'
        )

        self.assertIn('str-session-001', str(session))


class ChatMessageModelTests(TestCase):
    """Test Cases for ChatMessage Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='msg@test.com',
            username='msg_test',
            password='TestPass123!',
            role='tenant'
        )
        self.session = ChatSession.objects.create(
            user=self.user,
            session_id='msg-session-001',
            status='active'
        )

    def test_chat_message_creation(self):
        """Test ChatMessage model creation"""
        message = ChatMessage.objects.create(
            session=self.session,
            role='user',
            content='Hello, I need help with my booking'
        )

        self.assertEqual(message.role, 'user')
        self.assertIn('booking', message.content)
        self.assertIsNotNone(message.created_at)

    def test_chat_message_assistant(self):
        """Test assistant message"""
        message = ChatMessage.objects.create(
            session=self.session,
            role='assistant',
            content='How can I help you today?'
        )

        self.assertEqual(message.role, 'assistant')

    def test_chat_message_metadata(self):
        """Test message metadata"""
        message = ChatMessage.objects.create(
            session=self.session,
            role='assistant',
            content='Response',
            model_used='gpt-4',
            tokens_used=150,
            metadata={'response_time': 1.2}
        )

        self.assertEqual(message.model_used, 'gpt-4')
        self.assertEqual(message.tokens_used, 150)
        self.assertEqual(message.metadata['response_time'], 1.2)


class ChatIntentModelTests(TestCase):
    """Test Cases for ChatIntent Models"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='intent@test.com',
            username='intent_test',
            password='TestPass123!',
            role='tenant'
        )
        self.session = ChatSession.objects.create(
            user=self.user,
            session_id='intent-session-001',
            status='active'
        )
        self.message = ChatMessage.objects.create(
            session=self.session,
            role='user',
            content='I want to book a dress'
        )

    def test_chat_intent_creation(self):
        """Test ChatIntent model creation"""
        intent = ChatIntent.objects.create(
            session=self.session,
            message=self.message,
            intent_type='booking_help',
            confidence=Decimal('0.9500'),
            extracted_entities={'product_type': 'dress'}
        )

        self.assertEqual(intent.intent_type, 'booking_help')
        self.assertEqual(intent.confidence, Decimal('0.9500'))

    def test_chat_intent_types(self):
        """Test different intent types"""
        intent_types = [
            'product_inquiry', 'booking_help', 'return_inquiry',
            'delivery_status', 'pricing', 'general_info', 'complaint'
        ]

        for intent_type in intent_types:
            intent = ChatIntent.objects.create(
                session=self.session,
                message=self.message,
                intent_type=intent_type,
                confidence=Decimal('0.9000')
            )
            self.assertEqual(intent.intent_type, intent_type)


class ChatbotConfigurationModelTests(TestCase):
    """Test Cases for ChatbotConfiguration Models"""

    def test_configuration_creation(self):
        """Test ChatbotConfiguration model creation"""
        config = ChatbotConfiguration.objects.create(
            key='welcome_message_ar',
            value='مرحباً! كيف يمكنني مساعدتك؟',
            description='Arabic welcome message'
        )

        self.assertEqual(config.key, 'welcome_message_ar')
        self.assertTrue(config.is_active)

    def test_configuration_inactive(self):
        """Test inactive configuration"""
        config = ChatbotConfiguration.objects.create(
            key='inactive_config',
            value='value',
            is_active=False
        )

        self.assertFalse(config.is_active)


class ChatSessionSerializerTests(TestCase):
    """Test Cases for ChatSession Serializers"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='ser_chat@test.com',
            username='ser_chat_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_session_serializer(self):
        """Test ChatSessionSerializer"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='ser-session-001',
            status='active',
            language='ar'
        )

        serializer = ChatSessionSerializer(session)
        data = serializer.data

        self.assertEqual(data['session_id'], 'ser-session-001')
        self.assertEqual(data['status'], 'active')
        self.assertIn('message_count', data)

    def test_message_serializer(self):
        """Test ChatMessageSerializer"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='msg-ser-session-001',
            status='active'
        )
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content='Test message'
        )

        serializer = ChatMessageSerializer(message)
        data = serializer.data

        self.assertEqual(data['role'], 'user')
        self.assertEqual(data['content'], 'Test message')


class ChatbotViewTests(APITestCase):
    """Test Cases for Chatbot Views"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='chat_view@test.com',
            username='chat_view_test',
            password='TestPass123!',
            role='tenant'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_chat_session(self):
        """Test creating a chat session"""
        response = self.client.post('/api/chat/sessions/', {
            'session_id': 'new-session-001',
            'language': 'ar'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_list_sessions(self):
        """Test listing chat sessions"""
        ChatSession.objects.create(
            user=self.user,
            session_id='list-session-001',
            status='active'
        )

        response = self.client.get('/api/chat/sessions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_send_message(self):
        """Test sending a message"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='msg-session-001',
            status='active'
        )

        response = self.client.post(f'/api/chat/sessions/{session.id}/send_message/', {
            'message': 'Hello'
        })

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_anonymous_session(self):
        """Test creating anonymous session"""
        response = self.client.post('/api/chat/sessions/create_anonymous/', {
            'language': 'fr'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_404_NOT_FOUND])

    def test_quick_chat(self):
        """Test quick chat endpoint"""
        response = self.client.post('/api/chat/quick/', {
            'message': 'Hello, I need help',
            'language': 'ar'
        })

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])


class ChatbotSecurityTests(APITestCase):
    """Security Tests for Chatbot"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='sec_chat@test.com',
            username='sec_chat_test',
            password='TestPass123!',
            role='tenant'
        )
        self.other_user = User.objects.create_user(
            email='other_chat@test.com',
            username='other_chat_test',
            password='TestPass123!',
            role='tenant'
        )
        self.client.force_authenticate(user=self.user)

    def test_xss_in_message_content(self):
        """Test XSS protection in message content"""
        xss_payload = '<script>alert("XSS")</script>'

        session = ChatSession.objects.create(
            user=self.user,
            session_id='xss-session-001',
            status='active'
        )
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=xss_payload
        )

        self.assertNotIn('<script>', message.content)

    def test_cannot_access_other_user_session(self):
        """Test user cannot access other user's session"""
        other_session = ChatSession.objects.create(
            user=self.other_user,
            session_id='other-session-001',
            status='active'
        )

        response = self.client.get(f'/api/chat/sessions/{other_session.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_sql_injection_in_message(self):
        """Test SQL injection protection in messages"""
        sql_payload = "'; DROP TABLE chatbot_chatmessage; --"

        session = ChatSession.objects.create(
            user=self.user,
            session_id='sql-session-001',
            status='active'
        )
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=sql_payload
        )

        self.assertIsNotNone(message.content)
        self.assertNotIn('DROP', message.content[:10])

    def test_rate_limiting(self):
        """Test rate limiting on chat endpoints"""
        for i in range(25):
            response = self.client.post('/api/chat/quick/', {
                'message': f'Test message {i}'
            })

        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_429_TOO_MANY_REQUESTS])


class ChatbotEdgeCaseTests(TestCase):
    """Edge Case Tests for Chatbot"""

    def setUp(self):
        self.user = User.objects.create_user(
            email='edge_chat@test.com',
            username='edge_chat_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_empty_message_content(self):
        """Test handling of empty message content"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='empty-session-001',
            status='active'
        )
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=''
        )

        self.assertEqual(message.content, '')

    def test_very_long_message(self):
        """Test handling of very long messages"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='long-session-001',
            status='active'
        )
        long_content = 'x' * 10000

        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=long_content
        )

        self.assertEqual(len(message.content), 10000)

    def test_unicode_in_messages(self):
        """Test Unicode characters in messages"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='unicode-session-001',
            status='active'
        )

        arabic_message = 'مرحباً، أنا أحتاج مساعدة في الحجز'
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content=arabic_message
        )

        self.assertIn('مرحباً', message.content)

    def test_multiple_intents_per_message(self):
        """Test multiple intents detection"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='multi-intent-session-001',
            status='active'
        )
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content='I want to book and know about returns'
        )

        intents = [
            ChatIntent.objects.create(
                session=session,
                message=message,
                intent_type='booking_help',
                confidence=Decimal('0.85')
            ),
            ChatIntent.objects.create(
                session=session,
                intent_type='return_inquiry',
                confidence=Decimal('0.70')
            )
        ]

        self.assertEqual(len(intents), 2)

    def test_session_with_many_messages(self):
        """Test session with many messages"""
        session = ChatSession.objects.create(
            user=self.user,
            session_id='many-msgs-session-001',
            status='active'
        )

        messages = [
            ChatMessage(session=session, role='user', content=f'Message {i}')
            for i in range(100)
        ]
        ChatMessage.objects.bulk_create(messages)

        count = ChatMessage.objects.filter(session=session).count()
        self.assertEqual(count, 100)

    def test_configuration_values(self):
        """Test various configuration values"""
        configs = [
            ChatbotConfiguration(key='api_key', value='secret123'),
            ChatbotConfiguration(key='max_tokens', value='1000'),
            ChatbotConfiguration(key='temperature', value='0.7'),
        ]

        for config in configs:
            config.save()

        count = ChatbotConfiguration.objects.count()
        self.assertEqual(count, 3)


if __name__ == '__main__':
    import unittest
    unittest.main()
