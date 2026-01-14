"""
Serializers for Disputes app
"""
from rest_framework import serializers
from .models import Dispute, DisputeMessage, SupportTicket, TicketMessage
from apps.bookings.serializers import BookingSerializer


class DisputeMessageSerializer(serializers.ModelSerializer):
    """Serializer for Dispute Message"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = DisputeMessage
        fields = [
            'id', 'dispute', 'user', 'user_email', 'message',
            'attachments', 'is_internal', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']


class DisputeSerializer(serializers.ModelSerializer):
    """Serializer for Dispute"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    resolved_by_email = serializers.EmailField(source='resolved_by.email', read_only=True)
    booking = BookingSerializer(read_only=True)
    booking_id = serializers.IntegerField(write_only=True, required=False)
    messages = DisputeMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'user', 'user_email', 'booking', 'booking_id',
            'title', 'description', 'status', 'priority',
            'assigned_to', 'assigned_to_email', 'resolution',
            'resolved_at', 'resolved_by', 'resolved_by_email',
            'created_at', 'updated_at', 'messages', 'message_count'
        ]
        read_only_fields = ['user', 'resolved_at', 'resolved_by', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()


class TicketMessageSerializer(serializers.ModelSerializer):
    """Serializer for Ticket Message"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = TicketMessage
        fields = [
            'id', 'ticket', 'user', 'user_email', 'message',
            'attachments', 'is_internal', 'created_at'
        ]
        read_only_fields = ['user', 'created_at']


class SupportTicketSerializer(serializers.ModelSerializer):
    """Serializer for Support Ticket"""
    user_email = serializers.EmailField(source='user.email', read_only=True)
    assigned_to_email = serializers.EmailField(source='assigned_to.email', read_only=True)
    messages = TicketMessageSerializer(many=True, read_only=True)
    message_count = serializers.SerializerMethodField()
    
    class Meta:
        model = SupportTicket
        fields = [
            'id', 'user', 'user_email', 'subject', 'description',
            'status', 'priority', 'category', 'assigned_to', 'assigned_to_email',
            'resolution', 'resolved_at', 'created_at', 'updated_at',
            'messages', 'message_count'
        ]
        read_only_fields = ['user', 'resolved_at', 'created_at', 'updated_at']
    
    def get_message_count(self, obj):
        return obj.messages.count()


