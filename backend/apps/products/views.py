"""
Views for Product app
"""
from rest_framework import generics, filters, viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F, Max
from django.db.models.functions import Coalesce
from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db import connection
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from django.core.cache import cache
from django.conf import settings
from rest_framework.throttling import ScopedRateThrottle
from core.throttling import ProductSearchThrottle
from .models import Category, Product, ProductVariant, Wishlist
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer,
    ProductVariantSerializer, ProductVariantListSerializer, WishlistSerializer
)
from .services import ColorMatchingService, RecommendationService
from rest_framework.permissions import IsAuthenticated


@method_decorator(cache_page(60 * 15), name='dispatch')  # Cache for 15 minutes
class CategoryListView(generics.ListAPIView):
    """List all categories"""
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        cache_key = 'categories_list'
        queryset = cache.get(cache_key)
        if queryset is None:
            queryset = Category.objects.filter(is_active=True)
            cache.set(cache_key, queryset, 60 * 15)  # Cache for 15 minutes
        return queryset


@method_decorator(cache_page(60 * 5), name='dispatch')  # Cache for 5 minutes
class ProductListView(generics.ListAPIView):
    """
    List all products with advanced filtering and search capabilities.
    
    This endpoint supports:
    - Full-text search across product names, descriptions, and categories
    - Filtering by category, status, size, color, and price range
    - Multiple category, size, and color filters
    - Sorting by price, rating, creation date, or rental count
    
    **Query Parameters:**
    - `search`: Search query string (searches in name, description, category)
    - `category`: Filter by category ID
    - `categories`: Filter by multiple category IDs (comma-separated)
    - `status`: Filter by product status (available, rented, maintenance, unavailable)
    - `size`: Filter by size (XS, S, M, L, XL, XXL, XXXL)
    - `sizes`: Filter by multiple sizes (comma-separated)
    - `color`: Filter by color (case-insensitive)
    - `colors`: Filter by multiple colors (comma-separated, case-insensitive). Supports common color names (red, blue, etc.) and custom colors.
    - `price_min`: Minimum price per day (DZD). Only sent if > 0. Defaults to 0 if not provided.
    - `price_max`: Maximum price per day (DZD). Only sent if < maxPrice. Defaults to max if not provided.
    - `is_featured`: Filter featured products (true/false)
    - `ordering`: Sort field (- prefix for descending)
    - `page`: Page number for pagination
    
    **Example Requests:**
    - Get all available products: `/api/products/?status=available`
    - Search for dresses: `/api/products/?search=فسستان`
    - Filter by price range: `/api/products/?price_min=1000&price_max=5000`
    - Multiple categories: `/api/products/?categories=1,2,3`
    """
    queryset = Product.objects.select_related('category').prefetch_related('images').all()
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    throttle_classes = [ProductSearchThrottle]
    throttle_scope = 'product_search'
    filterset_fields = ['category', 'status', 'size', 'color', 'is_featured']
    search_fields = ['name', 'name_ar', 'description', 'description_ar', 'category__name', 'category__name_ar']
    ordering_fields = ['price_per_day', 'rating', 'created_at', 'total_rentals']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Build cache key based on query parameters
        cache_params = {
            'category': self.request.query_params.get('category'),
            'status': self.request.query_params.get('status'),
            'price_min': self.request.query_params.get('price_min'),
            'price_max': self.request.query_params.get('price_max'),
            'search': self.request.query_params.get('search'),
            'page': self.request.query_params.get('page', 1),
        }
        cache_key = f"products_list_{hash(frozenset(cache_params.items()))}"
        
        # Try to get from cache (only for non-search queries to avoid stale results)
        if not cache_params.get('search'):
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                return cached_result
        
        # Filter by price range
        # Note: Frontend sends price_min only if > 0, and price_max only if < maxPrice
        # So if price_min is not sent, it defaults to 0 (no minimum filter)
        # If price_max is not sent, it defaults to max (no maximum filter)
        price_min = self.request.query_params.get('price_min')
        price_max = self.request.query_params.get('price_max')
        
        if price_min:
            try:
                price_min_float = float(price_min)
                # Only filter if price_min > 0 (Frontend doesn't send 0)
                if price_min_float > 0:
                    queryset = queryset.filter(price_per_day__gte=price_min_float)
            except (ValueError, TypeError):
                pass
        
        if price_max:
            try:
                price_max_float = float(price_max)
                # Only filter if price_max is set (Frontend doesn't send maxPrice)
                if price_max_float > 0:
                    queryset = queryset.filter(price_per_day__lte=price_max_float)
            except (ValueError, TypeError):
                pass
        
        # Filter by multiple categories
        categories = self.request.query_params.getlist('categories')
        if categories:
            queryset = queryset.filter(category__id__in=categories)
        
        # Filter by multiple sizes
        sizes = self.request.query_params.getlist('sizes')
        if sizes:
            queryset = queryset.filter(size__in=sizes)
        
        # Filter by multiple colors
        # Support case-insensitive matching for both common colors and custom colors
        colors = self.request.query_params.getlist('colors')
        if colors:
            # Case-insensitive search (iexact handles all case variations)
            # Also supports custom colors entered by users
            color_filters = Q()
            for color_value in colors:
                color_value = color_value.strip()
                if color_value:
                    # Case-insensitive exact match (handles red, Red, RED, etc.)
                    color_filters |= Q(color__iexact=color_value)
            queryset = queryset.filter(color_filters)
        
        # Full-text search using PostgreSQL if available
        search_query = self.request.query_params.get('search')
        
        if search_query:
            # Check if we're using PostgreSQL
            if connection.vendor == 'postgresql':
                # Use PostgreSQL full-text search with ranking
                # Higher weight for exact matches in name fields
                search_vector = SearchVector('name', weight='A', config='arabic') + \
                               SearchVector('name_ar', weight='A', config='arabic') + \
                               SearchVector('description', weight='B', config='arabic') + \
                               SearchVector('description_ar', weight='B', config='arabic') + \
                               SearchVector('category__name', weight='C', config='arabic') + \
                               SearchVector('category__name_ar', weight='C', config='arabic')
                
                search_query_obj = SearchQuery(search_query, config='arabic')
                
                # Add boost for featured products and high ratings
                queryset = queryset.annotate(
                    search=search_vector,
                    rank=SearchRank(search_vector, search_query_obj),
                    # Boost featured products
                    featured_boost=Count('id', filter=Q(is_featured=True)) * 0.1,
                    # Boost high-rated products
                    rating_boost=Coalesce('rating', 0) * 0.05,
                ).filter(search=search_query_obj).annotate(
                    # Combined relevance score
                    relevance=Coalesce('rank', 0) + Coalesce('featured_boost', 0) + Coalesce('rating_boost', 0)
                ).order_by('-relevance', '-created_at')
            else:
                # Fallback to icontains for other databases with ranking
                # Prioritize exact matches in name fields
                queryset = queryset.annotate(
                    # Calculate relevance score
                    name_match=Count('id', filter=Q(name__icontains=search_query) | Q(name_ar__icontains=search_query)),
                    desc_match=Count('id', filter=Q(description__icontains=search_query) | Q(description_ar__icontains=search_query)),
                ).filter(
                    Q(name__icontains=search_query) |
                    Q(name_ar__icontains=search_query) |
                    Q(description__icontains=search_query) |
                    Q(description_ar__icontains=search_query) |
                    Q(category__name__icontains=search_query) |
                    Q(category__name_ar__icontains=search_query)
                ).annotate(
                    # Combined relevance (name matches weighted higher)
                    relevance=Coalesce('name_match', 0) * 2 + Coalesce('desc_match', 0)
                ).order_by('-relevance', '-rating', '-created_at')
        
        # Cache result if no search query
        if not search_query:
            cache.set(cache_key, queryset, 60 * 5)  # Cache for 5 minutes
        
        return queryset
    
    def dispatch(self, *args, **kwargs):
        """Override dispatch to handle cache invalidation"""
        response = super().dispatch(*args, **kwargs)
        
        # Add cache headers
        response['Cache-Control'] = 'public, max-age=300'  # 5 minutes
        response['Vary'] = 'Accept-Language, Cookie'
        
        return response


@method_decorator(cache_page(60 * 10), name='dispatch')  # Cache for 10 minutes
class ProductDetailView(generics.RetrieveAPIView):
    """
    Retrieve detailed information about a specific product.
    
    Returns complete product information including:
    - Basic details (name, description, price, etc.)
    - Category information
    - Product images
    - Availability status
    - Rating and rental count
    
    **Example Request:**
    ```
    GET /api/products/my-product-slug/
    ```
    
    **Response:**
    ```json
    {
        "id": 1,
        "name": "Evening Dress",
        "name_ar": "فسستان سهرة",
        "slug": "my-product-slug",
        "description": "...",
        "category": {...},
        "price_per_day": "2500.00",
        "size": "M",
        "color": "Red",
        "status": "available",
        "images": [...],
        "rating": "4.5",
        "total_rentals": 15
    }
    ```
    """
    queryset = Product.objects.select_related('category').prefetch_related('images').all()
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    lookup_field = 'slug'
    
    def get_object(self):
        slug = self.kwargs.get('slug')
        cache_key = f"product_detail_{slug}"
        
        obj = cache.get(cache_key)
        if obj is None:
            obj = super().get_object()
            cache.set(cache_key, obj, 60 * 10)  # Cache for 10 minutes
        return obj
    
    def dispatch(self, *args, **kwargs):
        """Override dispatch to add cache headers"""
        response = super().dispatch(*args, **kwargs)
        response['Cache-Control'] = 'public, max-age=600'  # 10 minutes
        return response


# Admin Views
class AdminProductManagementViewSet(viewsets.ModelViewSet):
    """Admin product management (CRUD)"""
    queryset = Product.objects.select_related('category').prefetch_related('images').all()
    serializer_class = ProductSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'status', 'is_featured']
    search_fields = ['name', 'name_ar', 'description', 'description_ar']
    ordering_fields = ['created_at', 'price_per_day', 'rating']
    ordering = ['-created_at']


class AdminCategoryManagementViewSet(viewsets.ModelViewSet):
    """Admin category management (CRUD)"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'name_ar']


@api_view(['GET'])
@permission_classes([AllowAny])
def search_suggestions(request):
    """
    Get search suggestions based on query string.
    
    Returns relevant product and category suggestions that match the query.
    Uses full-text search for better relevance when using PostgreSQL.
    
    **Query Parameters:**
    - `q`: Search query string (minimum 2 characters)
    
    **Example Request:**
    ```
    GET /api/products/search-suggestions/?q=فسستان
    ```
    
    **Response:**
    ```json
    {
        "suggestions": [
            {
                "type": "product",
                "text": "فسستان سهرة أحمر",
                "slug": "evening-dress-red",
                "id": 1,
                "category": "فساتين سهرة"
            },
            {
                "type": "category",
                "text": "فساتين سهرة",
                "id": 2
            }
        ]
    }
    ```
    """
    query = request.query_params.get('q', '').strip()
    
    if len(query) < 2:
        return Response({'suggestions': []})
    
    suggestions = []
    
    # Check if we're using PostgreSQL for better search
    if connection.vendor == 'postgresql':
        # Use full-text search for better suggestions
        search_vector = SearchVector('name', weight='A') + \
                       SearchVector('name_ar', weight='A')
        search_query_obj = SearchQuery(query, config='arabic')
        
        # Get product name suggestions with ranking
        products = Product.objects.filter(
            status='available'
        ).annotate(
            search=search_vector,
            rank=SearchRank(search_vector, search_query_obj)
        ).filter(
            Q(name__icontains=query) | Q(name_ar__icontains=query)
        ).order_by('-rank', '-total_rentals').distinct()[:5]
        
        # Get category suggestions
        categories = Category.objects.filter(
            Q(name__icontains=query) | Q(name_ar__icontains=query),
            is_active=True
        ).distinct()[:3]
        
        # Add product suggestions with more context
        for product in products:
            suggestions.append({
                'type': 'product',
                'text': product.name_ar or product.name,
                'slug': product.slug,
                'id': product.id,
                'category': product.category.name_ar if product.category else None,
            })
        
        # Add category suggestions
        for category in categories:
            suggestions.append({
                'type': 'category',
                'text': category.name_ar or category.name,
                'id': category.id,
            })
    else:
        # Fallback to basic icontains
        products = Product.objects.filter(
            Q(name__icontains=query) | Q(name_ar__icontains=query),
            status='available'
        ).distinct()[:5]
        
        categories = Category.objects.filter(
            Q(name__icontains=query) | Q(name_ar__icontains=query),
            is_active=True
        ).distinct()[:3]
        
        for product in products:
            suggestions.append({
                'type': 'product',
                'text': product.name_ar or product.name,
                'slug': product.slug,
                'id': product.id,
                'category': product.category.name_ar if product.category else None,
            })
        
        for category in categories:
            suggestions.append({
                'type': 'category',
                'text': category.name_ar or category.name,
                'id': category.id,
            })
    
    return Response({'suggestions': suggestions})


@api_view(['GET'])
@permission_classes([AllowAny])
def product_metadata(request):
    """
    Get product metadata including available sizes, status choices, colors, etc.
    
    Returns:
    - sizes: List of available size choices
    - statuses: List of available status choices
    - colors: List of common color options with hex codes
    - price_range: Default price range (min: 0, max: calculated from products)
    
    **Example Request:**
    ```
    GET /api/products/metadata/
    ```
    
    **Response:**
    ```json
    {
        "sizes": [
            {"value": "XS", "label": "XS"},
            {"value": "S", "label": "S"},
            {"value": "M", "label": "M"},
            {"value": "L", "label": "L"},
            {"value": "XL", "label": "XL"},
            {"value": "XXL", "label": "XXL"},
            {"value": "XXXL", "label": "XXXL"}
        ],
        "statuses": [
            {"value": "available", "label": "Available"},
            {"value": "rented", "label": "Rented"},
            {"value": "maintenance", "label": "Under Maintenance"},
            {"value": "unavailable", "label": "Unavailable"}
        ],
        "colors": [
            {"name": "أحمر", "value": "red", "hex": "#EF4444"},
            {"name": "أزرق", "value": "blue", "hex": "#3B82F6"},
            ...
        ],
        "price_range": {
            "min": 0,
            "max": 50000,
            "currency": "DZD",
            "unit": "per_day"
        }
    }
    ```
    """
    from .models import Product
    
    sizes = [
        {'value': value, 'label': label}
        for value, label in Product.SIZE_CHOICES
    ]
    
    statuses = [
        {'value': value, 'label': str(label)}
        for value, label in Product.STATUS_CHOICES
    ]
    
    # Common colors matching Frontend
    colors = [
        {'name': 'أحمر', 'value': 'red', 'hex': '#EF4444'},
        {'name': 'أزرق', 'value': 'blue', 'hex': '#3B82F6'},
        {'name': 'أخضر', 'value': 'green', 'hex': '#10B981'},
        {'name': 'أصفر', 'value': 'yellow', 'hex': '#F59E0B'},
        {'name': 'وردي', 'value': 'pink', 'hex': '#EC4899'},
        {'name': 'بنفسجي', 'value': 'purple', 'hex': '#8B5CF6'},
        {'name': 'أسود', 'value': 'black', 'hex': '#1F2937'},
        {'name': 'أبيض', 'value': 'white', 'hex': '#FFFFFF'},
        {'name': 'بيج', 'value': 'beige', 'hex': '#F5F5DC'},
        {'name': 'ذهبي', 'value': 'gold', 'hex': '#FBBF24'},
    ]
    
    # Get max price from products
    max_price = Product.objects.aggregate(
        max_price=Max('price_per_day')
    )['max_price'] or 50000
    
    price_range = {
        'min': 0,
        'max': float(max_price) if max_price else 50000,
        'currency': 'DZD',
        'unit': 'per_day'
    }
    
    return Response({
        'sizes': sizes,
        'statuses': statuses,
        'colors': colors,
        'price_range': price_range
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def matching_accessories(request, pk):
    """Get matching accessories for a product based on color"""
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    limit = int(request.query_params.get('limit', 5))
    category_names = request.query_params.getlist('categories')  # Optional category filter

    # Get matching accessories
    matches = ColorMatchingService.get_matching_accessories(
        product_id=product.id,
        limit=limit,
        accessory_category_names=category_names if category_names else None
    )

    # Serialize results
    serializer = ProductListSerializer(
        [match['product'] for match in matches],
        many=True,
        context={'request': request}
    )

    # Add compatibility info
    results = []
    for i, match in enumerate(matches):
        product_data = serializer.data[i]
        product_data['compatibility'] = match['compatibility']
        product_data['compatibility_label'] = {
            'perfect': 'مثالي',
            'good': 'جيد',
            'acceptable': 'مقبول'
        }.get(match['compatibility'], 'مقبول')
        results.append(product_data)

    return Response({
        'primary_product_id': product.id,
        'primary_product_color': product.color_hex or product.color,
        'accessories': results
    })


# Variant Views
class ProductVariantListView(generics.ListAPIView):
    """List variants for a product"""
    serializer_class = ProductVariantListSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['size', 'color', 'is_active']
    ordering_fields = ['size', 'color', 'price_per_day']
    ordering = ['size', 'color']
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        queryset = ProductVariant.objects.filter(
            product_id=product_id,
            is_active=True
        ).select_related('product').prefetch_related('inventory')
        return queryset


class ProductVariantDetailView(generics.RetrieveAPIView):
    """Get variant details"""
    serializer_class = ProductVariantSerializer
    permission_classes = [AllowAny]
    queryset = ProductVariant.objects.select_related('product').prefetch_related('inventory')


class AdminProductVariantViewSet(viewsets.ModelViewSet):
    """Admin variant management"""
    queryset = ProductVariant.objects.select_related('product').prefetch_related('inventory')
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['product', 'size', 'color', 'is_active']
    search_fields = ['name', 'sku', 'product__name', 'product__name_ar']
    ordering_fields = ['created_at', 'price_per_day']
    ordering = ['-created_at']


class WishlistViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user wishlist"""
    serializer_class = WishlistSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return wishlist items for current user"""
        return Wishlist.objects.filter(user=self.request.user).select_related('product', 'product__category').prefetch_related('product__images')
    
    def perform_create(self, serializer):
        """Add product to wishlist"""
        product_id = serializer.validated_data.get('product_id')
        product = Product.objects.get(id=product_id)
        
        # Check if already in wishlist
        if Wishlist.objects.filter(user=self.request.user, product=product).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({'error': 'المنتج موجود بالفعل في قائمة المفضلة'})
        
        serializer.save(user=self.request.user, product=product)
    
    @action(detail=False, methods=['post'], url_path='toggle/(?P<product_id>[0-9]+)')
    def toggle(self, request, product_id=None):
        """Toggle product in wishlist (add if not exists, remove if exists)"""
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'المنتج غير موجود'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        wishlist_item, created = Wishlist.objects.get_or_create(
            user=request.user,
            product=product
        )
        
        if not created:
            # Remove from wishlist
            wishlist_item.delete()
            return Response({
                'message': 'تم إزالة المنتج من قائمة المفضلة',
                'in_wishlist': False
            })
        else:
            # Added to wishlist
            return Response({
                'message': 'تم إضافة المنتج إلى قائمة المفضلة',
                'in_wishlist': True,
                'wishlist_item': WishlistSerializer(wishlist_item, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'], url_path='check/(?P<product_id>[0-9]+)')
    def check(self, request, product_id=None):
        """Check if product is in user's wishlist"""
        in_wishlist = Wishlist.objects.filter(
            user=request.user,
            product_id=product_id
        ).exists()
        
        return Response({'in_wishlist': in_wishlist})


@api_view(['GET'])
@permission_classes([AllowAny])
def product_recommendations(request, pk):
    """Get product recommendations (similar products)"""
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
    
    limit = int(request.query_params.get('limit', 6))
    user_id = request.user.id if request.user.is_authenticated else None
    
    # Get similar products
    similar_products = RecommendationService.get_similar_products(
        product_id=product.id,
        limit=limit,
        user_id=user_id
    )
    
    # Serialize results
    serializer = ProductListSerializer(
        similar_products,
        many=True,
        context={'request': request}
    )
    
    return Response({
        'primary_product_id': product.id,
        'recommendations': serializer.data
    })

