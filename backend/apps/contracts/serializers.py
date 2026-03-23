from rest_framework import serializers
from .models import SmartAgreement, Contract

class AudioUploadSerializer(serializers.Serializer):
    audio = serializers.FileField()
    booking_id = serializers.IntegerField(required=True)
    
    def validate_audio(self, value):
        if value.size > 10 * 1024 * 1024:  # 10MB
            raise serializers.ValidationError("Audio file too large. Max 10MB.")
        return value

class SmartAgreementSerializer(serializers.ModelSerializer):
    class Meta:
        model = SmartAgreement
        fields = [
            'id', 'buyer', 'seller', 'audio_file', 
            'transcript', 'extracted_terms', 
            'status', 'risk_score_snapshot', 
            'created_at',
            'buyer_signed_at', 'seller_signed_at', 'digital_signature_hash'
        ]
        read_only_fields = ['buyer', 'seller', 'transcript', 'extracted_terms', 'risk_score_snapshot', 'status']

class ContractSerializer(serializers.ModelSerializer):
    class Meta:
        model = Contract
        fields = [
            'id', 'booking', 'snapshot', 'contract_hash', 'version',
            'status', 'signed_at', 'is_finalized',
            'renter_signature', 'renter_signed_at',
            'owner_signature', 'owner_signed_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['snapshot', 'contract_hash', 'version']
