
import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from apps.users.models import User

@pytest.mark.django_db
class TestJudicialMiddleware:
    def setup_method(self):
        self.user = User.objects.create_user(
            username="testuser", 
            email="test@example.com", 
            password="password123"
        )
        self.url = reverse('sovereign-dispute-initiate')

    def test_middleware_blocks_locked_user(self, client):
        # 1. Manually set a lock for the user
        lock_until = timezone.now() + timezone.timedelta(hours=2)
        self.user.emotional_lock_until = lock_until
        self.user.save()

        client.force_login(self.user)
        
        # 2. Try to access the judicial endpoint
        response = client.post(self.url, {
            'emotional_state': 'calm',
            'title': 'Test Title',
            'description': 'Test Description'
        })

        # 3. Assert the middleware intercepted (Status 200 but sovereign_halt)
        data = response.json()
        assert data['status'] == 'sovereign_halt'
        assert data['code'] == 'DIGNITY_COOLING_OFF'
        assert 'unlocks_at' in data['verdict']

    def test_middleware_allows_unlocked_user(self, client):
        # 1. No lock
        client.force_login(self.user)
        
        # 2. Access the judicial endpoint
        response = client.post(self.url, {
            'emotional_state': 'calm',
            'title': 'Allowed Dispute',
            'description': 'This should pass'
        }, content_type='application/json')

        # 3. Assert the view was reached (sovereign_proceeding)
        data = response.json()
        assert data['status'] == 'sovereign_proceeding'
        assert data['dignity_preserved'] is True
