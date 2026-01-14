from django.contrib import admin
from .models import Page, BlogPost, Banner, FAQ


@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ['title_ar', 'title', 'page_type', 'status', 'is_featured', 'order', 'created_at']
    list_filter = ['page_type', 'status', 'is_featured', 'created_at']
    search_fields = ['title', 'title_ar', 'slug', 'content', 'content_ar']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['created_at', 'updated_at', 'published_at']
    date_hierarchy = 'created_at'


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ['title_ar', 'title', 'status', 'is_featured', 'author', 'view_count', 'published_at']
    list_filter = ['status', 'is_featured', 'created_at', 'published_at']
    search_fields = ['title', 'title_ar', 'slug', 'content', 'content_ar']
    prepopulated_fields = {'slug': ('title',)}
    readonly_fields = ['view_count', 'created_at', 'updated_at', 'published_at']
    date_hierarchy = 'published_at'


@admin.register(Banner)
class BannerAdmin(admin.ModelAdmin):
    list_display = ['title_ar', 'title', 'banner_type', 'position', 'is_active', 'order', 'click_count']
    list_filter = ['banner_type', 'position', 'is_active', 'created_at']
    search_fields = ['title', 'title_ar', 'description', 'description_ar']
    readonly_fields = ['click_count', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'


@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question_ar', 'question', 'category', 'is_featured', 'order', 'view_count', 'helpful_count']
    list_filter = ['category', 'is_featured', 'created_at']
    search_fields = ['question', 'question_ar', 'answer', 'answer_ar']
    readonly_fields = ['view_count', 'helpful_count', 'created_at', 'updated_at']

