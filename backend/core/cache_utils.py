"""
Cache utility functions for cache invalidation and management
"""
from django.core.cache import cache
from django.conf import settings


def _delete_by_prefix(prefix):
    """Best-effort cache key purge without clearing unrelated entries."""
    try:
        backend_cache = getattr(cache, '_cache', None)
        if backend_cache and hasattr(backend_cache, 'keys'):
            for key in list(backend_cache.keys()):
                if prefix in str(key):
                    cache.delete(key)
    except Exception:
        pass


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
    _delete_by_prefix('products_list_')
    _delete_by_prefix('product_detail_')
    cache.delete('categories_list')


def invalidate_category_cache():
    """Invalidate category cache"""
    cache.delete('categories_list')


def invalidate_all_product_cache():
    """Invalidate all product-related caches"""
    cache.delete('categories_list')
    _delete_by_prefix('products_list_')
    _delete_by_prefix('product_detail_')


def get_cache_key(prefix, **kwargs):
    """Generate a cache key from prefix and parameters"""
    key_parts = [prefix]
    for key, value in sorted(kwargs.items()):
        if value is not None:
            key_parts.append(f"{key}_{value}")
    return "_".join(key_parts)


