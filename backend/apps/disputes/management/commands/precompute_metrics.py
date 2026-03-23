"""
Management command to precompute and cache all public metrics

Usage:
    python manage.py precompute_metrics

This should be run:
- Daily via cron job
- After any bulk data import
- Whenever metrics need to be refreshed
"""

from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from apps.disputes.models import PublicMetrics, AnonymizedJudgment
from apps.products.models import Category
import json


class Command(BaseCommand):
    help = 'Precompute and cache all public dashboard metrics'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force recompute even if cache is warm',
        )

    def handle(self, *args, **options):
        force = options['force']
        
        self.stdout.write(self.style.WARNING('[Precompute Metrics] Starting...'))
        
        # 1. Cache Public Metrics Dashboard
        self.stdout.write('[1/4] Caching Public Metrics Dashboard...')
        self._cache_metrics_dashboard(force)
        
        # 2. Cache Precedent Searches (Most Common Categories)
        self.stdout.write('[2/4] Caching Precedent Searches...')
        self._cache_precedent_searches(force)
        
        # 3. Cache Expectation UI by Category
        self.stdout.write('[3/4] Caching Expectation UI by Category...')
        self._cache_expectations_by_category(force)
        
        # 4. Cache Public Judgment Ledger (Latest 100)
        self.stdout.write('[4/4] Caching Public Judgment Ledger...')
        self._cache_judgment_ledger(force)
        
        self.stdout.write(self.style.SUCCESS('\n✅ All metrics precomputed and cached!'))
        
    def _cache_metrics_dashboard(self, force):
        """Cache the dashboard endpoint data"""
        cache_key = 'public_metrics:dashboard'
        
        if not force and cache.get(cache_key):
            self.stdout.write(self.style.WARNING('   ⏭ Skipped (cache warm)'))
            return
        
        # Get latest period
        latest_period = PublicMetrics.objects.order_by('-period_start').first()
        
        if not latest_period:
            self.stdout.write(self.style.ERROR('   ❌ No metrics found. Run compute_public_metrics first.'))
            return
        
        # Fetch all metrics for this period
        metrics = PublicMetrics.objects.filter(
            period_start=latest_period.period_start,
            period_end=latest_period.period_end
        ).select_related('context_card')
        
        # Build dashboard data
        dashboard_data = {
            'period': {
                'start': str(latest_period.period_start),
                'end': str(latest_period.period_end)
            },
            'metrics': {},
            'computed_at': timezone.now().isoformat()
        }
        
        for metric in metrics:
            dashboard_data['metrics'][metric.metric_type] = {
                'value': metric.metric_data,
                'context': metric.context_card.card_data if metric.context_card else None
            }
        
        # Cache for 5 minutes (same as decorator)
        cache.set(cache_key, dashboard_data, 60 * 5)
        self.stdout.write(self.style.SUCCESS(f'   ✅ Cached {len(metrics)} metrics'))
        
    def _cache_precedent_searches(self, force):
        """Pre-cache searches for top categories"""
        from apps.disputes.precedent_search_service import PrecedentSearchService
        from apps.disputes.models import Judgment
        
        # Get recent judgments by category (top 5 categories)
        recent_judgments = Judgment.objects.filter(
            status='final',
            finalized_at__gte=timezone.now() - timedelta(days=180)
        ).select_related('dispute__booking__product__category')[:20]
        
        cached_count = 0
        for judgment in recent_judgments:
            cache_key = f'precedent_search:{judgment.id}'
            
            if not force and cache.get(cache_key):
                continue
            
            try:
                # Compute similar cases
                similar_cases = PrecedentSearchService.find_similar_cases(
                    judgment, 
                    time_window_days=180,
                    top_k=5
                )
                
                # Cache for 1 hour
                cache.set(cache_key, similar_cases, 60 * 60)
                cached_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠ Failed for judgment {judgment.id}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'   ✅ Cached {cached_count} precedent searches'))
        
    def _cache_expectations_by_category(self, force):
        """Cache expectations for each category"""
        from apps.disputes.expectation_setter import ExpectationSetter
        from apps.products.models import Product
        
        # Get one product per category (for caching expectations)
        categories = Category.objects.all()
        cached_count = 0
        
        for category in categories:
            product = Product.objects.filter(category=category).first()
            if not product:
                continue
            
            cache_key = f'expectations:category:{category.id}'
            
            if not force and cache.get(cache_key):
                continue
            
            try:
                expectations = ExpectationSetter.get_booking_expectations(product)
                # Cache for 10 minutes (same as decorator)
                cache.set(cache_key, expectations, 60 * 10)
                cached_count += 1
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠ Failed for category {category.name}: {e}'))
        
        self.stdout.write(self.style.SUCCESS(f'   ✅ Cached expectations for {cached_count} categories'))
        
    def _cache_judgment_ledger(self, force):
        """Cache the latest 100 anonymizedجment entries"""
        cache_key = 'public_judgment_ledger:latest'
        
        if not force and cache.get(cache_key):
            self.stdout.write(self.style.WARNING('   ⏭ Skipped (cache warm)'))
            return
        
        # Get latest 100 anonymized judgments
        ledger_entries = AnonymizedJudgment.objects.select_related(
            'original_judgment__dispute'
        ).order_by('-anonymized_at')[:100]
        
        ledger_data = []
        for entry in ledger_entries:
            ledger_data.append({
                'id': entry.id,
                'verdict': entry.verdict_summary,
                'category': entry.category,
                'anonymized_at': entry.anonymized_at.isoformat(),
                'ruling_text': entry.anonymized_ruling_text
            })
        
        # Cache for 5 minutes
        cache.set(cache_key, ledger_data, 60 * 5)
        self.stdout.write(self.style.SUCCESS(f'   ✅ Cached {len(ledger_entries)} ledger entries'))
