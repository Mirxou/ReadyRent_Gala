"""
CMS models for ReadyRent.Gala
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.conf import settings


class Page(models.Model):
    """Static pages (About, Terms, Privacy, etc.)"""
    PAGE_TYPE_CHOICES = [
        ('about', _('About Us')),
        ('terms', _('Terms of Service')),
        ('privacy', _('Privacy Policy')),
        ('contact', _('Contact')),
        ('faq', _('FAQ')),
        ('custom', _('Custom Page')),
    ]
    
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('published', _('Published')),
        ('archived', _('Archived')),
    ]
    
    title = models.CharField(_('title'), max_length=200)
    title_ar = models.CharField(_('title (Arabic)'), max_length=200)
    slug = models.SlugField(_('slug'), unique=True)
    page_type = models.CharField(_('page type'), max_length=20, choices=PAGE_TYPE_CHOICES, default='custom')
    content = models.TextField(_('content'), blank=True)
    content_ar = models.TextField(_('content (Arabic)'), blank=True)
    meta_description = models.CharField(_('meta description'), max_length=255, blank=True)
    meta_description_ar = models.CharField(_('meta description (Arabic)'), max_length=255, blank=True)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(_('featured'), default=False)
    order = models.IntegerField(_('order'), default=0, help_text=_('Display order'))
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pages_created',
        verbose_name=_('created_by'))
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pages_updated',
        verbose_name=_('updated_by'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    published_at = models.DateTimeField(_('published at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('الصفحة')
        verbose_name_plural = _('الصفحات')
        ordering = ['order', 'title']
        indexes = [
            models.Index(fields=['slug', 'status']),
            models.Index(fields=['page_type', 'status']),
        ]
    
    def __str__(self):
        return self.title_ar or self.title


class BlogPost(models.Model):
    """Blog posts"""
    STATUS_CHOICES = [
        ('draft', _('Draft')),
        ('published', _('Published')),
        ('archived', _('Archived')),
    ]
    
    title = models.CharField(_('title'), max_length=200)
    title_ar = models.CharField(_('title (Arabic)'), max_length=200)
    slug = models.SlugField(_('slug'), unique=True)
    excerpt = models.TextField(_('excerpt'), max_length=500, blank=True)
    excerpt_ar = models.TextField(_('excerpt (Arabic)'), max_length=500, blank=True)
    content = models.TextField(_('content'))
    content_ar = models.TextField(_('content (Arabic)'))
    featured_image = models.ImageField(_('featured image'), upload_to='blog/', blank=True, null=True)
    meta_description = models.CharField(_('meta description'), max_length=255, blank=True)
    meta_description_ar = models.CharField(_('meta description (Arabic)'), max_length=255, blank=True)
    status = models.CharField(_('status'), max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField(_('featured'), default=False)
    view_count = models.IntegerField(_('view count'), default=0)
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='blog_posts',
        verbose_name=_('author'))
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    published_at = models.DateTimeField(_('published at'), null=True, blank=True)
    
    class Meta:
        verbose_name = _('مقال المدونة')
        verbose_name_plural = _('مقالات المدونة')
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['slug', 'status']),
            models.Index(fields=['status', 'published_at']),
        ]
    
    def __str__(self):
        return self.title_ar or self.title


class Banner(models.Model):
    """Banners and promotions"""
    BANNER_TYPE_CHOICES = [
        ('hero', _('Hero Banner')),
        ('promotion', _('Promotion')),
        ('announcement', _('Announcement')),
        ('sidebar', _('Sidebar')),
    ]
    
    POSITION_CHOICES = [
        ('home_top', _('Home Top')),
        ('home_middle', _('Home Middle')),
        ('home_bottom', _('Home Bottom')),
        ('products_top', _('Products Top')),
        ('sidebar', _('Sidebar')),
    ]
    
    title = models.CharField(_('title'), max_length=200)
    title_ar = models.CharField(_('title (Arabic)'), max_length=200)
    banner_type = models.CharField(_('banner type'), max_length=20, choices=BANNER_TYPE_CHOICES, default='promotion')
    position = models.CharField(_('position'), max_length=20, choices=POSITION_CHOICES, default='home_top')
    image = models.ImageField(_('image'), upload_to='banners/')
    link_url = models.URLField(_('link URL'), blank=True, null=True)
    link_text = models.CharField(_('link text'), max_length=100, blank=True)
    link_text_ar = models.CharField(_('link text (Arabic)'), max_length=100, blank=True)
    description = models.TextField(_('description'), blank=True)
    description_ar = models.TextField(_('description (Arabic)'), blank=True)
    is_active = models.BooleanField(_('active'), default=True)
    start_date = models.DateTimeField(_('start date'), null=True, blank=True)
    end_date = models.DateTimeField(_('end date'), null=True, blank=True)
    order = models.IntegerField(_('order'), default=0)
    click_count = models.IntegerField(_('click count'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('البانر')
        verbose_name_plural = _('البانرات')
        ordering = ['order', '-created_at']
        indexes = [
            models.Index(fields=['position', 'is_active']),
            models.Index(fields=['banner_type', 'is_active']),
        ]
    
    def __str__(self):
        return self.title_ar or self.title


class FAQ(models.Model):
    """Frequently Asked Questions"""
    CATEGORY_CHOICES = [
        ('general', _('General')),
        ('booking', _('Booking')),
        ('payment', _('Payment')),
        ('delivery', _('Delivery')),
        ('returns', _('Returns')),
        ('account', _('Account')),
        ('other', _('Other')),
    ]
    
    question = models.CharField(_('question'), max_length=500)
    question_ar = models.CharField(_('question (Arabic)'), max_length=500)
    answer = models.TextField(_('answer'))
    answer_ar = models.TextField(_('answer (Arabic)'))
    category = models.CharField(_('category'), max_length=20, choices=CATEGORY_CHOICES, default='general')
    is_featured = models.BooleanField(_('featured'), default=False)
    order = models.IntegerField(_('order'), default=0)
    view_count = models.IntegerField(_('view count'), default=0)
    helpful_count = models.IntegerField(_('helpful count'), default=0)
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        verbose_name = _('السؤال الشائع')
        verbose_name_plural = _('الأسئلة الشائعة')
        ordering = ['order', 'category', 'question']
        indexes = [
            models.Index(fields=['category', 'is_featured']),
        ]
    
    def __str__(self):
        return self.question_ar or self.question

