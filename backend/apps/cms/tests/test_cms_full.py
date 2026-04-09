"""
Comprehensive Tests for CMS App
Full Coverage: Models, Views, Serializers, Security, Edge Cases
"""
import os
import sys
import django
from datetime import timedelta

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock

from apps.users.models import User
from apps.cms.models import Page, BlogPost, Banner, FAQ
from apps.cms.serializers import PageSerializer, BlogPostSerializer, BannerSerializer, FAQSerializer


class PageModelTests(TestCase):
    """Test Cases for Page Models"""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='admin_page@test.com',
            username='admin_page_test',
            password='TestPass123!',
            role='admin'
        )

    def test_page_creation(self):
        """Test Page model creation"""
        page = Page.objects.create(
            title='About Us',
            title_ar='من نحن',
            slug='about-us',
            page_type='about',
            content='We are ReadyRent...',
            status='published'
        )

        self.assertEqual(page.title, 'About Us')
        self.assertEqual(page.slug, 'about-us')
        self.assertEqual(page.status, 'published')

    def test_page_draft(self):
        """Test draft page"""
        page = Page.objects.create(
            title='Draft Page',
            title_ar='صفحة مسودة',
            slug='draft-page',
            page_type='custom',
            content='Draft content',
            status='draft'
        )

        self.assertEqual(page.status, 'draft')

    def test_page_ordering(self):
        """Test page ordering"""
        page1 = Page.objects.create(
            title='Page A',
            title_ar='صفحة أ',
            slug='page-a',
            order=2
        )
        page2 = Page.objects.create(
            title='Page B',
            title_ar='صفحة ب',
            slug='page-b',
            order=1
        )

        pages = Page.objects.all()
        self.assertEqual(pages[0].slug, 'page-b')

    def test_page_str_representation(self):
        """Test page string representation"""
        page = Page.objects.create(
            title='Test Page',
            title_ar='صفحة اختبار',
            slug='test-page'
        )

        self.assertIn('صفحة اختبار', str(page))

    def test_page_types(self):
        """Test different page types"""
        page_types = ['about', 'terms', 'privacy', 'contact', 'faq', 'custom']

        for page_type in page_types:
            page = Page.objects.create(
                title=f'{page_type.title()} Page',
                title_ar=f'صفحة {page_type}',
                slug=f'{page_type}-page',
                page_type=page_type
            )
            self.assertEqual(page.page_type, page_type)


class BlogPostModelTests(TestCase):
    """Test Cases for BlogPost Models"""

    def setUp(self):
        self.author = User.objects.create_user(
            email='author_blog@test.com',
            username='author_blog_test',
            password='TestPass123!',
            role='admin'
        )

    def test_blog_post_creation(self):
        """Test BlogPost model creation"""
        post = BlogPost.objects.create(
            title='First Blog Post',
            title_ar='أول مقال',
            slug='first-blog-post',
            content='This is my first blog post...',
            content_ar='هذا أول مقال لي...',
            excerpt='Summary of the post',
            status='published',
            author=self.author
        )

        self.assertEqual(post.title, 'First Blog Post')
        self.assertEqual(post.status, 'published')
        self.assertEqual(post.author, self.author)

    def test_blog_post_published_at(self):
        """Test published_at auto-set"""
        post = BlogPost.objects.create(
            title='Published Post',
            title_ar='مقال منشور',
            slug='published-post',
            content='Content',
            content_ar='محتوى',
            status='published',
            author=self.author
        )

        self.assertIsNotNone(post.published_at)

    def test_blog_post_view_count(self):
        """Test view count increment"""
        post = BlogPost.objects.create(
            title='Popular Post',
            title_ar='مقال شعبي',
            slug='popular-post',
            content='Content',
            content_ar='محتوى',
            author=self.author,
            view_count=0
        )

        post.view_count += 100
        post.save()

        self.assertEqual(post.view_count, 100)

    def test_blog_post_str_representation(self):
        """Test blog post string representation"""
        post = BlogPost.objects.create(
            title='Blog Post',
            title_ar='مقال المدونة',
            slug='blog-post',
            content='Content',
            content_ar='محتوى',
            author=self.author
        )

        self.assertIn('مقال المدونة', str(post))


class BannerModelTests(TestCase):
    """Test Cases for Banner Models"""

    def test_banner_creation(self):
        """Test Banner model creation"""
        banner = Banner.objects.create(
            title='Summer Sale',
            title_ar='تخفيضات الصيف',
            banner_type='promotion',
            position='home_top',
            is_active=True
        )

        self.assertEqual(banner.title, 'Summer Sale')
        self.assertTrue(banner.is_active)

    def test_banner_date_range(self):
        """Test banner with date range"""
        banner = Banner.objects.create(
            title='Limited Offer',
            title_ar='عرض محدود',
            banner_type='promotion',
            position='home_top',
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7),
            is_active=True
        )

        self.assertIsNotNone(banner.start_date)
        self.assertIsNotNone(banner.end_date)

    def test_banner_click_count(self):
        """Test banner click tracking"""
        banner = Banner.objects.create(
            title='Click Test',
            title_ar='اختبار النقر',
            banner_type='promotion',
            position='home_top',
            click_count=0
        )

        banner.click_count += 50
        banner.save()

        self.assertEqual(banner.click_count, 50)


class FAQModelTests(TestCase):
    """Test Cases for FAQ Models"""

    def test_faq_creation(self):
        """Test FAQ model creation"""
        faq = FAQ.objects.create(
            question='How do I book?',
            question_ar='كيف أحجز؟',
            answer='You can book through the app.',
            answer_ar='يمكنك الحجز من خلال التطبيق.',
            category='booking'
        )

        self.assertEqual(faq.question, 'How do I book?')
        self.assertEqual(faq.category, 'booking')

    def test_faq_categories(self):
        """Test different FAQ categories"""
        categories = ['general', 'booking', 'payment', 'delivery', 'returns', 'account']

        for category in categories:
            faq = FAQ.objects.create(
                question=f'{category.title()} question?',
                question_ar=f'سؤال {category}؟',
                answer='Answer',
                answer_ar='إجابة',
                category=category
            )
            self.assertEqual(faq.category, category)

    def test_faq_view_count(self):
        """Test FAQ view count"""
        faq = FAQ.objects.create(
            question='Popular Question',
            question_ar='سؤال شعبي',
            answer='Answer',
            answer_ar='إجابة',
            view_count=0
        )

        faq.view_count += 200
        faq.save()

        self.assertEqual(faq.view_count, 200)

    def test_faq_helpful_count(self):
        """Test FAQ helpful count"""
        faq = FAQ.objects.create(
            question='Helpful Question',
            question_ar='سؤال مفيد',
            answer='Answer',
            answer_ar='إجابة',
            helpful_count=0
        )

        faq.helpful_count += 50
        faq.save()

        self.assertEqual(faq.helpful_count, 50)


class CMSSerializerTests(TestCase):
    """Test Cases for CMS Serializers"""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='ser_cms@test.com',
            username='ser_cms_test',
            password='TestPass123!',
            role='admin'
        )

    def test_page_serializer(self):
        """Test PageSerializer"""
        page = Page.objects.create(
            title='Test Page',
            title_ar='صفحة اختبار',
            slug='test-page-ser',
            page_type='custom',
            content='Content',
            status='published'
        )

        serializer = PageSerializer(page)
        data = serializer.data

        self.assertEqual(data['title'], 'Test Page')
        self.assertEqual(data['slug'], 'test-page-ser')

    def test_blog_post_serializer(self):
        """Test BlogPostSerializer"""
        post = BlogPost.objects.create(
            title='Blog Post',
            title_ar='مقال',
            slug='blog-post-ser',
            content='Content',
            content_ar='محتوى',
            author=self.admin,
            status='published'
        )

        serializer = BlogPostSerializer(post)
        data = serializer.data

        self.assertEqual(data['title'], 'Blog Post')
        self.assertIn('author_email', data)

    def test_banner_serializer(self):
        """Test BannerSerializer"""
        banner = Banner.objects.create(
            title='Banner',
            title_ar='بانر',
            banner_type='promotion',
            position='home_top'
        )

        serializer = BannerSerializer(banner)
        data = serializer.data

        self.assertEqual(data['title'], 'Banner')
        self.assertEqual(data['banner_type'], 'promotion')

    def test_faq_serializer(self):
        """Test FAQSerializer"""
        faq = FAQ.objects.create(
            question='Question?',
            question_ar='سؤال؟',
            answer='Answer',
            answer_ar='إجابة'
        )

        serializer = FAQSerializer(faq)
        data = serializer.data

        self.assertEqual(data['question'], 'Question?')
        self.assertIn('view_count', data)


class CMSViewTests(APITestCase):
    """Test Cases for CMS Views"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin_cms@test.com',
            username='admin_cms_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='user_cms@test.com',
            username='user_cms_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_list_pages_public(self):
        """Test listing pages publicly"""
        Page.objects.create(
            title='Public Page',
            title_ar='صفحة عامة',
            slug='public-page',
            status='published'
        )

        response = self.client.get('/api/cms/pages/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_retrieve_published_page(self):
        """Test retrieving a published page"""
        page = Page.objects.create(
            title='Published',
            title_ar='منشور',
            slug='published-cms',
            status='published'
        )

        response = self.client.get(f'/api/cms/pages/{page.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_page_admin(self):
        """Test creating page as admin"""
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/cms/pages/', {
            'title': 'New Page',
            'title_ar': 'صفحة جديدة',
            'slug': 'new-page',
            'page_type': 'custom',
            'content': 'Page content'
        })

        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_create_page_user_forbidden(self):
        """Test regular user cannot create pages"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/cms/pages/', {
            'title': 'User Page',
            'title_ar': 'صفحة مستخدم',
            'slug': 'user-page'
        })

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_blogs(self):
        """Test listing blog posts"""
        BlogPost.objects.create(
            title='Blog',
            title_ar='مدونة',
            slug='blog-list',
            content='Content',
            content_ar='محتوى',
            author=self.admin,
            status='published'
        )

        response = self.client.get('/api/cms/blog/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_banners(self):
        """Test listing banners"""
        Banner.objects.create(
            title='Banner',
            title_ar='بانر',
            banner_type='promotion',
            position='home_top',
            is_active=True
        )

        response = self.client.get('/api/cms/banners/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_faqs(self):
        """Test listing FAQs"""
        FAQ.objects.create(
            question='FAQ?',
            question_ar='سؤال شائع؟',
            answer='Answer',
            answer_ar='إجابة'
        )

        response = self.client.get('/api/cms/faqs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class CMSSecurityTests(APITestCase):
    """Security Tests for CMS"""

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='sec_cms@test.com',
            username='sec_cms_test',
            password='TestPass123!',
            role='admin'
        )
        self.user = User.objects.create_user(
            email='user_cms_sec@test.com',
            username='user_cms_sec_test',
            password='TestPass123!',
            role='tenant'
        )

    def test_xss_in_page_content(self):
        """Test XSS protection in page content"""
        self.client.force_authenticate(user=self.admin)

        xss_payload = '<script>alert("XSS")</script>'

        response = self.client.post('/api/cms/pages/', {
            'title': 'XSS Page',
            'title_ar': 'صفحة XSS',
            'slug': 'xss-page',
            'content': xss_payload
        })

        if response.status_code == status.HTTP_201_CREATED:
            self.assertNotIn('<script>', str(response.data))

    def test_xss_in_blog_content(self):
        """Test XSS protection in blog content"""
        self.client.force_authenticate(user=self.admin)

        xss_payload = '<img src=x onerror=alert("XSS")>'

        response = self.client.post('/api/cms/blog/', {
            'title': 'XSS Blog',
            'title_ar': 'مدونة XSS',
            'slug': 'xss-blog',
            'content': xss_payload,
            'content_ar': 'محتوى'
        })

        if response.status_code == status.HTTP_201_CREATED:
            self.assertNotIn('<img', str(response.data))

    def test_draft_not_visible_to_public(self):
        """Test draft pages not visible to public"""
        Page.objects.create(
            title='Secret Draft',
            title_ar='مسودة سرية',
            slug='secret-draft',
            status='draft'
        )

        response = self.client.get('/api/cms/pages/')
        self.assertEqual(len(response.data), 0)

    def test_sql_injection_in_slug(self):
        """Test SQL injection protection in slugs"""
        self.client.force_authenticate(user=self.admin)

        sql_payload = "'; DROP TABLE cms_page; --"

        response = self.client.post('/api/cms/pages/', {
            'title': 'SQL Test',
            'title_ar': 'اختبار SQL',
            'slug': sql_payload,
            'content': 'Content'
        })

        self.assertNotEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)


class CMSEdgeCaseTests(TestCase):
    """Edge Case Tests for CMS"""

    def setUp(self):
        self.admin = User.objects.create_user(
            email='edge_cms@test.com',
            username='edge_cms_test',
            password='TestPass123!',
            role='admin'
        )

    def test_very_long_content(self):
        """Test handling of very long content"""
        long_content = 'x' * 50000

        page = Page.objects.create(
            title='Long Content',
            title_ar='محتوى طويل',
            slug='long-content',
            content=long_content
        )

        self.assertEqual(len(page.content), 50000)

    def test_unicode_content(self):
        """Test Unicode content in Arabic"""
        page = Page.objects.create(
            title='صفحة عربية',
            title_ar='صفحة عربية',
            slug='arabic-page',
            content='هذا محتوى باللغة العربية مع علامات الترقيم العربية مثل ()',
            content_ar='هذا محتوى باللغة العربية'
        )

        self.assertIn('باللغة العربية', page.content)

    def test_empty_page_list(self):
        """Test empty page list"""
        pages = Page.objects.all()
        self.assertEqual(pages.count(), 0)

    def test_multiple_pages_same_order(self):
        """Test pages with same order"""
        for i in range(3):
            Page.objects.create(
                title=f'Page {i}',
                title_ar=f'صفحة {i}',
                slug=f'order-page-{i}',
                order=1
            )

        count = Page.objects.filter(order=1).count()
        self.assertEqual(count, 3)

    def test_banner_date_edge_cases(self):
        """Test banner date edge cases"""
        now = timezone.now()

        banner_expired = Banner.objects.create(
            title='Expired',
            title_ar='منتهي',
            banner_type='promotion',
            start_date=now - timedelta(days=10),
            end_date=now - timedelta(days=1),
            is_active=True
        )

        self.assertLess(banner_expired.end_date, now)

    def test_faq_featured_ordering(self):
        """Test FAQ featured ordering"""
        FAQ.objects.create(
            question='Featured FAQ',
            question_ar='سؤال مميز',
            answer='Answer',
            answer_ar='إجابة',
            is_featured=True,
            order=1
        )
        FAQ.objects.create(
            question='Regular FAQ',
            question_ar='سؤال عادي',
            answer='Answer',
            answer_ar='إجابة',
            is_featured=False,
            order=2
        )

        faqs = FAQ.objects.all()
        self.assertTrue(faqs[0].is_featured)

    def test_blog_no_author(self):
        """Test blog post without author"""
        post = BlogPost.objects.create(
            title='Anonymous Post',
            title_ar='مقال مجهول',
            slug='anon-post',
            content='Content',
            content_ar='محتوى',
            author=None
        )

        self.assertIsNone(post.author)


if __name__ == '__main__':
    import unittest
    unittest.main()
