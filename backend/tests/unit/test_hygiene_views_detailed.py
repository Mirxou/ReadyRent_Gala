import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from apps.hygiene.models import HygieneRecord, HygieneCertificate
from apps.products.models import Product

@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneDetailed:
    """Detailed tests for hygiene views to reach 70%+ coverage"""

    def test_complete_cleaning_flow(self, api_client, admin_user, product):
        """Test the full flow from pending -> in_progress -> completed -> verified"""
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='deep',
            status='pending',
            scheduled_date=timezone.now()
        )
        api_client.force_authenticate(user=admin_user)
        
        # 1. Start
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/start_cleaning/')
        assert response.status_code == status.HTTP_200_OK
        
        # 2. Complete
        data = {
            'cleaning_notes': 'Cleaned with soap',
            'chemicals_used': 'Soap, Water',
            'temperature': 60.0
        }
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/complete_cleaning/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'completed'
        
        # 3. Verify (pass)
        data = {
            'passed_inspection': True,
            'quality_score': 9,
            'inspection_notes': 'Very clean'
        }
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/verify/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'verified'
        assert HygieneCertificate.objects.filter(hygiene_record=record).exists()

    def test_verify_fail_flow(self, api_client, admin_user, product):
        """Test verifying as failed"""
        record = HygieneRecord.objects.create(
            product=product,
            status='completed',
            scheduled_date=timezone.now()
        )
        api_client.force_authenticate(user=admin_user)
        
        data = {
            'passed_inspection': False,
            'quality_score': 3,
            'inspection_notes': 'Still dirty'
        }
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/verify/', data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'failed'
        assert not HygieneCertificate.objects.filter(hygiene_record=record).exists()

    def test_pending_records_action(self, api_client, regular_user, product):
        """Test the pending records action"""
        HygieneRecord.objects.create(
            product=product,
            status='pending',
            scheduled_date=timezone.now()
        )
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/hygiene/hygiene-records/pending/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_latest_for_product_action(self, api_client, regular_user, product):
        """Test latest_for_product action"""
        HygieneRecord.objects.create(
            product=product,
            status='verified',
            scheduled_date=timezone.now() - timedelta(days=1),
            completed_at=timezone.now() - timedelta(hours=5)
        )
        api_client.force_authenticate(user=regular_user)
        response = api_client.get(f'/api/hygiene/hygiene-records/latest_for_product/?product={product.id}')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['record'] is not None

    def test_hygiene_certificate_viewset(self, api_client, regular_user, product):
        """Test HygieneCertificate ViewSet"""
        record = HygieneRecord.objects.create(
            product=product,
            status='verified',
            scheduled_date=timezone.now()
        )
        cert = HygieneCertificate.objects.create(
            hygiene_record=record,
            certificate_number='CERT-123'
        )
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/hygiene/certificates/')
        assert response.status_code == status.HTTP_200_OK
        # Check if paginated or list
        if isinstance(response.data, dict) and 'results' in response.data:
            assert len(response.data['results']) >= 1
        else:
            assert len(response.data) >= 1

    def test_invalid_status_transitions(self, api_client, admin_user, product):
        """Test transitions from wrong statuses"""
        record = HygieneRecord.objects.create(
            product=product,
            status='completed',
            scheduled_date=timezone.now()
        )
        api_client.force_authenticate(user=admin_user)
        
        # Try to start cleaning when already completed
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/start_cleaning/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Try to complete cleaning when not in_progress
        record.status = 'pending'
        record.save()
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/complete_cleaning/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        
        # Try to verify when not completed
        response = api_client.post(f'/api/hygiene/hygiene-records/{record.id}/verify/')
        assert response.status_code == status.HTTP_400_BAD_REQUEST
