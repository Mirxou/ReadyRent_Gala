"""
Core views for ReadyRent.Gala
"""
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint for monitoring and Docker health checks
    """
    health_status = {
        'status': 'healthy',
        'database': 'ok',
        'cache': 'ok',
        'version': '1.0.0',
    }
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['database'] = 'ok'
    except Exception as e:
        health_status['database'] = 'error'
        health_status['status'] = 'unhealthy'
        health_status['database_error'] = str(e)
    
    # Check cache connection
    try:
        cache.set('health_check', 'ok', 10)
        cache.get('health_check')
        health_status['cache'] = 'ok'
    except Exception as e:
        health_status['cache'] = 'error'
        health_status['status'] = 'unhealthy'
        health_status['cache_error'] = str(e)
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)

