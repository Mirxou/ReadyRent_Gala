"""
Optimized availability checking service for bookings
Uses caching and optimized queries for better performance
"""
from django.db.models import Q, Count, Exists, OuterRef
from django.core.cache import cache
from django.utils import timezone
from datetime import date, timedelta
from typing import Dict, List, Optional, Tuple
from .models import Booking
from apps.products.models import Product
from apps.inventory.models import InventoryItem
from apps.maintenance.services import MaintenanceService


class AvailabilityService:
    """Service for checking product availability with performance optimizations"""
    
    CACHE_TIMEOUT = 300  # 5 minutes
    CACHE_PREFIX = 'availability'
    
    @staticmethod
    def check_availability(
        product_id: int,
        start_date: date,
        end_date: date,
        exclude_booking_id: Optional[int] = None
    ) -> Dict[str, any]:
        """
        Check if product is available for booking dates
        
        Returns:
            dict with 'available' (bool), 'reason' (str), and 'details' (dict)
        """
        cache_key = f"{AvailabilityService.CACHE_PREFIX}:{product_id}:{start_date}:{end_date}"
        
        # Try cache first
        cached_result = cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        try:
            product = Product.objects.select_related('category').get(id=product_id)
        except Product.DoesNotExist:
            return {
                'available': False,
                'reason': 'product_not_found',
                'message': 'المنتج غير موجود'
            }
        
        # Check product status
        if product.status != 'available':
            result = {
                'available': False,
                'reason': 'product_unavailable',
                'message': f'المنتج غير متاح حالياً (الحالة: {product.get_status_display()})',
                'details': {'status': product.status}
            }
            cache.set(cache_key, result, AvailabilityService.CACHE_TIMEOUT)
            return result
        
        # Check inventory (optimized query)
        try:
            inventory = InventoryItem.objects.select_for_update(nowait=True).get(product=product)
            if inventory.quantity_available <= 0:
                result = {
                    'available': False,
                    'reason': 'out_of_stock',
                    'message': 'المنتج غير متوفر في المخزون',
                    'details': {
                        'quantity_available': inventory.quantity_available,
                        'quantity_rented': inventory.quantity_rented
                    }
                }
                cache.set(cache_key, result, AvailabilityService.CACHE_TIMEOUT)
                return result
        except InventoryItem.DoesNotExist:
            # No inventory record - assume available if product status is available
            pass
        except Exception:
            # Lock timeout or other error - continue with other checks
            pass
        
        # Check maintenance periods (optimized)
        is_maintenance_available = MaintenanceService.is_product_available_for_dates(
            product, start_date, end_date
        )
        if not is_maintenance_available:
            result = {
                'available': False,
                'reason': 'maintenance',
                'message': 'المنتج في الصيانة خلال التواريخ المحددة',
                'details': {}
            }
            cache.set(cache_key, result, AvailabilityService.CACHE_TIMEOUT)
            return result
        
        # Check conflicting bookings (optimized query with index)
        booking_query = Booking.objects.filter(
            product=product,
            status__in=['pending', 'confirmed', 'in_use'],
            start_date__lte=end_date,
            end_date__gte=start_date
        )
        
        if exclude_booking_id:
            booking_query = booking_query.exclude(id=exclude_booking_id)
        
        # Use exists() for better performance
        has_conflicts = booking_query.exists()
        
        if has_conflicts:
            # Get count for details
            conflict_count = booking_query.count()
            
            # Check if we have enough inventory for all bookings
            try:
                inventory = InventoryItem.objects.get(product=product)
                # Count active bookings for this period
                active_bookings_count = Booking.objects.filter(
                    product=product,
                    status__in=['pending', 'confirmed', 'in_use'],
                    start_date__lte=end_date,
                    end_date__gte=start_date
                ).count()
                
                if exclude_booking_id:
                    active_bookings_count -= 1
                
                if inventory.quantity_available <= active_bookings_count:
                    result = {
                        'available': False,
                        'reason': 'fully_booked',
                        'message': 'المنتج محجوز بالكامل خلال التواريخ المحددة',
                        'details': {
                            'conflict_count': conflict_count,
                            'quantity_available': inventory.quantity_available,
                            'active_bookings': active_bookings_count
                        }
                    }
                    cache.set(cache_key, result, AvailabilityService.CACHE_TIMEOUT)
                    return result
            except InventoryItem.DoesNotExist:
                # No inventory - single item, conflicts mean unavailable
                result = {
                    'available': False,
                    'reason': 'conflict',
                    'message': 'المنتج محجوز خلال التواريخ المحددة',
                    'details': {'conflict_count': conflict_count}
                }
                cache.set(cache_key, result, AvailabilityService.CACHE_TIMEOUT)
                return result
        
        # All checks passed
        result = {
            'available': True,
            'reason': 'available',
            'message': 'المنتج متاح للتواريخ المحددة',
            'details': {}
        }
        cache.set(cache_key, result, AvailabilityService.CACHE_TIMEOUT)
        return result
    
    @staticmethod
    def check_multiple_products(
        product_ids: List[int],
        start_date: date,
        end_date: date
    ) -> Dict[int, Dict[str, any]]:
        """
        Check availability for multiple products (batch operation)
        Optimized for checking multiple products at once
        """
        results = {}
        
        # Get all products in one query
        products = Product.objects.filter(id__in=product_ids).select_related('category')
        product_dict = {p.id: p for p in products}
        
        # Get all inventory items in one query
        inventory_items = InventoryItem.objects.filter(product_id__in=product_ids)
        inventory_dict = {inv.product_id: inv for inv in inventory_items}
        
        # Get all conflicting bookings in one query (optimized)
        conflicting_bookings = Booking.objects.filter(
            product_id__in=product_ids,
            status__in=['pending', 'confirmed', 'in_use'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).values('product_id').annotate(count=Count('id'))
        
        conflict_dict = {item['product_id']: item['count'] for item in conflicting_bookings}
        
        # Check each product
        for product_id in product_ids:
            if product_id not in product_dict:
                results[product_id] = {
                    'available': False,
                    'reason': 'product_not_found',
                    'message': 'المنتج غير موجود'
                }
                continue
            
            product = product_dict[product_id]
            
            # Check status
            if product.status != 'available':
                results[product_id] = {
                    'available': False,
                    'reason': 'product_unavailable',
                    'message': f'المنتج غير متاح (الحالة: {product.get_status_display()})'
                }
                continue
            
            # Check inventory
            if product_id in inventory_dict:
                inventory = inventory_dict[product_id]
                if inventory.quantity_available <= 0:
                    results[product_id] = {
                        'available': False,
                        'reason': 'out_of_stock',
                        'message': 'المنتج غير متوفر في المخزون'
                    }
                    continue
                
                # Check conflicts with inventory
                conflict_count = conflict_dict.get(product_id, 0)
                if inventory.quantity_available <= conflict_count:
                    results[product_id] = {
                        'available': False,
                        'reason': 'fully_booked',
                        'message': 'المنتج محجوز بالكامل'
                    }
                    continue
            elif product_id in conflict_dict:
                # No inventory record but has conflicts - assume unavailable
                results[product_id] = {
                    'available': False,
                    'reason': 'conflict',
                    'message': 'المنتج محجوز خلال التواريخ المحددة'
                }
                continue
            
            # Check maintenance (individual check for each product)
            is_available = MaintenanceService.is_product_available_for_dates(
                product, start_date, end_date
            )
            if not is_available:
                results[product_id] = {
                    'available': False,
                    'reason': 'maintenance',
                    'message': 'المنتج في الصيانة خلال التواريخ المحددة'
                }
                continue
            
            # Available
            results[product_id] = {
                'available': True,
                'reason': 'available',
                'message': 'المنتج متاح'
            }
        
        return results
    
    @staticmethod
    def get_available_dates(
        product_id: int,
        start_date: date,
        end_date: date,
        max_days: int = 90
    ) -> List[date]:
        """
        Get list of available dates for a product within a range
        Useful for calendar views
        """
        if (end_date - start_date).days > max_days:
            end_date = start_date + timedelta(days=max_days)
        
        # Get all conflicting bookings
        conflicts = Booking.objects.filter(
            product=product_id,
            status__in=['pending', 'confirmed', 'in_use'],
            start_date__lte=end_date,
            end_date__gte=start_date
        ).values_list('start_date', 'end_date')
        
        # Build set of unavailable dates
        unavailable_dates = set()
        for conflict_start, conflict_end in conflicts:
            current = conflict_start
            while current <= conflict_end:
                unavailable_dates.add(current)
                current += timedelta(days=1)
        
        # Get available dates
        available_dates = []
        current = start_date
        while current <= end_date:
            if current not in unavailable_dates:
                available_dates.append(current)
            current += timedelta(days=1)
        
        return available_dates
    
    @staticmethod
    def invalidate_cache(product_id: int, start_date: date = None, end_date: date = None):
        """Invalidate availability cache for a product"""
        if start_date and end_date:
            cache_key = f"{AvailabilityService.CACHE_PREFIX}:{product_id}:{start_date}:{end_date}"
            cache.delete(cache_key)
        else:
            # Invalidate all caches for this product (use pattern matching if supported)
            # For now, we'll just clear a broader cache
            cache.delete(f"{AvailabilityService.CACHE_PREFIX}:{product_id}")
