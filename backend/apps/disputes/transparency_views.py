"""
Views for Phase 23: Public Transparency & Social Legitimacy

Public-facing API for browsing anonymized judgments and metrics.
"""
from apps.disputes.throttles import PublicJudgmentLedgerThrottle, PublicMetricsThrottle
from rest_framework import viewsets, filters, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as df_filters
from django.db.models import Q, Count
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

from .models import AnonymizedJudgment, PublicMetrics
from .transparency_serializers import (
    AnonymizedJudgmentSerializer, AnonymizedJudgmentListSerializer,
    PublicMetricsSerializer, MetricContextCardSerializer
)
from .services import AnonymizationService
from .expectation_setter import ExpectationSetter
from apps.products.models import Product
from apps.bookings.models import Booking


class AnonymizedJudgmentFilter(df_filters.FilterSet):
    """
    Filter for public judgment search.
    
    Allows filtering by:
    - Category
    - Verdict
    - Date range
    - Consistency level
    - Evidence types
    """
    category = df_filters.CharFilter(field_name='category', lookup_expr='icontains')
    verdict = df_filters.ChoiceFilter(choices=[
        ('favor_owner', 'Favor Owner'),
        ('favor_tenant', 'Favor Tenant'),
        ('favor_renter', 'Favor Renter'),
        ('partial', 'Partial'),
    ])
    
    # Date filters
    date_from = df_filters.DateFilter(field_name='judgment_date', lookup_expr='gte')
    date_to = df_filters.DateFilter(field_name='judgment_date', lookup_expr='lte')
    
    # Consistency filters
    consistency_min = df_filters.NumberFilter(field_name='consistency_score', lookup_expr='gte')
    consistency_max = df_filters.NumberFilter(field_name='consistency_score', lookup_expr='lte')
    consistency_band = df_filters.ChoiceFilter(method='filter_consistency_band', choices=[
        ('HIGH', 'High Consistency'),
        ('MEDIUM', 'Medium Consistency'),
        ('LOW', 'Low Consistency'),
    ])
    
    # Evidence filters
    has_photo = df_filters.BooleanFilter(method='filter_has_evidence', field_name='photo')
    has_contract = df_filters.BooleanFilter(method='filter_has_evidence', field_name='contract')
    
    class Meta:
        model = AnonymizedJudgment
        fields = ['category', 'verdict', 'date_from', 'date_to']
    
    def filter_consistency_band(self, queryset, name, value):
        """Filter by consistency band."""
        if value == 'HIGH':
            return queryset.filter(consistency_score__gte=80)
        elif value == 'MEDIUM':
            return queryset.filter(consistency_score__gte=60, consistency_score__lt=80)
        elif value == 'LOW':
            return queryset.filter(consistency_score__lt=60)
        return queryset
    
    def filter_has_evidence(self, queryset, name, value):
        """Filter by evidence type."""
        evidence_type = name.replace('has_', '')
        
        if value:
            # Has this evidence type
            return queryset.filter(evidence_types__contains=[evidence_type])
        else:
            # Does not have this evidence type
            return queryset.exclude(evidence_types__contains=[evidence_type])


@method_decorator(cache_page(60 * 5), name='dispatch')  # 5 minutes TTL for List and Detail views
class PublicJudgmentLedgerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public Judgment Ledger API.
    
    READ-ONLY access to anonymized judgments.
    
    Features:
    - Search and filter
    - Consistency bands
    - Similar cases
    - NO authentication required (public data)
    
    Sovereign Safeguards:
    - Only published judgments visible
    - All PII removed
    - Uniqueness-based redaction applied
    """
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = AnonymizedJudgmentFilter
    search_fields = ['ruling_summary', 'dispute_type']
    ordering_fields = ['judgment_date', 'consistency_score', 'published_at']
    ordering = ['-judgment_date']
    throttle_classes = [PublicJudgmentLedgerThrottle]  # Rate limiting: 200/hour
    
    def get_queryset(self):
        """
        Return only PUBLISHED judgments.
        
        Sovereign Safeguard: Delayed publications not visible.
        """
        queryset = AnonymizedJudgment.objects.all()
        
        # Filter to only published judgments
        now = timezone.now().date()
        queryset = queryset.filter(
            Q(publication_delayed_until__isnull=True) |
            Q(publication_delayed_until__lte=now)
        )
        
        # Exclude extremely high uniqueness (should never be published)
        queryset = queryset.exclude(uniqueness_score__gt=80)
        
        return queryset
    
    def get_serializer_class(self):
        """Use different serializers for list vs detail."""
        if self.action == 'list':
            return AnonymizedJudgmentListSerializer
        return AnonymizedJudgmentSerializer
    
    @action(detail=True, methods=['get'])
    def similar_cases(self, request, pk=None):
        """
        Get similar cases to this judgment.
        
        Finds other judgments with:
        - Same category
        - Similar evidence types
        - Within date range (1 year)
        
        Returns up to 5 similar cases.
        """
        judgment = self.get_object()
        
        # Find similar cases
        similar = AnonymizedJudgment.objects.filter(
            category=judgment.category,
            judgment_date__gte=judgment.judgment_date - timezone.timedelta(days=365),
            judgment_date__lte=judgment.judgment_date + timezone.timedelta(days=365)
        ).exclude(
            id=judgment.id
        )
        
        # Score by evidence overlap
        similar_with_scores = []
        for case in similar[:20]:  # Limit initial set
            # Calculate evidence overlap
            evidence_overlap = len(
                set(judgment.evidence_types) & set(case.evidence_types)
            )
            
            similar_with_scores.append({
                'case': case,
                'score': evidence_overlap
            })
        
        # Sort by score and take top 5
        similar_with_scores.sort(key=lambda x: x['score'], reverse=True)
        top_similar = [item['case'] for item in similar_with_scores[:5]]  # type: ignore
        
        serializer = AnonymizedJudgmentListSerializer(top_similar, many=True)
        
        return Response({
            'count': len(top_similar),
            'results': serializer.data,
            'explanation': {
                'ar': f"وجدنا {len(top_similar)} قضايا مشابهة في نفس الفئة ({judgment.category}) مع أدلة متشابهة",
                'en': f"Found {len(top_similar)} similar cases in {judgment.category} with overlapping evidence"
            }
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Get overall statistics for the judgment ledger.
        
        Returns:
        - Total published judgments
        - Breakdown by category
        - Breakdown by verdict
        - Consistency distribution
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'by_category': list(
                queryset.values('category')
                .annotate(count=Count('id'))
                .order_by('-count')
            ),
            'by_verdict': list(
                queryset.values('verdict')
                .annotate(count=Count('id'))
            ),
            'consistency_distribution': {
                'high': queryset.filter(consistency_score__gte=80).count(),
                'medium': queryset.filter(consistency_score__gte=60, consistency_score__lt=80).count(),
                'low': queryset.filter(consistency_score__lt=60).count(),
            }
        }
        
        return Response(stats)


@method_decorator(cache_page(60 * 5), name='list')  # 5 minutes
@method_decorator(cache_page(60 * 5), name='retrieve')  # 5 minutes
@method_decorator(cache_page(60 * 5), name='dashboard')  # 5 minutes
class PublicMetricsViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public Metrics API.
    
    READ-ONLY access to aggregate metrics with mandatory context.
    
    Sovereign Safeguard #2: Every metric MUST have context card.
    """
    permission_classes = [AllowAny]
    serializer_class = PublicMetricsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['metric_type', 'category']
    ordering_fields = ['period_start', 'computed_at']
    ordering = ['-period_start']
    throttle_classes = [PublicMetricsThrottle]  # Rate limiting: 100/hour
    
    def get_queryset(self):
        """
        Return latest metrics with context cards.
        """
        return PublicMetrics.objects.select_related('context_card').all()
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get dashboard summary with all latest metrics.
        
        Returns:
        - Verdict balance
        - Consistency distribution
        - Category breakdown
        - Evidence patterns
        
        All with MANDATORY context cards.
        """
        # Get latest metrics (most recent period)
        latest_period = PublicMetrics.objects.order_by('-period_start').first()
        
        if not latest_period:
            return Response({
                'count': 0,
                'results': [],
                'message': 'No metrics available yet. Run compute_public_metrics command.',
                'metrics': {}
            })
        
        period_start = latest_period.period_start
        period_end = latest_period.period_end
        
        # Fetch all metrics for this period
        metrics = PublicMetrics.objects.filter(
            period_start=period_start,
            period_end=period_end
        ).select_related('context_card')
        
        # Organize by type
        dashboard_data = {
            'period': {
                'start': period_start,
                'end': period_end
            },
            'metrics': {},
            'disclaimer': (
                'These metrics are privacy-preserving aggregates. '
                'Individual case data is anonymized. '
                'All metrics include mandatory context cards to prevent misinterpretation.'
            )
        }
        
        # Explicit type hinting to satisfy Pyre and safely populate the dict
        metrics_dict: dict = {}
        
        for metric in metrics:
            serializer = self.get_serializer(metric)
            metrics_dict[metric.metric_type] = serializer.data
            
        dashboard_data['metrics'] = metrics_dict
        
        return Response(dashboard_data)
