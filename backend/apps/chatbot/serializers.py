from rest_framework import serializers
from .models import ChatSession, ChatMessage, ChatIntent, ChatbotConfiguration


class ChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatMessage
        fields = [
            'id', 'role', 'content',
            'model_used', 'tokens_used',
            'metadata', 'created_at'
        ]
        read_only_fields = ['created_at']


class ChatIntentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatIntent
        fields = [
            'id', 'message', 'intent_type',
            'confidence', 'extracted_entities',
            'created_at'
        ]
        read_only_fields = ['created_at']


class ChatSessionSerializer(serializers.ModelSerializer):
    messages = ChatMessageSerializer(many=True, read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    escalated_to_email = serializers.EmailField(source='escalated_to.email', read_only=True)
    message_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ChatSession
        fields = [
            'id', 'user', 'user_email',
            'session_id', 'status', 'language',
            'started_at', 'resolved_at',
            'escalated_to', 'escalated_to_email', 'escalated_at',
            'context_data', 'messages', 'message_count'
        ]
        read_only_fields = ['started_at', 'resolved_at', 'escalated_at', 'session_id']


class ChatbotConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChatbotConfiguration
        fields = [
            'id', 'key', 'value',
            'description', 'is_active',
            'updated_at'
        ]
        read_only_fields = ['updated_at']

