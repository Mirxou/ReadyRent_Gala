"""
Views for CMS app
"""
from rest_framework import viewsets, generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from django.utils import timezone
from .models import Page, BlogPost, Banner, FAQ
from .serializers import PageSerializer, BlogPostSerializer, BannerSerializer, FAQSerializer


class PageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pages"""
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['page_type', 'status', 'is_featured', 'slug']
    search_fields = ['title', 'title_ar', 'content', 'content_ar']
    ordering_fields = ['order', 'created_at', 'updated_at']
    ordering = ['order', 'title']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Public users can only see published pages
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='published')
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user, updated_by=self.request.user)
    
    def perform_update(self, serializer):
        serializer.save(updated_by=self.request.user)
        if serializer.validated_data.get('status') == 'published' and not serializer.instance.published_at:
            serializer.save(published_at=timezone.now())


class BlogPostViewSet(viewsets.ModelViewSet):
    """ViewSet for managing blog posts"""
    queryset = BlogPost.objects.select_related('author').all()
    serializer_class = BlogPostSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'is_featured', 'author']
    search_fields = ['title', 'title_ar', 'content', 'content_ar', 'excerpt', 'excerpt_ar']
    ordering_fields = ['created_at', 'updated_at', 'published_at', 'view_count']
    ordering = ['-published_at', '-created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Public users can only see published posts
        if not self.request.user.is_staff:
            queryset = queryset.filter(status='published')
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        if serializer.validated_data.get('status') == 'published':
            serializer.save(published_at=timezone.now())
    
    def perform_update(self, serializer):
        if serializer.validated_data.get('status') == 'published' and not serializer.instance.published_at:
            serializer.save(published_at=timezone.now())


class BannerViewSet(viewsets.ModelViewSet):
    """ViewSet for managing banners"""
    queryset = Banner.objects.all()
    serializer_class = BannerSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['banner_type', 'position', 'is_active']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Public users can only see active banners within date range
        if not self.request.user.is_staff:
            now = timezone.now()
            queryset = queryset.filter(
                is_active=True,
                start_date__lte=now,
                end_date__gte=now
            ) | queryset.filter(
                is_active=True,
                start_date__isnull=True,
                end_date__isnull=True
            )
        return queryset
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment click count if link_url is accessed
        if request.query_params.get('click') == 'true':
            instance.click_count += 1
            instance.save(update_fields=['click_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class FAQViewSet(viewsets.ModelViewSet):
    """ViewSet for managing FAQs"""
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_featured']
    search_fields = ['question', 'question_ar', 'answer', 'answer_ar']
    ordering_fields = ['order', 'created_at', 'view_count', 'helpful_count']
    ordering = ['order', 'category', 'question']
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Increment view count
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class MarkFAQHelpfulView(generics.GenericAPIView):
    """Mark FAQ as helpful"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, pk):
        try:
            faq = FAQ.objects.get(pk=pk)
            faq.helpful_count += 1
            faq.save(update_fields=['helpful_count'])
            return Response({'message': 'FAQ marked as helpful'})
        except FAQ.DoesNotExist:
            return Response(
                {'error': 'FAQ not found'},
                status=status.HTTP_404_NOT_FOUND
            )

