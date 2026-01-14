"""
Serializers for CMS app
"""
from rest_framework import serializers
from .models import Page, BlogPost, Banner, FAQ


class PageSerializer(serializers.ModelSerializer):
    """Serializer for Page"""
    created_by_email = serializers.EmailField(source='created_by.email', read_only=True)
    updated_by_email = serializers.EmailField(source='updated_by.email', read_only=True)
    
    class Meta:
        model = Page
        fields = [
            'id', 'title', 'title_ar', 'slug', 'page_type', 'content', 'content_ar',
            'meta_description', 'meta_description_ar', 'status', 'is_featured', 'order',
            'created_by', 'created_by_email', 'updated_by', 'updated_by_email',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BlogPostSerializer(serializers.ModelSerializer):
    """Serializer for BlogPost"""
    author_email = serializers.EmailField(source='author.email', read_only=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'title_ar', 'slug', 'excerpt', 'excerpt_ar', 'content', 'content_ar',
            'featured_image', 'meta_description', 'meta_description_ar', 'status',
            'is_featured', 'view_count', 'author', 'author_email',
            'created_at', 'updated_at', 'published_at'
        ]
        read_only_fields = ['id', 'view_count', 'created_at', 'updated_at']


class BannerSerializer(serializers.ModelSerializer):
    """Serializer for Banner"""
    
    class Meta:
        model = Banner
        fields = [
            'id', 'title', 'title_ar', 'banner_type', 'position', 'image', 'link_url',
            'link_text', 'link_text_ar', 'description', 'description_ar', 'is_active',
            'start_date', 'end_date', 'order', 'click_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'click_count', 'created_at', 'updated_at']


class FAQSerializer(serializers.ModelSerializer):
    """Serializer for FAQ"""
    
    class Meta:
        model = FAQ
        fields = [
            'id', 'question', 'question_ar', 'answer', 'answer_ar', 'category',
            'is_featured', 'order', 'view_count', 'helpful_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'helpful_count', 'created_at', 'updated_at']

