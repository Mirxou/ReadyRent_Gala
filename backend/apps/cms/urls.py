"""
URLs for CMS app
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    PageViewSet, BlogPostViewSet, BannerViewSet, FAQViewSet, MarkFAQHelpfulView
)

router = DefaultRouter()
router.register(r'pages', PageViewSet, basename='page')
router.register(r'blog', BlogPostViewSet, basename='blog-post')
router.register(r'banners', BannerViewSet, basename='banner')
router.register(r'faqs', FAQViewSet, basename='faq')

urlpatterns = [
    path('faqs/<int:pk>/helpful/', MarkFAQHelpfulView.as_view(), name='faq-helpful'),
    path('', include(router.urls)),
]

