"""
Metrics Aggregation Service for Phase 23: Public Transparency Dashboard

Sovereign Safeguard #2: EVERY metric MUST have a context card.
Never show raw numbers without explanation.
"""
from datetime import timedelta
from decimal import Decimal
from typing import Dict, List, Optional

from django.db.models import Count, Avg, Q, F
from django.utils import timezone

from apps.disputes.models import (
    AnonymizedJudgment,
    PublicMetrics,
    MetricContextCard
)


class MetricsAggregator:
    """
    Aggregate judgment data into public metrics.
    
    Sovereign Principle: Context First, Numbers Second.
    """
    
    @staticmethod
    def compute_all_metrics(period_days: int = 30):
        """
        Compute all public metrics for the specified period.
        
        This should be run daily via cron job.
        """
        period_end = timezone.now().date()
        period_start = period_end - timedelta(days=period_days)
        
        # Get published judgments only
        judgments = AnonymizedJudgment.objects.filter(
            judgment_date__gte=period_start,
            judgment_date__lte=period_end,
            published_at__isnull=False
        ).exclude(
            publication_delayed_until__gt=timezone.now().date()
        )
        
        # Compute each metric
        MetricsAggregator.compute_verdict_balance(judgments, period_start, period_end)
        MetricsAggregator.compute_consistency_distribution(judgments, period_start, period_end)
        MetricsAggregator.compute_category_breakdown(judgments, period_start, period_end)
        MetricsAggregator.compute_evidence_patterns(judgments, period_start, period_end)
        
        return PublicMetrics.objects.filter(
            period_start=period_start,
            period_end=period_end
        ).count()
    
    @staticmethod
    def compute_verdict_balance(queryset, period_start, period_end):
        """
        Compute verdict distribution (owner vs renter vs partial).
        
        Sovereign Safeguard: Include context explaining that balance != bias.
        """
        verdict_counts = queryset.values('verdict').annotate(
            count=Count('id')
        )
        
        total = queryset.count()
        
        verdict_data = {}
        for item in verdict_counts:
            verdict = item['verdict']
            count = item['count']
            verdict_data[verdict] = {
                'count': count,
                'percentage': round((count / total * 100), 1) if total > 0 else 0
            }
        
        # Create or update metric
        metric, created = PublicMetrics.objects.update_or_create(
            metric_type='verdict_balance',
            category=None,
            period_start=period_start,
            period_end=period_end,
            defaults={
                'value_numeric': total,
                'value_json': verdict_data,
                'computed_at': timezone.now()
            }
        )
        
        # MANDATORY: Create context card
        if created or not hasattr(metric, 'context_card'):
            MetricContextCard.objects.update_or_create(
                metric=metric,
                defaults={
                    'context_explanation': """
                    **What هذا الرقم يعني:**
                    This shows the distribution of verdicts across all published judgments.
                    
                    **Important Context:**
                    - A "balanced" 50/50 split does NOT mean the system is fair
                    - The system judges based on EVIDENCE, not quotas
                    - If owners submit stronger evidence, more verdicts favor them (and vice versa)
                    """,
                    'counter_narrative': """
                    **Common Misinterpretation:**
                    "60% favor owners → System is biased!"
                    
                    **Reality:**
                    The system doesn't "favor" anyone. It analyzes evidence objectively.
                    If 60% of cases have strong owner evidence, 60% will favor owners.
                    
                    **الواقع:**
                    النظام لا ينحاز لأحد. يحلل الأدلة بموضوعية.
                    """,
                    'sample_scenarios': """
                    **Scenario 1 (High Owner Verdicts):**
                    - 70% favor owner
                    - Possible reason: Damage disputes where renters didn't document condition
                    
                    **Scenario 2 (High Renter Verdicts):**
                    - 65% favor renter
                    - Possible reason: Non-delivery disputes with receipt evidence
                    
                    **Scenario 3 (Balanced):**
                    - 45/45/10 split
                    - Indicates diverse dispute types with varied evidence quality
                    """
                }
            )
        
        return metric
    
    @staticmethod
    def compute_consistency_distribution(queryset, period_start, period_end):
        """
        Compute distribution of consistency scores.
        
        Shows how predictable/consistent the AI judgment system is.
        """
        # Count by consistency bands
        high = queryset.filter(consistency_score__gte=80).count()
        medium = queryset.filter(consistency_score__gte=60, consistency_score__lt=80).count()
        low = queryset.filter(consistency_score__lt=60).count()
        total = queryset.count()
        
        avg_score = queryset.aggregate(avg=Avg('consistency_score'))['avg'] or 0
        
        distribution_data = {
            'high': {'count': high, 'percentage': round((high / total * 100), 1) if total > 0 else 0},
            'medium': {'count': medium, 'percentage': round((medium / total * 100), 1) if total > 0 else 0},
            'low': {'count': low, 'percentage': round((low / total * 100), 1) if total > 0 else 0},
            'average_score': round(avg_score, 1)
        }
        
        metric, created = PublicMetrics.objects.update_or_create(
            metric_type='consistency_distribution',
            category=None,
            period_start=period_start,
            period_end=period_end,
            defaults={
                'value_numeric': avg_score,
                'value_json': distribution_data,
                'computed_at': timezone.now()
            }
        )
        
        # MANDATORY: Context card
        if created or not hasattr(metric, 'context_card'):
            MetricContextCard.objects.update_or_create(
                metric=metric,
                defaults={
                    'context_explanation': """
                    **ما هو نقاط الاتساق:**
                    Consistency score measures how similar a judgment is to past comparable cases.
                    
                    **HIGH (80+):** Similar to most past cases → Predictable
                    **MEDIUM (60-79):** Some unique factors → Semi-predictable
                    **LOW (<60):** Unusual circumstances → Less predictable
                    """,
                    'counter_narrative': """
                    **Misinterpretation:**
                    "Low consistency = bad system"
                    
                    **Reality:**
                    Low consistency can mean:
                    1. New type of dispute (good! = innovation)
                    2. Unique circumstances require different approach
                    3. System is adapting to edge cases
                    
                    80%+ consistency is GOOD for trust, but 100% would be rigid.
                    """,
                    'sample_scenarios': """
                    **High Consistency (85%):**
                    - Camera damage dispute
                    - Similar to 50+ past camera cases
                    - Predictable outcome based on evidence type
                    
                    **Low Consistency (45%):**
                    - New product category (drone rental)
                    - No similar cases in history
                    - System creating new precedent
                    """
                }
            )
        
        return metric
    
    @staticmethod
    def compute_category_breakdown(queryset, period_start, period_end):
        """
        Compute judgment distribution by category.
        """
        category_data = queryset.values('category').annotate(
            count=Count('id'),
            avg_consistency=Avg('consistency_score')
        ).order_by('-count')[:10]  # Top 10 categories
        
        total = queryset.count()
        
        breakdown = []
        for item in category_data:
            breakdown.append({
                'category': item['category'],
                'count': item['count'],
                'percentage': round((item['count'] / total * 100), 1) if total > 0 else 0,
                'avg_consistency': round(item['avg_consistency'], 1) if item['avg_consistency'] else 0
            })
        
        metric, created = PublicMetrics.objects.update_or_create(
            metric_type='category_breakdown',
            category=None,
            period_start=period_start,
            period_end=period_end,
            defaults={
                'value_numeric': len(breakdown),
                'value_json': {'categories': breakdown},
                'computed_at': timezone.now()
            }
        )
        
        # MANDATORY: Context card
        if created or not hasattr(metric, 'context_card'):
            MetricContextCard.objects.update_or_create(
                metric=metric,
                defaults={
                    'context_explanation': """
                    **توزيع الفئات:**
                    Shows which product categories have the most disputes.
                    
                    **Why this matters:**
                    - High-dispute categories may need better upfront policies
                    - Low-dispute categories indicate good current policies
                    """,
                    'counter_narrative': """
                    **Misinterpretation:**
                    "Electronics has 40% of disputes → Electronics is risky"
                    
                    **Reality:**
                    Electronics might also be:
                    - 60% of total rentals (proportional)
                    - Higher value → More documentation
                    - More complex → More edge cases
                    
                    High disputes ≠ High risk necessarily.
                    """,
                    'sample_scenarios': """
                    **Electronics (40% of all disputes):**
                    - Most rented category
                    - Damage is easy to document (photos)
                    - Clear evidence = clear rulings
                    
                    **Furniture (10% of disputes):**
                    - Less rented overall
                    - Wear-and-tear harder to prove
                    - Fewer edge cases
                    """
                }
            )
        
        return metric
    
    @staticmethod
    def compute_evidence_patterns(queryset, period_start, period_end):
        """
        Compute which evidence types are most common.
        """
        # Flatten evidence_types (JSON array field)
        evidence_counts = {}
        
        for judgment in queryset:
            for evidence_type in judgment.evidence_types:
                evidence_counts[evidence_type] = evidence_counts.get(evidence_type, 0) + 1
        
        total_judgments = queryset.count()
        
        evidence_data = []
        for evidence_type, count in sorted(evidence_counts.items(), key=lambda x: x[1], reverse=True):
            evidence_data.append({
                'type': evidence_type,
                'count': count,
                'percentage': round((count / total_judgments * 100), 1) if total_judgments > 0 else 0
            })
        
        metric, created = PublicMetrics.objects.update_or_create(
            metric_type='evidence_patterns',
            category=None,
            period_start=period_start,
            period_end=period_end,
            defaults={
                'value_numeric': len(evidence_data),
                'value_json': {'evidence_types': evidence_data},
                'computed_at': timezone.now()
            }
        )
        
        # MANDATORY: Context card
        if created or not hasattr(metric, 'context_card'):
            MetricContextCard.objects.update_or_create(
                metric=metric,
                defaults={
                    'context_explanation': """
                    **أنواع الأدلة الأكثر شيوعًا:**
                    Shows which types of evidence appear most in resolved disputes.
                    
                    **Insight for Users:**
                    If 80% of judgments include photos, you should document with photos too.
                    """,
                    'counter_narrative': """
                    **Misinterpretation:**
                    "90% have photos → Photos guarantee win"
                    
                    **Reality:**
                    Photos are COMMON, not DECISIVE.
                    - Bad photos don't help
                    - Good contract can beat bad photo
                    - Evidence QUALITY matters more than TYPE
                    """,
                    'sample_scenarios': """
                    **Photo Evidence (80%):**
                    - Damage claims
                    - Condition documentation
                    - Visual proof
                    
                    **Contract Evidence (65%):**
                    - Terms disputes
                    - Policy clarification
                    - Written agreements
                    
                    **Witness Evidence (15%):**
                    - Third-party confirmation
                    - Less common but high-impact
                    """
                }
            )
        
        return metric
