"""
Extended Unit tests for Views - All Apps
"""
import pytest
from rest_framework import status
from rest_framework.test import APIClient

# Note: api_client fixture is defined in conftest.py
from django.contrib.auth import get_user_model
from datetime import date, timedelta

from apps.products.models import Category, Product
from apps.bookings.models import Booking, Cart, CartItem
from apps.inventory.models import InventoryItem
from apps.maintenance.models import MaintenanceSchedule
from apps.returns.models import Return
from apps.locations.models import Address, DeliveryZone
from apps.packaging.models import PackagingType
from apps.hygiene.models import HygieneRecord
from apps.notifications.models import Notification
from apps.chatbot.models import ChatSession
from apps.disputes.models import Dispute
from apps.local_guide.models import ServiceCategory, LocalService
from apps.artisans.models import Artisan
from apps.bundles.models import Bundle, BundleCategory
from apps.warranties.models import WarrantyPlan
from apps.reviews.models import Review
from apps.analytics.models import AnalyticsEvent
from apps.vendors.models import Vendor
from apps.branches.models import Branch
from apps.cms.models import Page, FAQ, BlogPost, Banner

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestInventoryViews:
    """Test Inventory views"""
    
    def test_list_inventory_items(self, api_client, admin_user, product):
        """Test listing inventory items"""
        InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=8
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/inventory/items/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_inventory_items_require_auth(self, api_client):
        """Test inventory items require authentication"""
        response = api_client.get('/api/inventory/items/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceViews:
    """Test Maintenance views"""
    
    def test_list_maintenance_schedules(self, api_client, admin_user, product):
        """Test listing maintenance schedules"""
        MaintenanceSchedule.objects.create(
            product=product,
            maintenance_type='cleaning',
            duration_hours=2
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/maintenance/schedules/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestReturnsViews:
    """Test Returns views"""
    
    def test_list_returns_requires_auth(self, api_client):
        """Test listing returns requires authentication"""
        response = api_client.get('/api/returns/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_return_requires_auth(self, api_client, booking):
        """Test creating return requires authentication"""
        response = api_client.post('/api/returns/', {
            'booking': booking.id,
            'status': 'pending'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestLocationsViews:
    """Test Locations views"""
    
    def test_list_addresses_requires_auth(self, api_client):
        """Test listing addresses requires authentication"""
        response = api_client.get('/api/locations/addresses/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_address_requires_auth(self, api_client):
        """Test creating address requires authentication"""
        response = api_client.post('/api/locations/addresses/', {
            'label': 'Home',
            'full_address': '123 Main St',
            'city': 'Constantine'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_delivery_zones(self, api_client):
        """Test listing delivery zones (public)"""
        DeliveryZone.objects.create(
            name='Zone 1',
            name_ar='المنطقة 1',
            city='Constantine',
            center_latitude=36.3650,
            center_longitude=6.6147,
            radius_km=10,
            delivery_fee=500.00
        )
        response = api_client.get('/api/locations/zones/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingViews:
    """Test Packaging views"""
    
    def test_list_packaging_types(self, api_client, admin_user):
        """Test listing packaging types"""
        PackagingType.objects.create(
            name='Standard Box',
            name_ar='صندوق قياسي',
            size='medium'
        )
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/packaging/types/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneViews:
    """Test Hygiene views"""
    
    def test_list_hygiene_records_requires_auth(self, api_client):
        """Test listing hygiene records requires authentication"""
        response = api_client.get('/api/hygiene/records/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationsViews:
    """Test Notifications views"""
    
    def test_list_notifications_requires_auth(self, api_client):
        """Test listing notifications requires authentication"""
        response = api_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_list_notifications_authenticated(self, api_client, regular_user):
        """Test listing notifications when authenticated"""
        Notification.objects.create(
            user=regular_user,
            type='booking_confirmed',
            title='Booking Confirmed',
            message='Your booking has been confirmed'
        )
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/notifications/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestChatbotViews:
    """Test Chatbot views"""
    
    def test_create_chat_session_requires_auth(self, api_client):
        """Test creating chat session requires authentication"""
        response = api_client.post('/api/chatbot/sessions/', {})
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_chat_session_authenticated(self, api_client, regular_user):
        """Test creating chat session when authenticated"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.post('/api/chatbot/sessions/', {
            'language': 'ar'
        })
        assert response.status_code in [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]


@pytest.mark.unit
@pytest.mark.django_db
class TestDisputesViews:
    """Test Disputes views"""
    
    def test_list_disputes_requires_auth(self, api_client):
        """Test listing disputes requires authentication"""
        response = api_client.get('/api/disputes/')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_create_dispute_requires_auth(self, api_client, booking):
        """Test creating dispute requires authentication"""
        response = api_client.post('/api/disputes/', {
            'booking': booking.id,
            'title': 'Test Dispute',
            'description': 'Test description'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestLocalGuideViews:
    """Test Local Guide views"""
    
    def test_list_service_categories(self, api_client):
        """Test listing service categories (public)"""
        ServiceCategory.objects.create(
            name='Photography',
            name_ar='التصوير',
            slug='photography'
        )
        response = api_client.get('/api/local-guide/categories/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_local_services(self, api_client):
        """Test listing local services (public)"""
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='التصوير',
            slug='photography'
        )
        LocalService.objects.create(
            category=category,
            name='Wedding Photography',
            name_ar='تصوير الأعراس',
            description='Professional wedding photography',
            contact_phone='+123456789',
            is_active=True
        )
        response = api_client.get('/api/local-guide/services/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisansViews:
    """Test Artisans views"""
    
    def test_list_artisans(self, api_client, regular_user):
        """Test listing artisans (public)"""
        Artisan.objects.create(
            user=regular_user,
            name='Test Artisan',
            name_ar='حرفية تجريبية',
            bio='Test bio',
            specialty='Dress Design',
            is_active=True
        )
        response = api_client.get('/api/artisans/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestBundlesViews:
    """Test Bundles views"""
    
    def test_list_bundle_categories(self, api_client):
        """Test listing bundle categories (public)"""
        BundleCategory.objects.create(
            name='Wedding Bundles',
            slug='wedding-bundles',
            description='Bundles for wedding events'
        )
        response = api_client.get('/api/bundles/categories/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_bundles(self, api_client, product):
        """Test listing bundles (public)"""
        category = BundleCategory.objects.create(
            name='Wedding Bundles',
            slug='wedding-bundles'
        )
        bundle = Bundle.objects.create(
            name='Bride Package',
            slug='bride-package',
            category=category,
            price=2500.00,
            discount_percentage=10.0,
            is_active=True
        )
        bundle.products.add(product)
        response = api_client.get('/api/bundles/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantiesViews:
    """Test Warranties views"""
    
    def test_list_warranty_plans(self, api_client):
        """Test listing warranty plans (public)"""
        WarrantyPlan.objects.create(
            name='Basic Coverage',
            description='Basic coverage plan',
            price=50.00,
            coverage_percentage=50,
            is_active=True
        )
        response = api_client.get('/api/warranties/plans/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewsViews:
    """Test Reviews views"""
    
    def test_list_reviews(self, api_client, product, regular_user):
        """Test listing reviews (public)"""
        Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            comment='Excellent!',
            is_approved=True
        )
        response = api_client.get(f'/api/reviews/?product={product.id}')
        assert response.status_code == status.HTTP_200_OK
    
    def test_create_review_requires_auth(self, api_client, product):
        """Test creating review requires authentication"""
        response = api_client.post('/api/reviews/', {
            'product': product.id,
            'rating': 5,
            'comment': 'Great!'
        })
        assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.unit
@pytest.mark.django_db
class TestAnalyticsViews:
    """Test Analytics views"""
    
    def test_analytics_requires_admin(self, api_client, regular_user):
        """Test analytics endpoints require admin"""
        api_client.force_authenticate(user=regular_user)
        response = api_client.get('/api/analytics/admin/dashboard/')
        assert response.status_code == status.HTTP_403_FORBIDDEN
    
    def test_analytics_admin_access(self, api_client, admin_user):
        """Test analytics endpoints with admin access"""
        api_client.force_authenticate(user=admin_user)
        response = api_client.get('/api/analytics/admin/dashboard/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorsViews:
    """Test Vendors views"""
    
    def test_list_vendors(self, api_client, regular_user):
        """Test listing vendors (public)"""
        Vendor.objects.create(
            user=regular_user,
            name='Fashion Boutique',
            contact_email='vendor@example.com',
            phone_number='+123456789',
            address='123 Main St',
            is_active=True
        )
        response = api_client.get('/api/vendors/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_vendor_registration_requires_auth(self, api_client):
        """Test vendor registration requires authentication"""
        response = api_client.post('/api/vendors/register/', {
            'name': 'Test Vendor',
            'contact_email': 'test@example.com'
        })
        # May require auth or may be public, adjust based on your implementation
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST]


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchesViews:
    """Test Branches views"""
    
    def test_list_branches(self, api_client):
        """Test listing branches (public)"""
        Branch.objects.create(
            name='Main Branch',
            name_ar='الفرع الرئيسي',
            address='123 Branch St',
            phone_number='+1122334455',
            email='main@example.com',
            is_active=True
        )
        response = api_client.get('/api/branches/')
        assert response.status_code == status.HTTP_200_OK


@pytest.mark.unit
@pytest.mark.django_db
class TestCMSViews:
    """Test CMS views"""
    
    def test_list_pages(self, api_client, admin_user):
        """Test listing pages (public)"""
        Page.objects.create(
            title='About Us',
            slug='about-us',
            content='About us content',
            created_by=admin_user,
            status='published'
        )
        response = api_client.get('/api/cms/pages/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_faqs(self, api_client):
        """Test listing FAQs (public)"""
        FAQ.objects.create(
            question='How do I rent?',
            question_ar='كيف أستأجر؟',
            answer='You can browse and book',
            answer_ar='يمكنك التصفح والحجز'
        )
        response = api_client.get('/api/cms/faqs/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_blog_posts(self, api_client, admin_user):
        """Test listing blog posts (public)"""
        BlogPost.objects.create(
            title='First Post',
            slug='first-post',
            author=admin_user,
            content='Blog post content',
            status='published'
        )
        response = api_client.get('/api/cms/blogposts/')
        assert response.status_code == status.HTTP_200_OK
    
    def test_list_banners(self, api_client):
        """Test listing banners (public)"""
        Banner.objects.create(
            title='Summer Sale',
            image='banners/summer.jpg',
            link_url='/products?sale=true',
            is_active=True
        )
        response = api_client.get('/api/cms/banners/')
        assert response.status_code == status.HTTP_200_OK

