"""
Unit tests for hygiene Serializers
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.hygiene.serializers import (
    HygieneRecordSerializer, HygieneChecklistSerializer, HygieneCertificateSerializer
)
from apps.hygiene.models import HygieneRecord, HygieneChecklist, HygieneCertificate
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneRecordSerializer:
    """Test HygieneRecord serializer"""
    
    def test_hygiene_record_serialization(self, product, staff_user, api_client):
        """Test hygiene record serialization"""
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='standard',
            status='pending',
            scheduled_date=timezone.now() + timedelta(days=1)
        )
        
        serializer = HygieneRecordSerializer(record)
        data = serializer.data
        
        assert 'id' in data
        assert 'product' in data
        assert 'product_name' in data
        assert 'cleaning_type' in data
        assert 'status' in data
        assert 'is_overdue' in data
        assert 'checklist_items' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneChecklistSerializer:
    """Test HygieneChecklist serializer"""
    
    def test_checklist_serialization(self, product, staff_user, api_client):
        """Test checklist serialization"""
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='standard',
            status='pending',
            scheduled_date=timezone.now()
        )
        
        checklist = HygieneChecklist.objects.create(
            hygiene_record=record,
            item_name='Test Item',
            is_checked=True,
            checked_by=staff_user
        )
        
        serializer = HygieneChecklistSerializer(checklist)
        data = serializer.data
        
        assert 'id' in data
        assert 'item_name' in data
        assert 'is_checked' in data
        assert 'checked_by_email' in data


@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneCertificateSerializer:
    """Test HygieneCertificate serializer"""
    
    def test_certificate_serialization(self, product, api_client):
        """Test certificate serialization"""
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='standard',
            status='verified',
            scheduled_date=timezone.now()
        )
        
        certificate = HygieneCertificate.objects.create(
            hygiene_record=record,
            certificate_number='CERT-001',
            is_valid=True
        )
        
        serializer = HygieneCertificateSerializer(certificate)
        data = serializer.data
        
        assert 'id' in data
        assert 'certificate_number' in data
        assert 'is_valid' in data
        assert 'is_expired' in data
