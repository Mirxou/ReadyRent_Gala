"""
Unit tests for notifications Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone

from apps.notifications.serializers import NotificationSerializer
from apps.notifications.models import Notification

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationSerializer:
    """Test NotificationSerializer"""
    
    def test_serializer_with_valid_data(self, regular_user):
        """Test serializer with valid notification data"""
        data = {
            'type': 'booking_confirmed',
            'title': 'Booking Confirmed',
            'message': 'Your booking has been confirmed',
            'is_read': False
        }
        
        serializer = NotificationSerializer(data=data)
        assert serializer.is_valid()
        
        # Save with user (user field is not in serializer fields)
        notification = serializer.save(user=regular_user)
        assert notification.user == regular_user
        assert notification.type == 'booking_confirmed'
        assert notification.title == 'Booking Confirmed'
        assert not notification.is_read
    
    def test_serializer_read_only_fields(self, regular_user):
        """Test that created_at is read-only"""
        notification = Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test',
            message='Test message'
        )
        
        # Try to modify created_at
        original_created = notification.created_at
        data = {
            'type': 'booking_confirmed',
            'title': 'Updated',
            'message': 'Updated message',
            'created_at': timezone.now() + timezone.timedelta(days=1)
        }
        
        serializer = NotificationSerializer(notification, data=data, partial=True)
        assert serializer.is_valid()
        updated = serializer.save()
        
        # created_at should not change
        assert updated.created_at == original_created
    
    def test_serializer_required_fields(self):
        """Test that required fields are validated"""
        data = {}
        serializer = NotificationSerializer(data=data)
        
        assert not serializer.is_valid()
        assert 'type' in serializer.errors
        assert 'title' in serializer.errors
        assert 'message' in serializer.errors
    
    def test_serializer_invalid_type(self):
        """Test validation for invalid notification type"""
        data = {
            'type': 'invalid_type',
            'title': 'Test',
            'message': 'Test message'
        }
        
        serializer = NotificationSerializer(data=data)
        assert not serializer.is_valid()
        assert 'type' in serializer.errors
    
    def test_serializer_mark_as_read(self, regular_user):
        """Test updating is_read status"""
        notification = Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test',
            message='Test message',
            is_read=False
        )
        
        data = {'is_read': True}
        serializer = NotificationSerializer(notification, data=data, partial=True)
        
        assert serializer.is_valid()
        updated = serializer.save()
        assert updated.is_read
    
    def test_serializer_output_fields(self, regular_user):
        """Test that serializer outputs correct fields"""
        notification = Notification.objects.create(
            user=regular_user,
            type='booking_reminder',
            title='Reminder',
            message='Your booking is tomorrow',
            is_read=False
        )
        
        serializer = NotificationSerializer(notification)
        data = serializer.data
        
        # Check all expected fields are present
        assert 'id' in data
        assert 'type' in data
        assert 'title' in data
        assert 'message' in data
        assert 'is_read' in data
        assert 'created_at' in data
        
        # User field should not be in output
        assert 'user' not in data
        
        assert data['type'] == 'booking_reminder'
        assert data['title'] == 'Reminder'
        assert data['is_read'] is False
    
    def test_serializer_all_notification_types(self, regular_user):
        """Test serializer with all valid notification types"""
        valid_types = [
            'booking_confirmed',
            'booking_reminder',
            'booking_completed',
            'return_reminder',
            'product_available',
            'system'
        ]
        
        for notif_type in valid_types:
            data = {
                'type': notif_type,
                'title': f'Test {notif_type}',
                'message': 'Test message'
            }
            serializer = NotificationSerializer(data=data)
            assert serializer.is_valid(), f"Failed for type: {notif_type}"
