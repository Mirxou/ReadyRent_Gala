import pytest
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
import uuid

from apps.users.models import VerificationStatus, Blacklist, UserProfile, StaffRole

User = get_user_model()

@pytest.mark.unit
@pytest.mark.django_db
class TestAuthViews:
    """Test Registration and Login views"""
    
    def test_register_user_success(self, api_client):
        """Test successful user registration"""
        data = {
            'username': 'newuser',
            'email': 'new@example.com',
            'password': 'Password123!',
            'password_confirm': 'Password123!',
            'first_name': 'New',
            'last_name': 'User'
        }
        response = api_client.post('/api/auth/register/', data)
        assert response.status_code == status.HTTP_201_CREATED
        assert 'access' in response.data
        assert response.data['user']['email'] == 'new@example.com'

    def test_login_user_success(self, api_client):
        """Test successful user login"""
        User.objects.create_user(username='loginuser', email='login@example.com', password='Password123!')
        
        data = {
            'email': 'login@example.com',
            'password': 'Password123!'
        }
        response = api_client.post('/api/auth/login/', data)
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data

@pytest.mark.unit
@pytest.mark.django_db
class TestUserProfileView:
    """Test Profile views"""
    
    def test_update_profile(self, api_client):
        """Test updating own profile (using fields in UserSerializer)"""
        user = User.objects.create_user(username='u_profile', email='up@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        data = {
            'phone': '0550123456'
        }
        response = api_client.patch('/api/auth/profile/', data)
        assert response.status_code == status.HTTP_200_OK
        assert response.data['phone'] == '0550123456'

@pytest.mark.unit
@pytest.mark.django_db
class TestVerificationViews:
    """Test Verification related views"""
    
    def test_get_verification_status(self, api_client):
        """Test getting verification status"""
        user = User.objects.create_user(username='v_user', email='v@example.com', password='pass')
        api_client.force_authenticate(user=user)
        
        response = api_client.get('/api/auth/verification/')
        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'pending'

    @patch('apps.users.services.VerificationService.request_phone_verification')
    def test_request_phone_verification(self, mock_request, api_client):
        """Test requesting phone verification"""
        user = User.objects.create_user(username='p_user', email='p@example.com', password='pass', phone='0661234567')
        api_client.force_authenticate(user=user)
        mock_request.return_value = ('123456', '2025-01-01T00:00:00')
        
        response = api_client.post('/api/auth/verification/phone/request/')
        assert response.status_code == status.HTTP_200_OK
        
    @patch('apps.users.services.VerificationService.verify_phone_number')
    @patch('apps.users.services.VerificationService.calculate_risk_score')
    def test_verify_phone_success(self, mock_risk, mock_verify, api_client):
        """Test successful phone verification"""
        user = User.objects.create_user(username='pv_user', email='pv@example.com', password='pass')
        VerificationStatus.objects.create(user=user)
        api_client.force_authenticate(user=user)
        mock_verify.return_value = (True, 'Phone verified')
        mock_risk.return_value = 10
        
        response = api_client.post('/api/auth/verification/phone/verify/', {'code': '123456'})
        assert response.status_code == status.HTTP_200_OK

@pytest.mark.unit
@pytest.mark.django_db
class TestAdminUserViews:
    """Test Admin User management views"""
    
    def test_admin_list_verifications(self, api_client):
        """Test admin listing verifications"""
        admin = User.objects.create_superuser(username='adminv', email='adminv@example.com', password='pass', role='admin')
        api_client.force_authenticate(user=admin)
        
        response = api_client.get('/api/auth/admin/verifications/')
        assert response.status_code == status.HTTP_200_OK

    def test_admin_approve_verification(self, api_client):
        """Test admin approving verification"""
        admin = User.objects.create_superuser(username='admina', email='admina@example.com', password='pass', role='admin')
        user = User.objects.create_user(username='userv', email='userv@example.com', password='pass')
        VerificationStatus.objects.create(user=user)
        api_client.force_authenticate(user=admin)
        
        response = api_client.post(f'/api/auth/admin/verifications/{user.id}/approve/')
        assert response.status_code == status.HTTP_200_OK
        
        user.refresh_from_db()
        assert user.is_verified is True

    def test_admin_list_users_filter_role(self, api_client):
        """Test admin listing users filtered by role"""
        admin = User.objects.create_superuser(username='adminr', email='adminr@example.com', password='pass', role='admin')
        User.objects.create_user(username='staff_user', email='staff@example.com', password='pass', role='staff')
        api_client.force_authenticate(user=admin)
        
        response = api_client.get('/api/auth/admin/users/?role=staff')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['role'] == 'staff'

    def test_admin_blacklist_user(self, api_client):
        """Test adding user to blacklist"""
        admin = User.objects.create_superuser(username='adminb', email='adminb@example.com', password='pass', role='admin')
        user = User.objects.create_user(username='baduser', email='bad@example.com', password='pass')
        api_client.force_authenticate(user=admin)
        
        data = {'user': user.id, 'reason': 'Testing blacklist'}
        response = api_client.post('/api/auth/admin/blacklist/add/', data)
        assert response.status_code == status.HTTP_201_CREATED

@pytest.mark.unit
@pytest.mark.django_db
class TestStaffViews:
    """Test Staff management views"""
    
    def test_staff_list_as_admin(self, api_client):
        """Test listing staff members"""
        admin = User.objects.create_superuser(username='admins', email='admins@example.com', password='pass', role='admin')
        User.objects.create_user(username='staff1', email='s1@example.com', password='pass', role='staff')
        api_client.force_authenticate(user=admin)
        
        response = api_client.get('/api/auth/staff/list/')
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_manage_staff_roles(self, api_client):
        """Test StaffRoleViewSet management"""
        admin = User.objects.create_superuser(username='admin_sr', email='asr@example.com', password='pass', role='admin')
        UserProfile.objects.get_or_create(user=admin)
        target_user = User.objects.create_user(username='user_sr', email='usr@example.com', password='pass')
        UserProfile.objects.get_or_create(user=target_user)
        api_client.force_authenticate(user=admin)
        
        # Create role
        data = {'user': target_user.id, 'role': 'staff', 'department': 'Operations'}
        response = api_client.post('/api/auth/staff/roles/', data)
        assert response.status_code == status.HTTP_201_CREATED
        
        role_id = response.data['id']
        # List roles
        response = api_client.get('/api/auth/staff/roles/')
        assert response.status_code == status.HTTP_200_OK
        assert any(r['id'] == role_id for r in response.data)

@pytest.mark.unit
@pytest.mark.django_db
class TestPasswordResetViews:
    """Test Password Reset views"""
    
    @patch('apps.notifications.services.send_email_notification')
    def test_password_reset_request(self, mock_email, api_client):
        """Test requesting password reset"""
        User.objects.create_user(username='resetuser', email='reset@example.com', password='OldPassword123!')
        
        response = api_client.post('/api/auth/password/reset/request/', {'email': 'reset@example.com'})
        assert response.status_code == status.HTTP_200_OK
        assert mock_email.called

    def test_password_reset_confirm(self, api_client):
        """Test confirming password reset"""
        user = User.objects.create_user(username='resetuser2', email='reset2@example.com', password='OldPassword123!')
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        data = {
            'token': token,
            'uid': uid,
            'password': 'NewPassword123!',
            'password_confirm': 'NewPassword123!'
        }
        response = api_client.post('/api/auth/password/reset/confirm/', data)
        assert response.status_code == status.HTTP_200_OK
        
        user.refresh_from_db()
        assert user.check_password('NewPassword123!')

