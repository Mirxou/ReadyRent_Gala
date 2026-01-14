"""
Unit tests for CMS models
"""
import pytest
from django.contrib.auth import get_user_model
from apps.cms.models import Page, BlogPost, Banner, FAQ

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestPageModel:
    """Test Page model"""
    
    def test_create_page(self, admin_user):
        """Test creating a page"""
        page = Page.objects.create(
            title='About Us',
            title_ar='من نحن',
            slug='about-us',
            page_type='about',
            content='About page content',
            content_ar='محتوى صفحة من نحن',
            status='published',
            created_by=admin_user,
            updated_by=admin_user
        )
        
        assert page.title == 'About Us'
        assert page.slug == 'about-us'
        assert page.status == 'published'
        assert page.created_by == admin_user
    
    def test_page_str(self, admin_user):
        """Test page string representation"""
        page = Page.objects.create(
            title='Test Page',
            title_ar='صفحة تجريبية',
            slug='test-page',
            created_by=admin_user
        )
        assert str(page) == 'صفحة تجريبية'


@pytest.mark.unit
@pytest.mark.django_db
class TestBlogPostModel:
    """Test BlogPost model"""
    
    def test_create_blog_post(self, admin_user):
        """Test creating a blog post"""
        post = BlogPost.objects.create(
            title='Test Post',
            title_ar='مقال تجريبي',
            slug='test-post',
            content='Blog post content',
            content_ar='محتوى المقال',
            author=admin_user,
            status='published'
        )
        
        assert post.title == 'Test Post'
        assert post.author == admin_user
        assert post.status == 'published'
    
    def test_blog_post_view_count(self, admin_user):
        """Test blog post view count"""
        post = BlogPost.objects.create(
            title='Test Post',
            title_ar='مقال تجريبي',
            slug='test-post',
            content='Content',
            content_ar='محتوى',
            author=admin_user
        )
        
        assert post.view_count == 0
        post.view_count += 1
        post.save()
        assert post.view_count == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestBannerModel:
    """Test Banner model"""
    
    def test_create_banner(self):
        """Test creating a banner"""
        banner = Banner.objects.create(
            title='Promotion',
            title_ar='عرض خاص',
            banner_type='promotion',
            position='home_top',
            is_active=True
        )
        
        assert banner.title == 'Promotion'
        assert banner.is_active
        assert banner.click_count == 0
    
    def test_banner_click_tracking(self):
        """Test banner click tracking"""
        banner = Banner.objects.create(
            title='Test Banner',
            title_ar='شعار تجريبي',
            banner_type='promotion',
            position='home_top'
        )
        
        banner.click_count += 1
        banner.save()
        assert banner.click_count == 1


@pytest.mark.unit
@pytest.mark.django_db
class TestFAQModel:
    """Test FAQ model"""
    
    def test_create_faq(self):
        """Test creating an FAQ"""
        faq = FAQ.objects.create(
            question='How do I book?',
            question_ar='كيف أحجز؟',
            answer='Use the booking form',
            answer_ar='استخدم نموذج الحجز',
            category='booking',
            is_featured=True
        )
        
        assert faq.question == 'How do I book?'
        assert faq.category == 'booking'
        assert faq.is_featured
        assert faq.view_count == 0
        assert faq.helpful_count == 0
    
    def test_faq_helpful_count(self):
        """Test FAQ helpful count"""
        faq = FAQ.objects.create(
            question='Test Question',
            question_ar='سؤال تجريبي',
            answer='Answer',
            answer_ar='إجابة'
        )
        
        faq.helpful_count += 1
        faq.save()
        assert faq.helpful_count == 1

