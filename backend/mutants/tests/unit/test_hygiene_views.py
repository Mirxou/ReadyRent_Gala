"""
Unit tests for hygiene Views
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.hygiene.models import HygieneRecord, HygieneChecklist, HygieneCertificate
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneRecordViewSet:
    """Test HygieneRecord ViewSet"""
    
    def test_list_requires_auth(self, api_client):
        """Test listing hygiene records requires authentication"""
        response = api_client.get('/api/hygiene/hygiene-records/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_as_authenticated(self, api_client, regular_user, product):
        """Test listing hygiene records as authenticated user"""
        HygieneRecord.objects.create(
            product=product,
            cleaning_type='standard',
            status='pending',
            scheduled_date=timezone.now()
        )
        
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/hygiene/hygiene-records/')
        
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_requires_admin(self, api_client, regular_user, product):
        """Test creating hygiene record requires admin"""
        api_client.force_authenticate(user=regular_user)
        
        response = api_client.post('/api/hygiene/hygiene-records/', {
            'product': product.id,
            'cleaning_type': 'standard',
            'scheduled_date': (timezone.now() + timedelta(days=1)).isoformat()
        })
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_start_cleaning(self, api_client, admin_user, product):
        """Test start cleaning action"""
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='standard',
            status='pending',
            scheduled_date=timezone.now()
        )
        
        api_client.force_authenticate(user=admin_user)
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/start_cleaning/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'in_progress'
