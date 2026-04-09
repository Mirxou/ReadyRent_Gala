"""
Django management command to compute public metrics.

Usage:
    python manage.py compute_public_metrics [--days=30]
    
Add to crontab for daily execution:
    0 2 * * * cd /path/to/backend && python manage.py compute_public_metrics
"""
from django.core.management.base import BaseCommand

from ...metrics_aggregator import MetricsAggregator


class Command(BaseCommand):
    help = 'Compute public transparency metrics (run daily via cron)'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to include in metrics period (default: 30)'
        )
    
    def handle(self, *args, **options):
        days = options['days']
        
        self.stdout.write(f"Computing public metrics for the last {days} days...")
        
        try:
            count = MetricsAggregator.compute_all_metrics(period_days=days)
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'✓ Successfully computed {count} metrics'
                )
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(
                    f'✗ Failed to compute metrics: {str(e)}'
                )
            )
            raise
