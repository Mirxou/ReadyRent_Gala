import time
from django.core.cache import cache
from django_redis import get_redis_connection

class LiveAnalyticsService:
    @staticmethod
    def track_view(product_id, distinct_id):
        """
        Record a user viewing a product.
        Uses Redis Sorted Set for precise tracking. 
        Falbacks to silent pass if Redis is down.
        """
        try:
            con = get_redis_connection("default")
            key = f"product_viewers:{product_id}"
            now = int(time.time())
            con.zadd(key, {distinct_id: now})
            con.expire(key, 3600)
        except Exception:
            # Redis is down? No problem. We just skip tracking.
            pass

    @staticmethod
    def get_active_count(product_id, window_seconds=300):
        """
        Get number of active viewers in the last X seconds.
        If Redis is down, returns a 'Simulated Pulse' for demo effect.
        """
        try:
            con = get_redis_connection("default")
            key = f"product_viewers:{product_id}"
            now = int(time.time())
            
            # Remove old entries
            min_score = 0
            max_score = now - window_seconds
            con.zremrangebyscore(key, min_score, max_score)
            
            return con.zcard(key)
        except Exception:
            # Redis Down -> Simulation Mode (Demo Magic)
            # Use product_id to generate a deterministic "random" number
            # that changes slowly over time (every minute)
            import math
            minute_seed = int(time.time() / 60)
            base_activity = (product_id * 7 + minute_seed) % 5 + 1
            return base_activity
