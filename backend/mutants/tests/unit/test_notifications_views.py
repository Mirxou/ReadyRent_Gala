"""
Unit tests for notifications Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.urls import reverse

from apps.notifications.models import Notification

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationListView:
    """Test NotificationListView"""
    
    def test_list_notifications_authenticated(self, api_client, regular_user):
        """Test listing notifications for authenticated user"""
        # Create notifications for user
        Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test 1',
            message='Message 1'
        )
        Notification.objects.create(
            user=regular_user,
            type='booking_confirmed',
            title='Test 2',
            message='Message 2'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/notifications/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 2
    
    def test_list_notifications_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot list notifications"""
        response = api_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_notifications_filters_by_user(self, api_client, regular_user):
        """Test that users only see their own notifications"""
        # Create another user
        other_user = User.objects.create_user(
            email='other@test.com',
            username='otheruser',
            password='testpass123'
        )
        
        # Create notifications for both users
        Notification.objects.create(
            user=regular_user,
            type='system',
            title='User notification',
            message='For user'
        )
        Notification.objects.create(
            user=other_user,
            type='system',
            title='Other notification',
            message='For other'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/notifications/')
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['title'] == 'User notification'
    
    def test_list_notifications_ordering(self, api_client, regular_user):
        """Test that notifications are ordered by created_at desc"""
        # Create notifications in specific order
        notif1 = Notification.objects.create(
            user=regular_user,
            type='system',
            title='First',
            message='Message 1'
        )
        notif2 = Notification.objects.create(
            user=regular_user,
            type='system',
            title='Second',
            message='Message 2'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/notifications/')
        
        assert response.status_code == status.HTTP_200_OK
        # Most recent first
        assert response.data[0]['title'] == 'Second'
        assert response.data[1]['title'] == 'First'


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationMarkReadView:
    """Test NotificationMarkReadView"""
    
    def test_mark_notification_as_read(self, api_client, regular_user):
        """Test marking a notification as read"""
        notification = Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test',
            message='Test message',
            is_read=False
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.patch(f'/api/notifications/{notification.id}/read/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'marked as read'
        
        notification.refresh_from_db()
        assert notification.is_read
    
    def test_mark_read_unauthenticated(self, api_client, regular_user):
        """Test that unauthenticated users cannot mark as read"""
        notification = Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test',
            message='Test message'
        )
        
        response = api_client.patch(f'/api/notifications/{notification.id}/read/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_mark_read_other_users_notification(self, api_client, regular_user):
        """Test that users cannot mark other users' notifications as read"""
        other_user = User.objects.create_user(
            email='other@test.com',
            username='otheruser2',
            password='testpass123'
        )
        
        notification = Notification.objects.create(
            user=other_user,
            type='system',
            title='Test',
            message='Test message'
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.patch(f'/api/notifications/{notification.id}/read/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
    
    def test_mark_read_nonexistent_notification(self, api_client, regular_user):
        """Test marking nonexistent notification returns 404"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.patch('/api/notifications/99999/read/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationMarkAllReadView:
    """Test NotificationMarkAllReadView"""
    
    def test_mark_all_notifications_as_read(self, api_client, regular_user):
        """Test marking all notifications as read"""
        # Create multiple unread notifications
        Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test 1',
            message='Message 1',
            is_read=False
        )
        Notification.objects.create(
            user=regular_user,
            type='booking_confirmed',
            title='Test 2',
            message='Message 2',
            is_read=False
        )
        Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test 3',
            message='Message 3',
            is_read=True  # Already read
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/notifications/mark-all-read/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'success'
        assert '2 notifications marked as read' in response.data['message']
        
        # Verify all are now read
        unread_count = Notification.objects.filter(user=regular_user, is_read=False).count()
        assert unread_count == 0
    
    def test_mark_all_read_unauthenticated(self, api_client):
        """Test that unauthenticated users cannot mark all as read"""
        response = api_client.post('/api/notifications/mark-all-read/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_mark_all_read_only_affects_own_notifications(self, api_client, regular_user):
        """Test that mark all only affects user's own notifications"""
        other_user = User.objects.create_user(
            email='other@test.com',
            username='otheruser3',
            password='testpass123'
        )
        
        # Create notifications for both users
        Notification.objects.create(
            user=regular_user,
            type='system',
            title='User notif',
            message='Message',
            is_read=False
        )
        other_notif = Notification.objects.create(
            user=other_user,
            type='system',
            title='Other notif',
            message='Message',
            is_read=False
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/notifications/mark-all-read/')
        
        assert response.status_code == status.HTTP_200_OK
        
        # Other user's notification should still be unread
        other_notif.refresh_from_db()
        assert not other_notif.is_read
    
    def test_mark_all_read_no_unread_notifications(self, api_client, regular_user):
        """Test marking all as read when no unread notifications exist"""
        # Create only read notifications
        Notification.objects.create(
            user=regular_user,
            type='system',
            title='Test',
            message='Message',
            is_read=True
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/notifications/mark-all-read/')
        
        assert response.status_code == status.HTTP_200_OK
        assert '0 notifications marked as read' in response.data['message']
