from rest_framework import viewsets, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Avg
from decimal import Decimal
from .models import ServiceCategory, LocalService, ServiceReview
from .serializers import ServiceCategorySerializer, LocalServiceSerializer, ServiceReviewSerializer


class ServiceCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceCategory.objects.filter(is_active=True).prefetch_related('services')
    serializer_class = ServiceCategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    search_fields = ['name', 'name_ar']
    permission_classes = []


class LocalServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = LocalService.objects.filter(is_active=True).select_related('category').prefetch_related('images', 'reviews')
    serializer_class = LocalServiceSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['service_type', 'category', 'city', 'is_featured', 'is_verified']
    search_fields = ['name', 'name_ar', 'description', 'address']
    ordering_fields = ['rating', 'review_count', 'created_at']
    ordering = ['-is_featured', '-rating', 'name']
    permission_classes = []


class ServiceReviewViewSet(viewsets.ModelViewSet):
    queryset = ServiceReview.objects.select_related('service', 'user')
    serializer_class = ServiceReviewSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['service', 'rating']
    ordering_fields = ['created_at', 'rating']
    ordering = ['-created_at']
    permission_classes = [IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create review and update service rating"""
        review = serializer.save(user=self.request.user)
        
        # Update service rating
        service = review.service
        reviews = ServiceReview.objects.filter(service=service)
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        service.rating = Decimal(str(avg_rating or 0))
        service.review_count = reviews.count()
        service.save()

