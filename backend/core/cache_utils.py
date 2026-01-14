"""
Cache utility functions for cache invalidation and management
"""
from django.core.cache import cache
from django.conf import settings


def invalidate_product_cache(product_id=None, slug=None):
    """Invalidate product-related cache"""
    # Invalidate product detail cache
    if slug:
        cache.delete(f"product_detail_{slug}")
    if product_id:
        # Find all cached product details (this is a limitation - ideally use a cache backend with pattern matching)
        # For now, we'll invalidate common keys
        cache.delete(f"product_detail_{product_id}")
    
    # Invalidate product list cache
    cache_patterns = [
        'products_list_*',
        'categories_list',
    ]
    
    # Note: Django cache doesn't support pattern deletion by default
    # In production, use Redis with pattern matching or maintain a list of cache keys
    # For now, we'll clear all product list caches (aggressive but safe)
    try:
        # This is a simple approach - in production, maintain a registry of cache keys
        cache.clear()  # Clear all cache - use with caution in production
    except:
        pass


def invalidate_category_cache():
    """Invalidate category cache"""
    cache.delete('categories_list')


def invalidate_all_product_cache():
    """Invalidate all product-related caches"""
    cache.delete('categories_list')
    # Clear all product list caches
    cache.clear()  # In production, use a more targeted approach


def get_cache_key(prefix, **kwargs):
    """Generate a cache key from prefix and parameters"""
    key_parts = [prefix]
    for key, value in sorted(kwargs.items()):
        if value is not None:
            key_parts.append(f"{key}_{value}")
    return "_".join(key_parts)


