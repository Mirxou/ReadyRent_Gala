"""
Extended Unit tests for Serializers - All Apps
"""
import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.bookings.serializers import (
    BookingSerializer, CartSerializer, CartItemSerializer, WaitlistSerializer,
    DamageAssessmentSerializer, DamagePhotoSerializer, InspectionChecklistSerializer,
    DamageClaimSerializer, RefundSerializer, CancellationSerializer
)
from apps.inventory.serializers import (
    InventoryItemSerializer, StockAlertSerializer, StockMovementSerializer
)
from apps.maintenance.serializers import (
    MaintenanceScheduleSerializer, MaintenanceRecordSerializer, MaintenancePeriodSerializer
)
from apps.returns.serializers import (
    ReturnSerializer, ReturnItemSerializer
)
from apps.locations.serializers import (
    AddressSerializer, DeliveryZoneSerializer, DeliveryRequestSerializer, DeliveryTrackingSerializer
)
from apps.packaging.serializers import (
    PackagingTypeSerializer, PackagingMaterialSerializer, PackagingRuleSerializer,
    PackagingInstanceSerializer, PackagingMaterialUsageSerializer
)
from apps.hygiene.serializers import (
    HygieneRecordSerializer, HygieneChecklistSerializer, HygieneCertificateSerializer
)
from apps.notifications.serializers import NotificationSerializer
from apps.chatbot.serializers import (
    ChatSessionSerializer, ChatMessageSerializer, ChatIntentSerializer, ChatbotConfigurationSerializer
)
from apps.disputes.serializers import (
    DisputeSerializer, DisputeMessageSerializer, SupportTicketSerializer, TicketMessageSerializer
)
from apps.local_guide.serializers import (
    ServiceCategorySerializer, LocalServiceSerializer, EventSerializer
)
from apps.artisans.serializers import (
    ArtisanSerializer, ArtisanProductSerializer, ArtisanPortfolioSerializer, ArtisanReviewSerializer
)
from apps.bundles.serializers import (
    BundleSerializer, BundleItemSerializer, BundleCategorySerializer
)
from apps.warranties.serializers import (
    WarrantyPlanSerializer, WarrantyPurchaseSerializer, WarrantyClaimSerializer, InsurancePlanSerializer
)
from apps.reviews.serializers import (
    ReviewSerializer, ReviewImageSerializer, ReviewCreateSerializer
)
from apps.analytics.serializers import (
    AnalyticsEventSerializer, ProductAnalyticsSerializer, DailyAnalyticsSerializer, UserBehaviorSerializer
)
from apps.vendors.serializers import (
    VendorSerializer, VendorProductSerializer, CommissionSerializer, VendorPerformanceSerializer
)
from apps.branches.serializers import (
    BranchSerializer, BranchInventorySerializer, BranchStaffSerializer, BranchPerformanceSerializer
)
from apps.cms.serializers import (
    PageSerializer, BlogPostSerializer, BannerSerializer, FAQSerializer
)

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestBookingSerializers:
    """Test Booking serializers"""
    
    def test_booking_serializer_validation(self, regular_user, product):
        """Test BookingSerializer validation"""
        data = {
            'product_id': product.id,
            'start_date': date.today() + timedelta(days=1),
            'end_date': date.today() + timedelta(days=3),
        }
        serializer = BookingSerializer(data=data)
        assert serializer.is_valid()
    
    def test_booking_serializer_invalid_dates(self, product):
        """Test BookingSerializer with invalid dates"""
        data = {
            'product_id': product.id,
            'start_date': date.today() + timedelta(days=3),
            'end_date': date.today() + timedelta(days=1),  # End before start
        }
        serializer = BookingSerializer(data=data)
        assert not serializer.is_valid()
        assert 'end_date' in serializer.errors
    
    def test_cart_serializer(self, regular_user):
        """Test CartSerializer"""
        from apps.bookings.models import Cart
        cart = Cart.objects.create(user=regular_user)
        serializer = CartSerializer(instance=cart)
        assert 'items' in serializer.data
        assert 'total_price' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestInventorySerializers:
    """Test Inventory serializers"""
    
    def test_inventory_item_serializer(self, product):
        """Test InventoryItemSerializer"""
        from apps.inventory.models import InventoryItem
        item = InventoryItem.objects.create(
            product=product,
            quantity_total=10,
            quantity_available=8,
            low_stock_threshold=2
        )
        serializer = InventoryItemSerializer(instance=item)
        assert serializer.data['product_name'] == product.name_ar
        assert serializer.data['availability_status'] in ['available', 'low_stock', 'out_of_stock']


@pytest.mark.unit
@pytest.mark.django_db
class TestMaintenanceSerializers:
    """Test Maintenance serializers"""
    
    def test_maintenance_schedule_serializer(self, product):
        """Test MaintenanceScheduleSerializer"""
        from apps.maintenance.models import MaintenanceSchedule
        schedule = MaintenanceSchedule.objects.create(
            product=product,
            maintenance_type='cleaning',
            duration_hours=2,
            required_between_rentals=True
        )
        serializer = MaintenanceScheduleSerializer(instance=schedule)
        assert serializer.data['product_name'] == product.name_ar


@pytest.mark.unit
@pytest.mark.django_db
class TestReturnsSerializers:
    """Test Returns serializers"""
    
    def test_return_serializer(self, booking):
        """Test ReturnSerializer"""
        from apps.returns.models import Return
        return_obj = Return.objects.create(
            booking=booking,
            status='pending',
            requested_at=date.today()
        )
        serializer = ReturnSerializer(instance=return_obj)
        assert 'booking_details' in serializer.data
        assert serializer.data['is_late'] is False or serializer.data['is_late'] is True


@pytest.mark.unit
@pytest.mark.django_db
class TestLocationsSerializers:
    """Test Locations serializers"""
    
    def test_address_serializer_validation(self, regular_user):
        """Test AddressSerializer validation"""
        # Valid data
        data = {
            'user': regular_user.id,
            'label': 'Home',
            'full_address': '123 Main St',
            'city': 'Constantine',
            'latitude': 36.3650,
            'longitude': 6.6147
        }
        serializer = AddressSerializer(data=data)
        assert serializer.is_valid()
    
    def test_address_serializer_invalid_coords(self, regular_user):
        """Test AddressSerializer with invalid coordinates"""
        data = {
            'user': regular_user.id,
            'label': 'Home',
            'full_address': '123 Main St',
            'city': 'Constantine',
            'latitude': 36.3650,
            # Missing longitude
        }
        serializer = AddressSerializer(data=data)
        assert not serializer.is_valid()


@pytest.mark.unit
@pytest.mark.django_db
class TestPackagingSerializers:
    """Test Packaging serializers"""
    
    def test_packaging_type_serializer(self):
        """Test PackagingTypeSerializer"""
        from apps.packaging.models import PackagingType
        pkg_type = PackagingType.objects.create(
            name='Standard Box',
            name_ar='صندوق قياسي',
            size='medium',
            dimensions_length=50,
            dimensions_width=40,
            dimensions_height=30
        )
        serializer = PackagingTypeSerializer(instance=pkg_type)
        assert serializer.data['name'] == 'Standard Box'


@pytest.mark.unit
@pytest.mark.django_db
class TestHygieneSerializers:
    """Test Hygiene serializers"""
    
    def test_hygiene_record_serializer(self, product, admin_user):
        """Test HygieneRecordSerializer"""
        from apps.hygiene.models import HygieneRecord
        record = HygieneRecord.objects.create(
            product=product,
            cleaning_type='deep',
            status='completed',
            cleaned_by=admin_user,
            scheduled_date=date.today()
        )
        serializer = HygieneRecordSerializer(instance=record)
        assert serializer.data['product_name'] == product.name_ar
        assert 'is_overdue' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestNotificationsSerializers:
    """Test Notifications serializers"""
    
    def test_notification_serializer(self, regular_user):
        """Test NotificationSerializer"""
        from apps.notifications.models import Notification
        notification = Notification.objects.create(
            user=regular_user,
            type='booking_confirmed',
            title='Booking Confirmed',
            message='Your booking has been confirmed'
        )
        serializer = NotificationSerializer(instance=notification)
        assert serializer.data['type'] == 'booking_confirmed'
        assert serializer.data['is_read'] is False


@pytest.mark.unit
@pytest.mark.django_db
class TestChatbotSerializers:
    """Test Chatbot serializers"""
    
    def test_chat_session_serializer(self, regular_user):
        """Test ChatSessionSerializer"""
        from apps.chatbot.models import ChatSession
        session = ChatSession.objects.create(
            user=regular_user,
            status='active',
            language='ar'
        )
        serializer = ChatSessionSerializer(instance=session)
        assert serializer.data['user_email'] == regular_user.email
        assert 'message_count' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestDisputesSerializers:
    """Test Disputes serializers"""
    
    def test_dispute_serializer(self, regular_user, booking):
        """Test DisputeSerializer"""
        from apps.disputes.models import Dispute
        dispute = Dispute.objects.create(
            user=regular_user,
            booking=booking,
            title='Test Dispute',
            description='Test description',
            status='open',
            priority='medium'
        )
        serializer = DisputeSerializer(instance=dispute)
        assert serializer.data['user_email'] == regular_user.email
        assert 'message_count' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestLocalGuideSerializers:
    """Test Local Guide serializers"""
    
    def test_service_category_serializer(self):
        """Test ServiceCategorySerializer"""
        from apps.local_guide.models import ServiceCategory
        category = ServiceCategory.objects.create(
            name='Photography',
            name_ar='التصوير',
            slug='photography'
        )
        serializer = ServiceCategorySerializer(instance=category)
        assert serializer.data['name'] == 'Photography'


@pytest.mark.unit
@pytest.mark.django_db
class TestArtisansSerializers:
    """Test Artisans serializers"""
    
    def test_artisan_serializer(self, regular_user):
        """Test ArtisanSerializer"""
        from apps.artisans.models import Artisan
        artisan = Artisan.objects.create(
            user=regular_user,
            name='Test Artisan',
            name_ar='حرفية تجريبية',
            bio='Test bio',
            specialty='Dress Design'
        )
        serializer = ArtisanSerializer(instance=artisan)
        assert serializer.data['name'] == 'Test Artisan'
        assert 'rating' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestBundlesSerializers:
    """Test Bundles serializers"""
    
    def test_bundle_serializer(self, product):
        """Test BundleSerializer"""
        from apps.bundles.models import Bundle, BundleCategory
        category = BundleCategory.objects.create(
            name='Wedding Bundles',
            slug='wedding-bundles'
        )
        bundle = Bundle.objects.create(
            name='Bride Package',
            slug='bride-package',
            category=category,
            price=2500.00,
            discount_percentage=10.0
        )
        bundle.products.add(product)
        serializer = BundleSerializer(instance=bundle)
        assert serializer.data['name'] == 'Bride Package'
        assert 'total_bookings' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestWarrantiesSerializers:
    """Test Warranties serializers"""
    
    def test_warranty_plan_serializer(self):
        """Test WarrantyPlanSerializer"""
        from apps.warranties.models import WarrantyPlan
        plan = WarrantyPlan.objects.create(
            name='Basic Coverage',
            description='Basic coverage plan',
            price=50.00,
            coverage_percentage=50
        )
        serializer = WarrantyPlanSerializer(instance=plan)
        assert serializer.data['name'] == 'Basic Coverage'
        assert serializer.data['price'] == '50.00'


@pytest.mark.unit
@pytest.mark.django_db
class TestReviewsSerializers:
    """Test Reviews serializers"""
    
    def test_review_serializer(self, regular_user, product):
        """Test ReviewSerializer"""
        from apps.reviews.models import Review
        review = Review.objects.create(
            user=regular_user,
            product=product,
            rating=5,
            comment='Excellent!',
            is_approved=True
        )
        serializer = ReviewSerializer(instance=review)
        assert serializer.data['rating'] == 5
        assert 'helpful_count' in serializer.data


@pytest.mark.unit
@pytest.mark.django_db
class TestAnalyticsSerializers:
    """Test Analytics serializers"""
    
    def test_analytics_event_serializer(self, regular_user):
        """Test AnalyticsEventSerializer"""
        from apps.analytics.models import AnalyticsEvent
        event = AnalyticsEvent.objects.create(
            user=regular_user,
            event_type='page_view',
            event_name='homepage_view',
            metadata={'page': 'home'}
        )
        serializer = AnalyticsEventSerializer(instance=event)
        assert serializer.data['event_type'] == 'page_view'


@pytest.mark.unit
@pytest.mark.django_db
class TestVendorsSerializers:
    """Test Vendors serializers"""
    
    def test_vendor_serializer(self, regular_user):
        """Test VendorSerializer"""
        from apps.vendors.models import Vendor
        vendor = Vendor.objects.create(
            user=regular_user,
            name='Fashion Boutique',
            contact_email='vendor@example.com',
            phone_number='+123456789',
            address='123 Main St',
            is_active=True
        )
        serializer = VendorSerializer(instance=vendor)
        assert serializer.data['name'] == 'Fashion Boutique'
        assert serializer.data['is_active'] is True


@pytest.mark.unit
@pytest.mark.django_db
class TestBranchesSerializers:
    """Test Branches serializers"""
    
    def test_branch_serializer(self):
        """Test BranchSerializer"""
        from apps.branches.models import Branch
        branch = Branch.objects.create(
            name='Main Branch',
            name_ar='الفرع الرئيسي',
            address='123 Branch St',
            phone_number='+1122334455',
            email='main@example.com',
            is_active=True
        )
        serializer = BranchSerializer(instance=branch)
        assert serializer.data['name'] == 'Main Branch'
        assert serializer.data['is_active'] is True


@pytest.mark.unit
@pytest.mark.django_db
class TestCMSSerializers:
    """Test CMS serializers"""
    
    def test_page_serializer(self, admin_user):
        """Test PageSerializer"""
        from apps.cms.models import Page
        page = Page.objects.create(
            title='About Us',
            slug='about-us',
            content='About us content',
            created_by=admin_user,
            status='published'
        )
        serializer = PageSerializer(instance=page)
        assert serializer.data['title'] == 'About Us'
        assert serializer.data['status'] == 'published'
    
    def test_faq_serializer(self):
        """Test FAQSerializer"""
        from apps.cms.models import FAQ
        faq = FAQ.objects.create(
            question='How do I rent?',
            question_ar='كيف أستأجر؟',
            answer='You can browse and book',
            answer_ar='يمكنك التصفح والحجز'
        )
        serializer = FAQSerializer(instance=faq)
        assert serializer.data['question'] == 'How do I rent?'

