from rest_framework import serializers
from .models import HygieneRecord, HygieneChecklist, HygieneCertificate


class HygieneChecklistSerializer(serializers.ModelSerializer):
    checked_by_email = serializers.EmailField(source='checked_by.email', read_only=True)
    
    class Meta:
        model = HygieneChecklist
        fields = [
            'id', 'item_name', 'is_checked', 'notes',
            'checked_by', 'checked_by_email', 'checked_at'
        ]


class HygieneCertificateSerializer(serializers.ModelSerializer):
    is_expired = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = HygieneCertificate
        fields = [
            'id', 'hygiene_record', 'certificate_number',
            'issued_date', 'expiry_date', 'qr_code',
            'is_valid', 'is_expired'
        ]
        read_only_fields = ['issued_date']


class HygieneRecordSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name_ar', read_only=True)
    cleaned_by_email = serializers.EmailField(source='cleaned_by.email', read_only=True)
    verified_by_email = serializers.EmailField(source='verified_by.email', read_only=True)
    checklist_items = HygieneChecklistSerializer(many=True, read_only=True)
    certificate = HygieneCertificateSerializer(read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = HygieneRecord
        fields = [
            'id', 'product', 'product_name',
            'cleaning_type', 'status',
            'scheduled_date', 'started_at', 'completed_at', 'verified_at',
            'cleaned_by', 'cleaned_by_email',
            'verified_by', 'verified_by_email',
            'related_return',
            'cleaning_notes', 'inspection_notes', 'chemicals_used', 'temperature',
            'passed_inspection', 'quality_score',
            'checklist_items', 'certificate',
            'is_overdue', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

