"""
Verification Test for Phase 23, Step 3: Transparency Dashboard

Tests:
1. Metrics aggregation computes all metrics
2. Context cards are MANDATORY for all metrics
3. Dashboard endpoint returns all metrics
4. Metrics can be filtered by type
5. Cron command works
"""
import os
import sys
import django
from datetime import timedelta

# Django setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.core.management import call_command
from rest_framework.test import APIClient

from apps.disputes.models import AnonymizedJudgment, PublicMetrics, MetricContextCard
from apps.disputes.metrics_aggregator import MetricsAggregator

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
RESET = '\033[0m'

def log(message, level="INFO", color=""):
    prefix = f"[PHASE 23 - STEP 3]"
    if color:
        print(f"{color}{prefix} {message} {level}{RESET}")
    else:
        print(f"{prefix} {message} {level}")

def main():
    log("=" * 60, "", CYAN)
    log("VERIFICATION: Transparency Dashboard", "", CYAN)
    log("=" * 60, "", CYAN)
    
    #=========================================================================
    # SETUP
    #=========================================================================
    log("Setting up test data...", "ACTION", YELLOW)
    
    # Clean existing metrics
    PublicMetrics.objects.all().delete()
    
    # Create test anonymized judgments (reuse from Step 2)
    AnonymizedJudgment.objects.all().delete()
    
    for i in range(10):
        categories = ['Electronics', 'Electronics', 'Furniture', 'Electronics', 'Vehicles', 
                     'Electronics', 'Furniture', 'Electronics', 'Vehicles', 'Electronics']
        verdicts = ['favor_owner', 'favor_renter', 'favor_owner', 'favor_owner', 'partial',
                   'favor_owner', 'favor_renter', 'favor_owner', 'favor_owner', 'favor_renter']
        consistency_scores = [85, 45, 75, 90, 60, 82, 55, 88, 70, 65]
        
        AnonymizedJudgment.objects.create(
            judgment_hash=f"dashboard_test_{i}",
            category=categories[i],
            dispute_type=f"Test dispute {i}",
            ruling_summary=f"Test ruling summary {i}",
            verdict=verdicts[i],
            awarded_ratio=None,
            evidence_types=['photo', 'contract'] if i % 2 == 0 else ['contract'],
            consistency_score=consistency_scores[i],
            similar_cases_count=3,
            judgment_date=(timezone.now() - timedelta(days=i)).date().replace(day=1),
            geographic_region=None,
            uniqueness_score=30,
            publication_delayed_until=None,
            published_at=timezone.now()
        )
    
    log(f"✓ Created 10 test judgments", "SUCCESS", GREEN)
    
    tests_passed = 0
    tests_total = 0
    
    #=========================================================================
    # TEST 1: Metrics aggregation computes all metrics
    #=========================================================================
    log("TEST 1: Running metrics aggregation...", "ACTION", YELLOW)
    
    try:
        count = MetricsAggregator.compute_all_metrics(period_days=30)
        
        checks = [
            (count == 4, f"4 metrics computed: {count}/4"),
        ]
        
        for passed, description in checks:
            if passed:
                log(f"  ✓ {description}", "", GREEN)
                tests_passed += 1
            else:
                log(f"  ✗ {description}", "FAIL", RED)
        
        tests_total += len(checks)
    except Exception as e:
        log(f"  ✗ Aggregation failed: {str(e)}", "FAIL", RED)
        tests_total += 1
    
    #=========================================================================
    # TEST 2: Every metric has a context card
    #=========================================================================
    log("TEST 2: Verifying mandatory context cards...", "ACTION", YELLOW)
    
    metrics = PublicMetrics.objects.all()
    metrics_without_context = 0
    
    for metric in metrics:
        if not hasattr(metric, 'context_card') or not metric.context_card:
            metrics_without_context += 1
            log(f"  ⚠️  Metric {metric.metric_type} missing context card", "WARNING", YELLOW)
    
    checks = [
        (metrics_without_context == 0, f"All metrics have context cards: {metrics_without_context}/{ metrics.count()} missing"),
    ]
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 3: Dashboard endpoint returns all metrics
    #=========================================================================
    log("TEST 3: Testing dashboard endpoint...", "ACTION", YELLOW)
    
    client = APIClient()
    response = client.get('/api/disputes/public/metrics/dashboard/')
    
    checks = [
        (response.status_code == 200, f"Dashboard endpoint: {response.status_code}"),
    ]
    
    if response.status_code == 200:
        data = response.json()
        checks.extend([
            ('period' in data, "Has period info"),
            ('metrics' in data, "Has metrics"),
            (len(data.get('metrics', {})) == 4, f"All 4 metrics present: {len(data.get('metrics', {}))}"),
        ])
        
        # Check context cards in response
        metrics_with_context = 0
        for metric_type, metric_data in data.get('metrics', {}).items():
            if 'context_card' in metric_data and metric_data['context_card']:
                metrics_with_context += 1
        
        checks.append((
            metrics_with_context == 4,
            f"All metrics have context in response: {metrics_with_context}/4"
        ))
    
    for passed, description in checks:
        if passed:
            log(f"  ✓ {description}", "", GREEN)
            tests_passed += 1
        else:
            log(f"  ✗ {description}", "FAIL", RED)
    
    tests_total += len(checks)
    
    #=========================================================================
    # TEST 4: Individual metric types accessible
    #=========================================================================
    log("TEST 4: Testing metric filtering...", "ACTION", YELLOW)
    
    metric_types_to_test = ['verdict_balance', 'consistency_distribution', 'category_breakdown', 'evidence_patterns']
    
    for metric_type in metric_types_to_test:
        response = client.get(f'/api/disputes/public/metrics/?metric_type={metric_type}')
        
        if response.status_code == 200:
            data = response.json()
            results = data if isinstance(data, list) else data.get('results', [])
            
            if len(results) > 0:
                log(f"  ✓ {metric_type} accessible", "", GREEN)
                tests_passed += 1
            else:
                log(f"  ✗ {metric_type} not found", "FAIL", RED)
        else:
            log(f"  ✗ {metric_type} request failed: {response.status_code}", "FAIL", RED)
    
    tests_total += len(metric_types_to_test)
    
    #=========================================================================
    # TEST 5: Management command works
    #=========================================================================
    log("TEST 5: Testing management command...", "ACTION", YELLOW)
    
    # Clear metrics
    PublicMetrics.objects.all().delete()
    
    try:
        # Run command
        call_command('compute_public_metrics', '--days=30')
        
        # Check metrics were created
        metrics_count = PublicMetrics.objects.count()
        
        checks = [
            (metrics_count == 4, f"Command created metrics: {metrics_count}/4"),
        ]
        
        for passed, description in checks:
            if passed:
                log(f"  ✓ {description}", "", GREEN)
                tests_passed += 1
            else:
                log(f"  ✗ {description}", "FAIL", RED)
        
        tests_total += len(checks)
    except Exception as e:
        log(f"  ✗ Command failed: {str(e)}", "FAIL", RED)
        tests_total += 1
    
    #=========================================================================
    # SUMMARY
    #=========================================================================
    log("=" * 60, "", CYAN)
    log(f"DASHBOARD VERIFICATION: {tests_passed}/{tests_total} PASSED", "", CYAN)
    log("=" * 60, "", CYAN)
    
    if tests_passed == tests_total:
        log("=" * 60, "", GREEN)
        log("🎉 ALL TESTS PASSED - Dashboard Service VERIFIED", "", GREEN)
        log("=" * 60, "", GREEN)
    else:
        log("=" * 60, "", RED)
        log(f"⚠️  {tests_total - tests_passed} TESTS FAILED", "FAIL", RED)
        log("=" * 60, "", RED)

if __name__ == '__main__':
    main()
