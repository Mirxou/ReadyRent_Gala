"""
Unit tests for chatbot Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from decimal import Decimal

from apps.chatbot.serializers import (
    ChatSessionSerializer, ChatMessageSerializer,
    ChatIntentSerializer, ChatbotConfigurationSerializer
)
from apps.chatbot.models import (
    ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration
)

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestChatSessionSerializer:
    """Test ChatSession serializer"""
    
    def test_chat_session_serialization(self, regular_user, api_client):
        """Test chat session serialization"""
        session = ChatSession.objects.create(
            user=regular_user,
            session_id='test_session_123',
            status='active',
            language='ar'
        )
        
        serializer = ChatSessionSerializer(session)
        data = serializer.data
        
        assert 'id' in data
        assert 'user' in data
        assert 'user_email' in data
        assert 'session_id' in data
        assert 'status' in data
        assert 'messages' in data
        assert 'message_count' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestChatMessageSerializer:
    """Test ChatMessage serializer"""
    
    def test_chat_message_serialization(self, regular_user, api_client):
        """Test chat message serialization"""
        session = ChatSession.objects.create(
            user=regular_user,
            session_id='test_session_123',
            status='active'
        )
        
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content='Hello',
            model_used='gpt-4',
            tokens_used=10
        )
        
        serializer = ChatMessageSerializer(message)
        data = serializer.data
        
        assert 'id' in data
        assert 'role' in data
        assert 'content' in data
        assert 'model_used' in data
        assert data['role'] == 'user'


@pytest.mark.unit
@pytest.mark.django_db
class TestChatIntentSerializer:
    """Test ChatIntent serializer"""
    
    def test_chat_intent_serialization(self, regular_user, api_client):
        """Test chat intent serialization"""
        session = ChatSession.objects.create(
            user=regular_user,
            session_id='test_session_123',
            status='active'
        )
        
        message = ChatMessage.objects.create(
            session=session,
            role='user',
            content='What products do you have?'
        )
        
        intent = ChatIntent.objects.create(
            session=session,
            message=message,
            intent_type='product_inquiry',
            confidence=Decimal('0.95')
        )
        
        serializer = ChatIntentSerializer(intent)
        data = serializer.data
        
        assert 'id' in data
        assert 'intent_type' in data
        assert 'confidence' in data
        assert data['intent_type'] == 'product_inquiry'
