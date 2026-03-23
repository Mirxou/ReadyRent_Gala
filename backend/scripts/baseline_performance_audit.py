"""
Phase 24, Step 1: Baseline Performance Audit

Profiles current system performance to establish baseline metrics:
1. Critical API endpoint latencies (P50, P95, P99)
2. Database query performance
3. Vector search performance
4. EvidenceLog write performance
5. Bottleneck identification

Run this BEFORE any optimizations to establish the baseline.
"""
import os
import sys
import django
import time
import statistics
from datetime import datetime, timedelta
from decimal import Decimal
import json

# Django setup
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from django.contrib.auth import get_user_model
from django.db import connection
from django.test.utils import override_settings
from rest_framework.test import APIClient

from apps.disputes.models import (
    Dispute, Judgment, AnonymizedJudgment, EvidenceLog,
    JudgmentEmbedding
)
from apps.products.models import Product
from apps.bookings.models import Booking

User = get_user_model()

# Color codes
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
CYAN = '\033[96m'
BLUE = '\033[94m'
MAGENTA = '\033[95m'
RESET = '\033[0m'

def log(message, level="INFO", color=""):
    prefix = f"[PHASE 24 - BASELINE]"
    if color:
        print(f"{color}{prefix} {message}{RESET}")
    else:
        print(f"{prefix} {message}")

def percentile(data, p):
    """Calculate percentile of data"""
    if not data:
        return 0
    sorted_data = sorted(data)
    index = (len(sorted_data) - 1) * p / 100
    lower = int(index)
    upper = lower + 1
    if upper >= len(sorted_data):
        return sorted_data[lower]
    weight = index - lower
    return sorted_data[lower] * (1 - weight) + sorted_data[upper] * weight

def measure_endpoint(client, url, iterations=10, method='GET', data=None):
    """Measure endpoint performance"""
    latencies = []
    
    for i in range(iterations):
        start = time.time()
        if method == 'GET':
            response = client.get(url)
        elif method == 'POST':
            response = client.post(url, data=data, format='json')
        end = time.time()
        
        latency_ms = (end - start) * 1000
        latencies.append(latency_ms)
        
        # Brief pause between requests
        time.sleep(0.1)
    
    return {
        'url': url,
        'iterations': iterations,
        'p50': percentile(latencies, 50),
        'p95': percentile(latencies, 95),
        'p99': percentile(latencies, 99),
        'min': min(latencies),
        'max': max(latencies),
        'mean': statistics.mean(latencies),
        'median': statistics.median(latencies)
    }

def measure_db_queries():
    """Measure common database query performance"""
    log("", "", "")
    log("=" * 80, "", CYAN)
    log("DATABASE QUERY PERFORMANCE", "", CYAN)
    log("=" * 80, "", CYAN)
    
    query_results = []
    
    # Test 1: Count disputes
    log("Query 1: Count all disputes...", "", YELLOW)
    start = time.time()
    count = Dispute.objects.count()
    duration = (time.time() - start) * 1000
    log(f"  Result: {count} disputes in {duration:.2f}ms", "", GREEN if duration < 100 else YELLOW)
    query_results.append({'query': 'Dispute.count()', 'duration_ms': duration})
    
    # Test 2: Recent judgments with relationships
    log("Query 2: Recent 10 judgments with relationships...", "", YELLOW)
    start = time.time()
    judgments = list(Judgment.objects.select_related('dispute').order_by('-created_at')[:10])
    duration = (time.time() - start) * 1000
    log(f"  Result: {len(judgments)} judgments in {duration:.2f}ms", "", GREEN if duration < 200 else YELLOW)
    query_results.append({'query': 'Judgment with select_related', 'duration_ms': duration})
    
    # Test 3: EvidenceLog count
    log("Query 3: Count evidence logs...", "", YELLOW)
    start = time.time()
    evidence_count = EvidenceLog.objects.count()
    duration = (time.time() - start) * 1000
    log(f"  Result: {evidence_count} evidence logs in {duration:.2f}ms", "", GREEN if duration < 100 else YELLOW)
    query_results.append({'query': 'EvidenceLog.count()', 'duration_ms': duration})
    
    # Test 4: Anonymized judgments for public ledger
    log("Query 4: Public ledger query (20 anonymized judgments)...", "", YELLOW)
    start = time.time()
    anon_judgments = list(AnonymizedJudgment.objects.order_by('-published_at')[:20])
    duration = (time.time() - start) * 1000
    log(f"  Result: {len(anon_judgments)} judgments in {duration:.2f}ms", "", GREEN if duration < 300 else YELLOW)
    query_results.append({'query': 'AnonymizedJudgment public ledger', 'duration_ms': duration})
    
    # Test 5: Check for N+1 queries in SQL log
    log("Query 5: Checking query count for complex operation...", "", YELLOW)
    from django.db import reset_queries
    reset_queries()
    
    # Simulate common access pattern
    disputes = Dispute.objects.select_related('user', 'booking').prefetch_related('judgments')[:10]
    for dispute in disputes:
        _ = dispute.user.email
        _ = list(dispute.judgments.all())
    
    query_count = len(connection.queries)
    log(f"  Result: {query_count} queries executed", "", GREEN if query_count < 15 else RED)
    query_results.append({'query': 'Complex prefetch pattern', 'query_count': query_count})
    
    return query_results

def measure_api_endpoints():
    """Measure critical API endpoint performance"""
    log("", "", "")
    log("=" * 80, "", CYAN)
    log("API ENDPOINT PERFORMANCE", "", CYAN)
    log("=" * 80, "", CYAN)
    
    client = APIClient()
    endpoints_results = []
    
    # Critical endpoints to measure
    endpoints = [
        {'url': '/api/disputes/public/judgments/', 'name': 'Public Judgment Ledger'},
        {'url': '/api/disputes/public/metrics/dashboard/', 'name': 'Metrics Dashboard'},
        {'url': '/api/products/', 'name': 'Product List'},
    ]
    
    for endpoint_info in endpoints:
        log(f"Testing: {endpoint_info['name']}...", "", YELLOW)
        try:
            result = measure_endpoint(client, endpoint_info['url'], iterations=5)
            endpoints_results.append({
                'name': endpoint_info['name'],
                **result
            })
            
            log(f"  P50: {result['p50']:.2f}ms | P95: {result['p95']:.2f}ms | P99: {result['p99']:.2f}ms", "",
                GREEN if result['p95'] < 1000 else YELLOW if result['p95'] < 2000 else RED)
        except Exception as e:
            log(f"  ERROR: {str(e)[:100]}", "", RED)
            endpoints_results.append({
                'name': endpoint_info['name'],
                'error': str(e)
            })
    
    return endpoints_results

def measure_vector_search():
    """Measure vector similarity search performance"""
    log("", "", "")
    log("=" * 80, "", CYAN)
    log("VECTOR SEARCH PERFORMANCE (pgvector)", "", CYAN)
    log("=" * 80, "", CYAN)
    
    embedding_count = JudgmentEmbedding.objects.count()
    log(f"Total embeddings in database: {embedding_count}", "", CYAN)
    
    if embedding_count == 0:
        log("  No embeddings found - skipping vector search test", "", YELLOW)
        return None
    
    # Get a sample embedding
    sample = JudgmentEmbedding.objects.first()
    if not sample or not sample.embedding:
        log("  No valid embedding found - skipping", "", YELLOW)
        return None
    
    log("Testing vector similarity search...", "", YELLOW)
    
    # Measure similarity search
    start = time.time()
    try:
        # This assumes pgvector is set up - may need adjustment
        from django.db.models import F
        similar = JudgmentEmbedding.objects.annotate(
            distance=F('embedding')  # Simplified - actual distance calculation depends on pgvector setup
        ).order_by('distance')[:10]
        
        results = list(similar)
        duration = (time.time() - start) * 1000
        
        log(f"  Found {len(results)} similar judgments in {duration:.2f}ms", "",
            GREEN if duration < 2000 else YELLOW if duration < 5000 else RED)
        
        return {
            'total_embeddings': embedding_count,
            'search_duration_ms': duration,
            'results_count': len(results)
        }
    except Exception as e:
        log(f"  ERROR: {str(e)}", "", RED)
        return {
            'total_embeddings': embedding_count,
            'error': str(e)
        }

def identify_bottlenecks(api_results, db_results, vector_results):
    """Identify performance bottlenecks"""
    log("", "", "")
    log("=" * 80, "", CYAN)
    log("BOTTLENECK IDENTIFICATION", "", CYAN)
    log("=" * 80, "", CYAN)
    
    bottlenecks = []
    
    # Check API endpoints
    for endpoint in api_results:
        if 'p95' in endpoint and endpoint['p95'] > 1000:
            bottlenecks.append({
                'type': 'API Endpoint',
                'location': endpoint['name'],
                'issue': f"P95 latency {endpoint['p95']:.0f}ms exceeds 1s target",
                'severity': 'HIGH' if endpoint['p95'] > 2000 else 'MEDIUM'
            })
    
    # Check DB queries
    for query in db_results:
        if 'duration_ms' in query and query['duration_ms'] > 500:
            bottlenecks.append({
                'type': 'Database Query',
                'location': query['query'],
                'issue': f"Query took {query['duration_ms']:.0f}ms",
                'severity': 'HIGH' if query['duration_ms'] > 1000 else 'MEDIUM'
            })
        if 'query_count' in query and query['query_count'] > 20:
            bottlenecks.append({
                'type': 'N+1 Query',
                'location': query['query'],
                'issue': f"{query['query_count']} queries executed (possible N+1)",
                'severity': 'HIGH'
            })
    
    # Check vector search
    if vector_results and 'search_duration_ms' in vector_results:
        if vector_results['search_duration_ms'] > 5000:
            bottlenecks.append({
                'type': 'Vector Search',
                'location': 'pgvector similarity',
                'issue': f"Search took {vector_results['search_duration_ms']:.0f}ms",
                'severity': 'HIGH'
            })
    
    # Display bottlenecks
    if bottlenecks:
        log(f"Found {len(bottlenecks)} potential bottlenecks:", "", YELLOW)
        for i, bottleneck in enumerate(bottlenecks, 1):
            color = RED if bottleneck['severity'] == 'HIGH' else YELLOW
            log(f"\n  {i}. [{bottleneck['severity']}] {bottleneck['type']}", "", color)
            log(f"     Location: {bottleneck['location']}", "", color)
            log(f"     Issue: {bottleneck['issue']}", "", color)
    else:
        log("No major bottlenecks detected! 🎉", "", GREEN)
    
    return bottlenecks

def generate_report(api_results, db_results, vector_results, bottlenecks):
    """Generate baseline performance report"""
    report = {
        'timestamp': datetime.now().isoformat(),
        'summary': {
            'api_endpoints_tested': len([r for r in api_results if 'p95' in r]),
            'db_queries_tested': len(db_results),
            'vector_search_tested': vector_results is not None,
            'bottlenecks_found': len(bottlenecks)
        },
        'api_endpoints': api_results,
        'database_queries': db_results,
        'vector_search': vector_results,
        'bottlenecks': bottlenecks,
        'targets': {
            'public_ledger_p95': '< 800ms',
            'metrics_dashboard_p95': '< 1s',
            'precedent_search_p95': '< 2s',
            'dispute_creation_p95': '< 2s',
            'judgment_finalization': '< 5s'
        }
    }
    
    # Save to file
    report_path = os.path.join(
        os.path.dirname(__file__),
        f'baseline_performance_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
    )
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2, default=str)
    
    log("", "", "")
    log(f"Report saved to: {report_path}", "", GREEN)
    
    return report, report_path

def main():
    log("=" * 80, "", MAGENTA)
    log("BASELINE PERFORMANCE AUDIT - Phase 24 Step 1", "", MAGENTA)
    log("=" * 80, "", MAGENTA)
    log("", "", "")
    log("This audit establishes performance baseline BEFORE optimizations.", "", CYAN)
    log("Measuring: API latencies, DB queries, vector search, bottlenecks", "", CYAN)
    
    try:
        # Measure components
        db_results = measure_db_queries()
        api_results = measure_api_endpoints()
        vector_results = measure_vector_search()
        bottlenecks = identify_bottlenecks(api_results, db_results, vector_results)
        report, report_path = generate_report(api_results, db_results, vector_results, bottlenecks)
        
        # Final summary
        log("", "", "")
        log("=" * 80, "", MAGENTA)
        log("BASELINE AUDIT COMPLETE", "", MAGENTA)
        log("=" * 80, "", MAGENTA)
        log(f"API Endpoints Tested: {report['summary']['api_endpoints_tested']}", "", CYAN)
        log(f"DB Queries Analyzed: {report['summary']['db_queries_tested']}", "", CYAN)
        log(f"Bottlenecks Found: {report['summary']['bottlenecks_found']}", "", 
            YELLOW if report['summary']['bottlenecks_found'] > 0 else GREEN)
        log("", "", "")
        log("Next: Review bottlenecks and plan optimizations (Step 2)", "", CYAN)
        
        return 0
        
    except Exception as e:
        log(f"ERROR: {str(e)}", "", RED)
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    exit(main())
