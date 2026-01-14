"""
Unit tests for Users models (extended)
"""
import pytest
from django.contrib.auth import get_user_model
from apps.users.models import UserProfile, StaffRole, ActivityLog, Shift, PerformanceReview
from apps.branches.models import Branch

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestUserProfileModel:
    """Test UserProfile model"""
    
    def test_create_user_profile(self, regular_user):
        """Test creating user profile"""
        profile = UserProfile.objects.create(
            user=regular_user,
            first_name_ar='محمد',
            last_name_ar='أحمد',
            city='Constantine',
            preferred_language='ar'
        )
        
        assert profile.user == regular_user
        assert profile.first_name_ar == 'محمد'
        assert profile.preferred_language == 'ar'


@pytest.mark.unit
@pytest.mark.django_db
class TestStaffRoleModel:
    """Test StaffRole model"""
    
    def test_create_staff_role(self, admin_user, staff_user, branch):
        """Test creating staff role"""
        staff_role = StaffRole.objects.create(
            user=staff_user,
            role='staff',
            branch=branch,
            department='Operations',
            is_active=True,
            assigned_by=admin_user
        )
        
        assert staff_role.user == staff_user
        assert staff_role.role == 'staff'
        assert staff_role.branch == branch
        assert staff_role.is_active


@pytest.mark.unit
@pytest.mark.django_db
class TestActivityLogModel:
    """Test ActivityLog model"""
    
    def test_create_activity_log(self, admin_user):
        """Test creating activity log"""
        log = ActivityLog.objects.create(
            user=admin_user,
            action='create',
            model_name='Product',
            object_id=1,
            description='Created new product',
            ip_address='127.0.0.1'
        )
        
        assert log.user == admin_user
        assert log.action == 'create'
        assert log.model_name == 'Product'


@pytest.mark.unit
@pytest.mark.django_db
class TestShiftModel:
    """Test Shift model"""
    
    def test_create_shift(self, staff_user, branch):
        """Test creating shift"""
        from datetime import date, time
        
        shift = Shift.objects.create(
            staff=staff_user,
            branch=branch,
            shift_date=date.today(),
            start_time=time(9, 0),
            end_time=time(17, 0),
            is_completed=False
        )
        
        assert shift.staff == staff_user
        assert shift.branch == branch
        assert not shift.is_completed


@pytest.mark.unit
@pytest.mark.django_db
class TestPerformanceReviewModel:
    """Test PerformanceReview model"""
    
    def test_create_performance_review(self, staff_user, admin_user):
        """Test creating performance review"""
        from datetime import date
        
        review = PerformanceReview.objects.create(
            staff=staff_user,
            reviewed_by=admin_user,
            review_period_start=date(2025, 1, 1),
            review_period_end=date(2025, 12, 31),
            overall_rating=4,
            punctuality_rating=5,
            quality_rating=4,
            communication_rating=4,
            strengths='Good work',
            strengths_ar='عمل جيد',
            areas_for_improvement='Can improve',
            areas_for_improvement_ar='يمكن التحسين'
        )
        
        assert review.staff == staff_user
        assert review.reviewed_by == admin_user
        assert review.overall_rating == 4

