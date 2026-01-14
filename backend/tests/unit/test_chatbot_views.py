"""
Unit tests for chatbot Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.chatbot.models import ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestChatSessionViewSet:
    """Test ChatSession ViewSet"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing sessions requires authentication"""
        response = api_client.get('/api/chatbot/sessions/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_session(self, api_client, regular_user):
        """Test creating chat session"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/chatbot/sessions/', {
            'language': 'ar'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'session_id' in response.data
    
    def test_create_anonymous_session(self, api_client):
        """Test creating anonymous session"""
        response = api_client.post('/api/chatbot/sessions/create_anonymous/', {
            'language': 'ar'
        })
        
        assert response.status_code == status.HTTP_201_CREATED
    
    def test_list_user_sessions(self, api_client, regular_user):
        """Test listing user sessions"""
        ChatSession.objects.create(
            user=regular_user,
            session_id='test_session_123',
            status='active'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/chatbot/sessions/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
