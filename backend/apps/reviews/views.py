"""
Views for Review app
"""
from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.db.models import Avg
from .models import Review, ReviewImage
from .serializers import ReviewSerializer, ReviewCreateSerializer, ReviewImageSerializer
from .services import SentimentAnalysisService


class ReviewCreateView(generics.CreateAPIView):
    """Create review"""
    serializer_class = ReviewCreateSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        serializer = ReviewCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        # Analyze sentiment
        comment_text = serializer.validated_data.get('comment', '')
        title_text = serializer.validated_data.get('title', '')
        full_text = f"{title_text} {comment_text}".strip()
        
        sentiment_service = SentimentAnalysisService()
        sentiment_result = sentiment_service.analyze_sentiment(full_text)
        
        # Create review
        review = Review.objects.create(
            user=request.user,
            product_id=serializer.validated_data['product_id'],
            booking_id=serializer.validated_data.get('booking_id'),
            rating=serializer.validated_data['rating'],
            title=serializer.validated_data['title'],
            comment=serializer.validated_data['comment'],
            is_verified_purchase=bool(serializer.validated_data.get('booking_id')),
            sentiment_score=sentiment_result['score'],
            sentiment_label=sentiment_result['label']
        )
        
        # Update product rating
        product = review.product
        reviews = Review.objects.filter(product=product, status='approved')
        if reviews.exists():
            avg_rating = reviews.aggregate(models.Avg('rating'))['rating__avg']
            product.rating = round(avg_rating, 2)
            product.save()
        
        result_serializer = ReviewSerializer(review)
        return Response(result_serializer.data, status=status.HTTP_201_CREATED)


class ReviewListView(generics.ListAPIView):
    """List reviews for a product"""
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product', 'rating', 'status']
    ordering_fields = ['created_at', 'rating', 'helpful_count']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = Review.objects.filter(status='approved').select_related(
            'user', 'product', 'booking'
        ).prefetch_related('images')
        
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        return queryset


class ReviewModerationView(generics.UpdateAPIView):
    """Moderate review (admin only)"""
    serializer_class = ReviewSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        return Review.objects.all()
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_status = request.data.get('status')
        
        if new_status in ['approved', 'rejected', 'pending']:
            instance.status = new_status
            instance.save()
            
            # Update product rating if approved
            if new_status == 'approved':
                from apps.products.models import Product
                product = instance.product
                reviews = Review.objects.filter(product=product, status='approved')
                if reviews.exists():
                    from django.db.models import Avg
                    avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
                    product.rating = round(avg_rating, 2)
                    product.save()
            
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        
        return Response(
            {'error': 'Invalid status'},
            status=status.HTTP_400_BAD_REQUEST
        )

