"""
Serializers for Phase 23: Public Transparency & Social Legitimacy

Public-facing serializers for anonymized judgments and metrics.
"""
from rest_framework import serializers
from .models import AnonymizedJudgment, PublicMetrics, MetricContextCard
from .judgment_anonymizer import JudgmentAnonymizer
from .throttles import PublicJudgmentLedgerThrottle, PublicMetricsThrottle


class AnonymizedJudgmentSerializer(serializers.ModelSerializer):
    """
    Serializer for anonymized judgments.
    
    Only exposes safe, de-identified data.
    """
    consistency_band = serializers.SerializerMethodField()
    publication_status = serializers.SerializerMethodField()
    
    class Meta:
        model = AnonymizedJudgment
        fields = [
            'id',
            'judgment_hash',
            'category',
            'dispute_type',
            'ruling_summary',
            'verdict',
            'awarded_ratio',  # May be None (redacted)
            'evidence_types',
            'consistency_score',
            'consistency_band',
            'similar_cases_count',
            'judgment_date',
            'geographic_region',  # May be None (redacted)
            'uniqueness_score',
            'publication_status',
            'published_at',
        ]
        read_only_fields = fields
    
    def get_consistency_band(self, obj):
        """
        Convert consistency score to human-readable band.
        
        Sovereign Safeguard: Not just numbers, but interpretable levels.
        """
        score = obj.consistency_score
        
        if score >= 80:
            return {
                'level': 'HIGH',
                'label': 'عالي التوافق',
                'description': 'Similar to 80%+ of comparable cases'
            }
        elif score >= 60:
            return {
                'level': 'MEDIUM',
                'label': 'متوسط التوافق',
                'description': 'Similar to 60-80% of comparable cases'
            }
        else:
            return {
                'level': 'LOW',
                'label': 'منخفض التوافق',
                'description': 'Unique circumstances, fewer similarities'
            }
    
    def get_publication_status(self, obj):
        """
        Indicate if judgment is published or delayed.
        """
        is_published = JudgmentAnonymizer.should_publish(obj)
        
        if is_published:
            return {
                'status': 'PUBLISHED',
                'label': 'منشور',
                'delayed_until': None
            }
        else:
            return {
                'status': 'DELAYED',
                'label': 'مؤجل للخصوصية',
                'delayed_until': obj.publication_delayed_until.isoformat() if obj.publication_delayed_until else None,
                'reason': 'High uniqueness score - protecting privacy'
            }


class AnonymizedJudgmentListSerializer(serializers.ModelSerializer):
    """
    Lighter serializer for list views.
    """
    consistency_band = serializers.SerializerMethodField()
    
    class Meta:
        model = AnonymizedJudgment
        fields = [
            'id',
            'judgment_hash',
            'category',
            'dispute_type',
            'verdict',
            'awarded_ratio',
            'consistency_score',
            'consistency_band',
            'judgment_date',
            'geographic_region',
            'published_at',
        ]
        read_only_fields = fields
    
    def get_consistency_band(self, obj):
        """Simplified band for list view."""
        score = obj.consistency_score
        if score >= 80:
            return 'HIGH'
        elif score >= 60:
            return 'MEDIUM'
        else:
            return 'LOW'


class MetricContextCardSerializer(serializers.ModelSerializer):
    """
    Serializer for metric context cards.
    
    Sovereign Safeguard #2: Never show numbers without WHY.
    """
    class Meta:
        model = MetricContextCard
        fields = [
            'id',
            'context_explanation',
            'counter_narrative',
            'sample_scenarios',
        ]
        read_only_fields = fields


class PublicMetricsSerializer(serializers.ModelSerializer):
    """
    Serializer for public metrics with mandatory context.
    """
    context_card = MetricContextCardSerializer(read_only=True)
    
    class Meta:
        model = PublicMetrics
        fields = [
            'id',
            'metric_type',
            'category',
            'period_start',
            'period_end',
            'value_numeric',
            'value_json',
            'context_card',  # MANDATORY
            'computed_at',
        ]
        read_only_fields = fields
    
    def to_representation(self, instance):
        """
        Ensure context card is always present.
        
        If missing, raise error (should never happen in production).
        """
        data = super().to_representation(instance)
        
        if not data.get('context_card'):
            # This should NEVER happen - every metric MUST have context
            raise serializers.ValidationError(
                "Metric missing mandatory context card (Sovereign Safeguard #2 violation)"
            )
        
        return data
