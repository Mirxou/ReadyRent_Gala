"""
Serializers for Disputes app
"""
from rest_framework import serializers
from .models import (
    Dispute, DisputeMessage, SupportTicket, TicketMessage, EvidenceLog, Judgment, Appeal, 
    JudgmentPrecedent, JudicialPanel, AnonymizedJudgment, PublicMetrics,
    MediationSession, SettlementOffer
)
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



class EvidenceLogSerializer(serializers.ModelSerializer):
    """Serializer for Evidence Log"""
    actor_email = serializers.EmailField(source='actor.email', read_only=True)
    
    class Meta:
        model = EvidenceLog
        fields = [
            'id', 'action', 'actor', 'actor_email', 'timestamp',
            'metadata', 'hash', 'previous_hash', 'context_snapshot'
        ]

class JudgmentSerializer(serializers.ModelSerializer):
    """Serializer for Judgment"""
    judge_name = serializers.CharField(source='judge.get_full_name', read_only=True)
    
    class Meta:
        model = Judgment
        fields = [
            'id', 'verdict', 'ruling_text', 'status', 
            'awarded_amount', 'created_at', 'finalized_at', 'judge_name'
        ]

class AppealSerializer(serializers.ModelSerializer):
    """Serializer for Appeal"""
    appellant_email = serializers.EmailField(source='appellant.email', read_only=True)
    
    class Meta:
        model = Appeal
        fields = [
            'id', 'reason', 'status', 'appellant_email', 'created_at'
        ]

class TribunalDisputeSerializer(serializers.ModelSerializer):
    """
    High-Context Serializer for the Judicial Tribunal.
    Combines Soul (Behavior) with Body (Evidence).
    """
    user_context = serializers.SerializerMethodField()
    evidence_trail = EvidenceLogSerializer(many=True, read_only=True)
    judgments = JudgmentSerializer(many=True, read_only=True)
    related_precedents = serializers.SerializerMethodField()
    
    class Meta:
        model = Dispute
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'created_at', 'user_context', 'evidence_trail', 'judgments',
            'related_precedents'
        ]
        
    def get_user_context(self, obj):
        user = obj.user
        return {
            "email": user.email,
            "merit_score": user.merit_score,
            "emotional_lock_until": user.emotional_lock_until,
            "consecutive_emotional_attempts": user.consecutive_emotional_attempts,
            "is_verified": user.is_verified
        }

    def get_related_precedents(self, obj):
        from .similarity_engine import SimilarityEngine
        # Get similar judgments
        similar_items = SimilarityEngine.find_similar_judgments(obj, limit=3)
        
        # Serialize them manually to avoid circular dependencies or complex nesting
        serialized = []
        for item in similar_items:
            judgment = item['judgment']
            serialized.append({
                "id": judgment.id,
                "dispute_title": judgment.dispute.title,
                "verdict": judgment.verdict,
                "ruling_summary": judgment.ruling_text[:100] + "...",
                "similarity_score": round(item['similarity_score'] * 100, 1),
                "date": judgment.finalized_at
            })
        return serialized

class SettlementOfferSerializer(serializers.ModelSerializer):
    """Serializer for settlement offers."""
    class Meta:
        model = SettlementOffer
        fields = [
            'id', 'source', 'amount', 'reasoning', 'is_accepted', 
            'created_at', 'status', 'approved_at', 
            'confidence_min', 'confidence_max', 'explainability_version'
        ]
        read_only_fields = ['id', 'source', 'amount', 'reasoning', 'created_at', 'status', 'approved_at']

class MediationSessionSerializer(serializers.ModelSerializer):
    """Serializer for the mediation session state."""
    offers = SettlementOfferSerializer(many=True, read_only=True)
    
    class Meta:
        model = MediationSession
        fields = ['id', 'dispute', 'current_round', 'max_rounds', 'status', 'expires_at', 'offers']
        read_only_fields = ['id', 'dispute', 'current_round', 'max_rounds', 'status', 'expires_at']

class AnonymizedJudgmentSerializer(serializers.ModelSerializer):
    """Serializer for public de-identified records."""
    class Meta:
        model = AnonymizedJudgment
        fields = [
            'judgment_hash', 'category', 'dispute_type', 
            'ruling_summary', 'verdict', 'awarded_ratio',
            'evidence_types', 'consistency_score', 
            'similar_cases_count', 'judgment_date'
        ]

class PublicMetricsSerializer(serializers.ModelSerializer):
    """Serializer for transparency dashboard metrics."""
    context = serializers.CharField(source='context_card.context_explanation', read_only=True)
    counter_narrative = serializers.CharField(source='context_card.counter_narrative', read_only=True)
    
    class Meta:
        model = PublicMetrics
        fields = [
            'metric_type', 'category', 'period_start', 'period_end',
            'value_numeric', 'value_json', 'context', 'counter_narrative'
        ]
