from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg
from decimal import Decimal
from .models import Artisan, ArtisanPortfolio, ArtisanReview
from .serializers import ArtisanSerializer, ArtisanPortfolioSerializer, ArtisanReviewSerializer


class ArtisanViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Artisan.objects.filter(is_active=True).prefetch_related('portfolio_items', 'reviews')
    serializer_class = ArtisanSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['specialty', 'city', 'is_featured', 'is_verified']
    search_fields = ['name', 'name_ar', 'bio', 'city']
    ordering_fields = ['rating', 'review_count', 'created_at']
    ordering = ['-is_featured', '-rating', 'name']
    permission_classes = []


class ArtisanReviewViewSet(viewsets.ModelViewSet):
    queryset = ArtisanReview.objects.select_related('artisan', 'user')
    serializer_class = ArtisanReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['artisan', 'rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create review and update artisan rating"""
        review = serializer.save(user=self.request.user)
        
        # Update artisan rating
        artisan = review.artisan
        reviews = ArtisanReview.objects.filter(artisan=artisan)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        artisan.rating = Decimal(str(avg_rating or 0))
        artisan.review_count = reviews.count()
        artisan.save()

