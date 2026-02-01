import pytest
from rest_framework import status
from django.utils import timezone
from unittest.mock import patch, MagicMock
from apps.chatbot.models import ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration

@pytest.mark.unit
@pytest.mark.django_db
class TestChatbotDetailed:
    """Detailed tests for chatbot views and services to reach 70%+ coverage"""

    def test_create_anonymous_session(self, api_client):
        """Test creating an anonymous chat session"""
        with patch('apps.chatbot.services.ChatbotService.create_session') as mock_create:
            mock_session = MagicMock(spec=ChatSession)
            mock_session.id = 1
            mock_session.session_id = 'test-session-123'
            mock_session.language = 'ar'
            mock_session.created_at = timezone.now()
            mock_session.is_active = True
            mock_session.user = None
            mock_session.messages.all.return_value = []
            mock_create.return_value = mock_session
            
            response = api_client.post('/api/chatbot/sessions/create_anonymous/', {'language': 'ar'})
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data['session_id'] == 'test-session-123'

    def test_send_message_authenticated(self, api_client, regular_user):
        """Test sending a message in an authenticated session"""
        session = ChatSession.objects.create(user=regular_user, session_id='auth-sess-1', language='ar')
        api_client.force_authenticate(user=regular_user)
        
        with patch('apps.chatbot.services.ChatbotService.send_message') as mock_send, \
             patch('apps.chatbot.services.ChatbotService.detect_intent') as mock_intent:
            
            # Setup mock assistant message
            assistant_msg = ChatMessage.objects.create(
                session=session,
                role='assistant',
                content='Hello, how can I help you?',
                tokens=10
            )
            user_msg = ChatMessage.objects.create(
                session=session,
                role='user',
                content='I want to rent a dress',
                tokens=5
            )
            
            mock_send.return_value = {
                'user_message': user_msg,
                'assistant_message': assistant_msg,
                'tokens_used': 15
            }
            mock_intent.return_value = {
                'intent_type': 'rental_query',
                'confidence': 0.95,
                'extracted_entities': {'category': 'dress'}
            }
            
            response = api_client.post(f'/api/chatbot/sessions/{session.id}/send_message/', {'message': 'I want to rent a dress'})
            assert response.status_code == status.HTTP_200_OK
            assert response.data['assistant_message']['content'] == 'Hello, how can I help you?'
            assert ChatIntent.objects.filter(session=session).exists()

    def test_quick_chat_anonymous(self, api_client):
        """Test the quick chat endpoint for anonymous users"""
        with patch('apps.chatbot.services.ChatbotService.create_session') as mock_create, \
             patch('apps.chatbot.services.ChatbotService.send_message') as mock_send:
            
            mock_session = MagicMock(spec=ChatSession)
            mock_session.session_id = 'quick-sess-123'
            mock_create.return_value = mock_session
            
            assistant_msg = MagicMock(spec=ChatMessage)
            assistant_msg.content = 'Quick response'
            
            mock_send.return_value = {
                'assistant_message': assistant_msg,
                'tokens_used': 5
            }
            
            response = api_client.post('/api/chatbot/quick_chat/', {'message': 'Hi', 'language': 'en'})
            assert response.status_code == status.HTTP_200_OK
            assert response.data['response'] == 'Quick response'
            assert response.data['session_id'] == 'quick-sess-123'

    def test_resolve_session(self, api_client, regular_user):
        """Test resolving a chat session"""
        session = ChatSession.objects.create(user=regular_user, session_id='resolve-sess', is_active=True)
        api_client.force_authenticate(user=regular_user)
        
        with patch('apps.chatbot.services.ChatbotService.resolve_session') as mock_resolve:
            session.is_active = False
            mock_resolve.return_value = session
            
            response = api_client.post(f'/api/chatbot/sessions/{session.id}/resolve/')
            assert response.status_code == status.HTTP_200_OK
            assert response.data['is_active'] is False

    def test_chatbot_configuration_admin_only(self, api_client, admin_user, regular_user):
        """Test chatbot configuration is admin-only"""
        ChatbotConfiguration.objects.create(name='Default', model_name='gpt-4')
        
        # Deny regular user
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/chatbot/configurations/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
        
        # Allow admin
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/chatbot/configurations/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 1
