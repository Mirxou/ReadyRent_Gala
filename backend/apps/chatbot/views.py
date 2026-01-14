from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.throttling import ScopedRateThrottle
from django.utils import timezone
from core.throttling import ChatbotThrottle
from .models import ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration
from .serializers import (
    ChatSessionSerializer, ChatMessageSerializer,
    ChatIntentSerializer, ChatbotConfigurationSerializer
)
from .services import ChatbotService


class ChatSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chat sessions
    """
    queryset = ChatSession.objects.select_related('user', 'escalated_to').prefetch_related('messages').all()
    serializer_class = ChatSessionSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [ChatbotThrottle]
    throttle_scope = 'chatbot'
    
    def get_queryset(self):
        """Filter sessions by user"""
        user = self.request.user
        if user.role in ['admin', 'staff']:
            return self.queryset
        return self.queryset.filter(user=user)
    
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def create_anonymous(self, request):
        """Create anonymous chat session (for non-authenticated users)"""
        language = request.data.get('language', 'ar')
        chatbot_service = ChatbotService()
        session = chatbot_service.create_session(user=None, language=language)
        serializer = self.get_serializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def send_message(self, request, pk=None):
        """Send a message in chat session"""
        session = self.get_object()
        
        # Check permissions
        if session.user and session.user != request.user and request.user.role not in ['admin', 'staff']:
            return Response(
                {'error': 'Not authorized'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        message_content = request.data.get('message', '')
        if not message_content:
            return Response(
                {'error': 'Message content is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        chatbot_service = ChatbotService()
        result = chatbot_service.send_message(session, message_content)
        
        # Detect intent
        intent_data = chatbot_service.detect_intent(message_content)
        ChatIntent.objects.create(
            session=session,
            message=result['user_message'],
            intent_type=intent_data['intent_type'],
            confidence=intent_data['confidence'],
            extracted_entities=intent_data['extracted_entities']
        )
        
        # Return both messages
        return Response({
            'user_message': ChatMessageSerializer(result['user_message']).data,
            'assistant_message': ChatMessageSerializer(result['assistant_message']).data,
            'tokens_used': result['tokens_used'],
            'session': ChatSessionSerializer(session).data
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def escalate(self, request, pk=None):
        """Escalate chat to human support"""
        session = self.get_object()
        chatbot_service = ChatbotService()
        session = chatbot_service.escalate_to_human(session, request.user)
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def resolve(self, request, pk=None):
        """Resolve chat session"""
        session = self.get_object()
        chatbot_service = ChatbotService()
        session = chatbot_service.resolve_session(session)
        serializer = self.get_serializer(session)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def my_sessions(self, request):
        """Get current user's chat sessions"""
        my_sessions = self.get_queryset().filter(user=request.user)
        serializer = self.get_serializer(my_sessions, many=True)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def quick_chat(request):
    """
    Quick chat endpoint for anonymous users
    Creates session and sends first message
    
    Rate limited: 20 requests per minute
    """
    message = request.data.get('message', '')
    language = request.data.get('language', 'ar')
    
    if not message:
        return Response(
            {'error': 'Message is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    chatbot_service = ChatbotService()
    session = chatbot_service.create_session(user=None, language=language)
    result = chatbot_service.send_message(session, message)
    
    return Response({
        'session_id': session.session_id,
        'response': result['assistant_message'].content,
        'tokens_used': result['tokens_used']
    })


class ChatbotConfigurationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chatbot configuration
    """
    queryset = ChatbotConfiguration.objects.all()
    serializer_class = ChatbotConfigurationSerializer
    permission_classes = [IsAdminUser]

