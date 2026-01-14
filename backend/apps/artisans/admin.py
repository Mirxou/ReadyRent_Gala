from django.contrib import admin
from django.utils.translation import gettext_lazy as _
from .models import Artisan, ArtisanPortfolio, ArtisanReview


class ArtisanPortfolioInline(admin.TabularInline):
    model = ArtisanPortfolio
    extra = 1


class ArtisanReviewInline(admin.TabularInline):
    model = ArtisanReview
    extra = 0
    readonly_fields = ['created_at']


@admin.register(Artisan)
class ArtisanAdmin(admin.ModelAdmin):
    list_display = ['name_ar', 'specialty', 'city', 'rating', 'is_featured', 'is_verified', 'is_active']
    list_filter = ['specialty', 'city', 'is_featured', 'is_verified', 'is_active']
    search_fields = ['name', 'name_ar', 'phone', 'email']
    readonly_fields = ['rating', 'review_count', 'project_count', 'created_at', 'updated_at']
    inlines = [ArtisanPortfolioInline, ArtisanReviewInline]
    
    fieldsets = (
        (_('User'), {
            'fields': ('user',)
        }),
        (_('Basic Info'), {
            'fields': ('name', 'name_ar', 'specialty', 'bio', 'bio_ar')
        }),
        (_('Contact'), {
            'fields': ('phone', 'email', 'whatsapp', 'instagram', 'facebook')
        }),
        (_('Location'), {
            'fields': ('address', 'city', 'latitude', 'longitude')
        }),
        (_('Media'), {
            'fields': ('profile_image', 'cover_image', 'portfolio_description')
        }),
        (_('Status'), {
            'fields': ('is_featured', 'is_verified', 'is_active', 'rating', 'review_count', 'project_count')
        }),
        (_('Timestamps'), {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(ArtisanReview)
class ArtisanReviewAdmin(admin.ModelAdmin):
    list_display = ['artisan', 'user', 'rating', 'is_verified', 'created_at']
    list_filter = ['rating', 'is_verified', 'created_at']
    search_fields = ['artisan__name', 'user__email', 'comment']
    readonly_fields = ['created_at', 'updated_at']

