"""
Performance-optimized managers for frequently accessed models.

These managers add caching layer to expensive queries.
"""
from django.core.cache import cache
from django.db import models


class CachedCountManager(models.Manager):
    """
    Manager that caches count() results for 5 minutes.
    
    Use for models where count doesn't change frequently.
    """
    CACHE_TIMEOUT = 300  # 5 minutes
    
    def count(self):
        """Override count() to use cache"""
        cache_key = f'{self.model._meta.db_table}_count'
        count = cache.get(cache_key)
        
        if count is None:
            count = super().count()
            cache.set(cache_key, count, self.CACHE_TIMEOUT)
        
        return count
    
    def invalidate_count_cache(self):
        """Call this when model data changes"""
        cache_key = f'{self.model._meta.db_table}_count'
        cache.delete(cache_key)


class DisputePerformanceManager(CachedCountManager):
    """
    Performance-optimized manager for Dispute model.
    
    Features:
    - Cached count()
    - Optimized queries with select_related/prefetch_related
    """
    
    def with_relations(self):
        """
        Common query pattern with all relationships loaded.
        Prevents N+1 queries.
        """
        return self.select_related(
            'user',
            'booking',
            'assigned_to',
            'resolved_by'
        ).prefetch_related(
            'judgments',
            'evidences'
        )
    
    def recent(self, limit=10):
        """Get recent disputes with optimized query"""
        return self.with_relations().order_by('-created_at')[:limit]
