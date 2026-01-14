"""
Services for Product app - Color matching and accessory suggestions
"""
import math
from typing import List, Dict, Tuple, Optional
from django.db.models import Q, Count, Avg
from django.db.models.functions import Coalesce
from .models import Product


class ColorMatchingService:
    """Service for color matching and accessory suggestions"""

    @staticmethod
    def hex_to_rgb(hex_color: str) -> Optional[Tuple[int, int, int]]:
        """Convert hex color to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        if len(hex_color) != 6:
            return None
        try:
            return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
        except ValueError:
            return None

    @staticmethod
    def rgb_to_hsv(r: int, g: int, b: int) -> Tuple[float, float, float]:
        """Convert RGB to HSV"""
        r, g, b = r / 255.0, g / 255.0, b / 255.0
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        delta = max_val - min_val

        # Value
        v = max_val

        # Saturation
        s = 0 if max_val == 0 else delta / max_val

        # Hue
        if delta == 0:
            h = 0
        elif max_val == r:
            h = 60 * (((g - b) / delta) % 6)
        elif max_val == g:
            h = 60 * (((b - r) / delta) + 2)
        else:
            h = 60 * (((r - g) / delta) + 4)

        return (h, s, v)

    @staticmethod
    def color_distance_rgb(color1: str, color2: str) -> float:
        """Calculate Euclidean distance between two colors in RGB space"""
        rgb1 = ColorMatchingService.hex_to_rgb(color1)
        rgb2 = ColorMatchingService.hex_to_rgb(color2)

        if not rgb1 or not rgb2:
            return float('inf')

        return math.sqrt(sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)))

    @staticmethod
    def color_distance_hsv(color1: str, color2: str) -> float:
        """Calculate distance between two colors in HSV space"""
        rgb1 = ColorMatchingService.hex_to_rgb(color1)
        rgb2 = ColorMatchingService.hex_to_rgb(color2)

        if not rgb1 or not rgb2:
            return float('inf')

        hsv1 = ColorMatchingService.rgb_to_hsv(*rgb1)
        hsv2 = ColorMatchingService.rgb_to_hsv(*rgb2)

        # Weighted distance (hue is more important for matching)
        h_diff = min(abs(hsv1[0] - hsv2[0]), 360 - abs(hsv1[0] - hsv2[0])) / 180.0
        s_diff = abs(hsv1[1] - hsv2[1])
        v_diff = abs(hsv1[2] - hsv2[2])

        return math.sqrt((h_diff * 2) ** 2 + s_diff ** 2 + v_diff ** 2)

    @staticmethod
    def get_color_compatibility(primary_color: str, accessory_color: str) -> str:
        """
        Determine color compatibility level
        Returns: 'perfect', 'good', 'acceptable'
        """
        if not primary_color or not accessory_color:
            return 'acceptable'

        # Normalize hex colors
        primary_color = primary_color.lstrip('#')
        accessory_color = accessory_color.lstrip('#')
        
        if len(primary_color) != 6 or len(accessory_color) != 6:
            return 'acceptable'

        primary_color = '#' + primary_color
        accessory_color = '#' + accessory_color

        # Use HSV distance for better matching
        distance = ColorMatchingService.color_distance_hsv(primary_color, accessory_color)

        if distance < 0.2:
            return 'perfect'
        elif distance < 0.4:
            return 'good'
        else:
            return 'acceptable'

    @staticmethod
    def get_matching_accessories(
        product_id: int,
        limit: int = 5,
        accessory_category_names: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Get matching accessories for a product based on color matching
        
        Args:
            product_id: ID of the primary product
            limit: Maximum number of accessories to return
            accessory_category_names: List of category names/slugs to consider as accessories
                                      If None, will look for categories with 'accessory' in name
        
        Returns:
            List of dictionaries with accessory products and compatibility info
        """
        try:
            primary_product = Product.objects.select_related('category').get(id=product_id)
        except Product.DoesNotExist:
            return []

        # Get primary product color
        primary_color = primary_product.color_hex
        if not primary_color:
            # If no color_hex, try to match by color name (fallback)
            return ColorMatchingService._get_matching_by_color_name(
                primary_product, limit, accessory_category_names
            )

        # Determine accessory categories
        if accessory_category_names:
            accessory_categories = Product.objects.filter(
                category__slug__in=accessory_category_names
            ).values_list('category_id', flat=True).distinct()
        else:
            # Default: look for categories with 'accessory' in name (case insensitive)
            from .models import Category
            accessory_categories = Category.objects.filter(
                Q(name__icontains='accessory') |
                Q(name_ar__icontains='اكسسوار') |
                Q(slug__icontains='accessory')
            ).values_list('id', flat=True)

        if not accessory_categories:
            return []

        # Get available accessories (exclude the primary product itself)
        accessories = Product.objects.filter(
            category_id__in=accessory_categories,
            status='available',
            color_hex__isnull=False
        ).exclude(id=product_id).select_related('category').prefetch_related('images')

        # Calculate compatibility for each accessory
        accessories_with_compat = []
        for accessory in accessories:
            compatibility = ColorMatchingService.get_color_compatibility(
                primary_color,
                accessory.color_hex
            )
            
            # Calculate distance for sorting
            distance = ColorMatchingService.color_distance_hsv(
                primary_color,
                accessory.color_hex
            )

            accessories_with_compat.append({
                'product': accessory,
                'compatibility': compatibility,
                'distance': distance,
            })

        # Sort by compatibility (perfect < good < acceptable) then by distance
        compatibility_order = {'perfect': 0, 'good': 1, 'acceptable': 2}
        accessories_with_compat.sort(
            key=lambda x: (compatibility_order.get(x['compatibility'], 3), x['distance'])
        )

        # Limit results
        return accessories_with_compat[:limit]

    @staticmethod
    def _get_matching_by_color_name(
        primary_product: Product,
        limit: int,
        accessory_category_names: Optional[List[str]]
    ) -> List[Dict]:
        """Fallback: match by color name if color_hex is not available"""
        # Determine accessory categories
        if accessory_category_names:
            accessory_categories = Product.objects.filter(
                category__slug__in=accessory_category_names
            ).values_list('category_id', flat=True).distinct()
        else:
            from .models import Category
            accessory_categories = Category.objects.filter(
                Q(name__icontains='accessory') |
                Q(name_ar__icontains='اكسسوار') |
                Q(slug__icontains='accessory')
            ).values_list('id', flat=True)

        if not accessory_categories:
            return []

        # Get accessories with matching color name
        accessories = Product.objects.filter(
            category_id__in=accessory_categories,
            status='available',
            color__iexact=primary_product.color
        ).exclude(id=primary_product.id).select_related('category').prefetch_related('images')[:limit]

        return [
            {
                'product': accessory,
                'compatibility': 'good',  # Assume good if color name matches
                'distance': 0,
            }
            for accessory in accessories
        ]


class RecommendationService:
    """Service for product recommendations"""
    
    @staticmethod
    def get_similar_products(
        product_id: int,
        limit: int = 6,
        user_id: Optional[int] = None
    ) -> List[Product]:
        """
        Get similar products based on:
        1. Same category
        2. Same size or color
        3. Popular products in same category
        4. User's booking history (if authenticated)
        """
        try:
            product = Product.objects.select_related('category').get(id=product_id)
        except Product.DoesNotExist:
            return []
        
        # Base query: same category, available, exclude current product
        similar = Product.objects.filter(
            category=product.category,
            status='available'
        ).exclude(id=product_id).select_related('category').prefetch_related('images')
        
        # Prioritize by:
        # 1. Same size
        # 2. Same color
        # 3. High rating
        # 4. High rental count
        
        # Get products with same size or color first
        same_size_or_color = similar.filter(
            Q(size=product.size) | Q(color__iexact=product.color)
        ).annotate(
            similarity_score=Count('id')  # Placeholder, will be refined
        )
        
        # Get popular products in same category
        popular = similar.annotate(
            popularity_score=Coalesce(Avg('rating'), 0) + (Count('bookings') * 0.1)
        ).order_by('-popularity_score', '-rating', '-total_rentals')
        
        # Combine and deduplicate
        result_ids = set()
        results = []
        
        # First, add same size/color products
        for item in same_size_or_color[:limit]:
            if item.id not in result_ids:
                results.append(item)
                result_ids.add(item.id)
        
        # Then, add popular products
        for item in popular:
            if item.id not in result_ids and len(results) < limit:
                results.append(item)
                result_ids.add(item.id)
        
        # If user is authenticated, consider their booking history
        if user_id:
            user_recommendations = RecommendationService._get_user_based_recommendations(
                user_id, product, limit - len(results)
            )
            for item in user_recommendations:
                if item.id not in result_ids and len(results) < limit:
                    results.append(item)
                    result_ids.add(item.id)
        
        return results[:limit]
    
    @staticmethod
    def _get_user_based_recommendations(
        user_id: int,
        current_product: Product,
        limit: int
    ) -> List[Product]:
        """Get recommendations based on user's booking history"""
        try:
            from apps.bookings.models import Booking
            
            # Get categories of products user has booked
            booked_categories = Booking.objects.filter(
                user_id=user_id,
                status__in=['completed', 'in_use']
            ).values_list('product__category_id', flat=True).distinct()
            
            if not booked_categories:
                return []
            
            # Get products in those categories that user hasn't booked
            booked_product_ids = Booking.objects.filter(
                user_id=user_id
            ).values_list('product_id', flat=True).distinct()
            
            recommendations = Product.objects.filter(
                category_id__in=booked_categories,
                status='available'
            ).exclude(
                id__in=list(booked_product_ids) + [current_product.id]
            ).order_by('-rating', '-total_rentals')[:limit]
            
            return list(recommendations)
        except Exception:
            return []
    
    @staticmethod
    def get_popular_in_category(
        category_id: int,
        limit: int = 6,
        exclude_product_id: Optional[int] = None
    ) -> List[Product]:
        """Get popular products in a category"""
        queryset = Product.objects.filter(
            category_id=category_id,
            status='available'
        ).annotate(
            popularity=Coalesce(Avg('rating'), 0) + (Count('bookings') * 0.1)
        ).order_by('-popularity', '-rating', '-total_rentals')
        
        if exclude_product_id:
            queryset = queryset.exclude(id=exclude_product_id)
        
        return list(queryset.select_related('category').prefetch_related('images')[:limit])

