"""
Views for User app
"""
from rest_framework import generics, status, viewsets, filters
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.exceptions import ValidationError
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django_filters.rest_framework import DjangoFilterBackend
from django.conf import settings
from core.throttling import LoginRateThrottle, RegisterRateThrottle
from .models import (
    User, UserProfile, VerificationStatus, Blacklist,
    StaffRole, ActivityLog, Shift, PerformanceReview
)
from .serializers import (
    UserSerializer, RegisterSerializer, UserProfileSerializer,
    VerificationStatusSerializer, PhoneVerificationSerializer,
    AddressVerificationSerializer, IDUploadSerializer, BlacklistSerializer,
    StaffRoleSerializer, ActivityLogSerializer, ShiftSerializer, PerformanceReviewSerializer,
    PasswordResetRequestSerializer, PasswordResetConfirmSerializer
)
from .services import VerificationService
from .permissions import (
    IsAdminOrManager, IsAdminOrManagerOrStaff, IsAdminOnly,
    CanManageStaff, CanViewOwnActivity, CanManageShifts, CanManagePerformanceReviews
)


class RegisterView(generics.CreateAPIView):
    """User registration"""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    throttle_classes = [RegisterRateThrottle]
    throttle_scope = 'register'
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """User login"""
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]
    throttle_scope = 'login'
    
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        
        if not email or not password:
            return Response(
                {'error': 'البريد الإلكتروني وكلمة المرور مطلوبان', 'message': 'Email and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = authenticate(request, username=email, password=password)
            if not user:
                return Response(
                    {'error': 'بيانات الدخول غير صحيحة', 'message': 'Invalid credentials'},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            if not user.is_active:
                return Response(
                    {'error': 'الحساب غير مفعّل', 'message': 'Account is not active'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        except Exception as e:
            return Response(
                {'error': f'حدث خطأ في تسجيل الدخول: {str(e)}', 'message': f'Login error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Get and update user profile"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user
    
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


# Admin Views
class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """Admin user management"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)
        return queryset


# Verification Views
class VerificationStatusView(generics.RetrieveUpdateAPIView):
    """Get and update verification status"""
    serializer_class = VerificationStatusSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        verification, created = VerificationStatus.objects.get_or_create(user=self.request.user)
        return verification


class RequestPhoneVerificationView(generics.GenericAPIView):
    """Request phone verification code"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        user = request.user
        if not user.phone:
            return Response(
                {'error': 'Phone number is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        code, expires_at = VerificationService.request_phone_verification(user)
        
        # Update verification status
        verification, _ = VerificationStatus.objects.get_or_create(user=user)
        verification.status = 'submitted'
        verification.save()
        
        return Response({
            'message': 'Verification code sent',
            'expires_at': expires_at
        })


class VerifyPhoneView(generics.GenericAPIView):
    """Verify phone with code"""
    permission_classes = [IsAuthenticated]
    serializer_class = PhoneVerificationSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        success, message = VerificationService.verify_phone_number(request.user, code)
        
        if success:
            # Update risk score
            verification = VerificationStatus.objects.get(user=request.user)
            verification.risk_score = VerificationService.calculate_risk_score(request.user)
            verification.save()
            
            return Response({'message': message})
        else:
            return Response(
                {'error': message},
                status=status.HTTP_400_BAD_REQUEST
            )


class UploadIDView(generics.UpdateAPIView):
    """Upload ID documents"""
    serializer_class = IDUploadSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        verification, created = VerificationStatus.objects.get_or_create(user=self.request.user)
        return verification
    
    def perform_update(self, serializer):
        verification = serializer.save()
        verification.status = 'submitted'
        verification.risk_score = VerificationService.calculate_risk_score(self.request.user)
        verification.save()


class VerifyAddressView(generics.GenericAPIView):
    """Verify address"""
    permission_classes = [IsAuthenticated]
    serializer_class = AddressVerificationSerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        VerificationService.verify_address(request.user, serializer.validated_data)
        
        # Update risk score
        verification = VerificationStatus.objects.get(user=request.user)
        verification.risk_score = VerificationService.calculate_risk_score(request.user)
        verification.save()
        
        return Response({'message': 'Address verified'})


class AdminVerificationListView(generics.ListAPIView):
    """List all verifications (admin only)"""
    serializer_class = VerificationStatusSerializer
    permission_classes = [IsAdminUser]
    
    def get_queryset(self):
        status_filter = self.request.query_params.get('status', None)
        queryset = VerificationStatus.objects.select_related('user', 'verified_by').all()
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        return queryset


class AdminApproveVerificationView(generics.GenericAPIView):
    """Approve verification (admin only)"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        try:
            user = User.objects.get(pk=user_id)
            VerificationService.approve_verification(user, request.user)
            return Response({'message': 'Verification approved'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminRejectVerificationView(generics.GenericAPIView):
    """Reject verification (admin only)"""
    permission_classes = [IsAdminUser]
    
    def post(self, request, user_id):
        reason = request.data.get('reason', '')
        if not reason:
            return Response(
                {'error': 'Reason is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = User.objects.get(pk=user_id)
            VerificationService.reject_verification(user, reason, request.user)
            return Response({'message': 'Verification rejected'})
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class BlacklistListView(generics.ListAPIView):
    """List blacklisted users (admin only)"""
    serializer_class = BlacklistSerializer
    permission_classes = [IsAdminUser]
    queryset = Blacklist.objects.filter(is_active=True).select_related('user', 'added_by')


class AddToBlacklistView(generics.CreateAPIView):
    """Add user to blacklist (admin only)"""
    serializer_class = BlacklistSerializer
    permission_classes = [IsAdminUser]
    
    def perform_create(self, serializer):
        user_id = self.request.data.get('user')
        reason = self.request.data.get('reason', '')
        
        try:
            user = User.objects.get(pk=user_id)
            VerificationService.add_to_blacklist(user, reason, self.request.user)
        except User.DoesNotExist:
            raise ValidationError('User not found')


# Staff Management Views
class StaffRoleViewSet(viewsets.ModelViewSet):
    """ViewSet for managing staff roles"""
    queryset = StaffRole.objects.select_related('user', 'branch', 'assigned_by').all()
    serializer_class = StaffRoleSerializer
    permission_classes = [IsAuthenticated, CanManageStaff]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['role', 'branch', 'is_active', 'department']
    ordering_fields = ['assigned_at', 'role']
    ordering = ['-assigned_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin can see all roles
        if user.role == 'admin' or user.is_superuser:
            return queryset
        
        # Manager can see roles in their branch
        if user.role == 'manager':
            manager_roles = user.staff_roles.filter(is_active=True)
            manager_branches = [role.branch_id for role in manager_roles if role.branch]
            if manager_branches:
                return queryset.filter(branch_id__in=manager_branches)
            return queryset.none()
        
        # Staff can see their own roles
        return queryset.filter(user=user)
    
    def perform_create(self, serializer):
        serializer.save(assigned_by=self.request.user)
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='StaffRole',
            description=f"Assigned {serializer.validated_data['role']} role to {serializer.validated_data['user'].email}",
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def perform_update(self, serializer):
        serializer.save()
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='update',
            model_name='StaffRole',
            object_id=self.get_object().id,
            description=f"Updated staff role for {self.get_object().user.email}",
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def perform_destroy(self, instance):
        user_email = instance.user.email
        instance.delete()
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='delete',
            model_name='StaffRole',
            description=f"Removed staff role for {user_email}",
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing activity logs"""
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated, CanViewOwnActivity]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter, filters.SearchFilter]
    filterset_fields = ['action', 'model_name', 'user']
    search_fields = ['description', 'model_name']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin and manager can see all logs
        if user.role in ['admin', 'manager'] or user.is_staff:
            return queryset
        
        # Others can only see their own logs
        return queryset.filter(user=user)


class ShiftViewSet(viewsets.ModelViewSet):
    """ViewSet for managing shifts"""
    queryset = Shift.objects.select_related('staff', 'branch').all()
    serializer_class = ShiftSerializer
    permission_classes = [IsAuthenticated, CanManageShifts]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'branch', 'shift_date', 'is_completed']
    ordering_fields = ['shift_date', 'start_time']
    ordering = ['shift_date', 'start_time']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin and manager can see all shifts
        if user.role in ['admin', 'manager'] or user.is_staff:
            return queryset
        
        # Staff can see their own shifts
        return queryset.filter(staff=user)
    
    def perform_create(self, serializer):
        serializer.save()
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='Shift',
            description=f"Created shift for {serializer.validated_data['staff'].email}",
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class PerformanceReviewViewSet(viewsets.ModelViewSet):
    """ViewSet for managing performance reviews"""
    queryset = PerformanceReview.objects.select_related('staff', 'reviewed_by').all()
    serializer_class = PerformanceReviewSerializer
    permission_classes = [IsAuthenticated, CanManagePerformanceReviews]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['staff', 'reviewed_by', 'review_period_start', 'review_period_end']
    ordering_fields = ['reviewed_at', 'overall_rating']
    ordering = ['-reviewed_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Admin and manager can see all reviews
        if user.role in ['admin', 'manager'] or user.is_staff:
            return queryset
        
        # Staff can see their own reviews
        return queryset.filter(staff=user)
    
    def perform_create(self, serializer):
        serializer.save(reviewed_by=self.request.user)
        # Log activity
        ActivityLog.objects.create(
            user=self.request.user,
            action='create',
            model_name='PerformanceReview',
            description=f"Created performance review for {serializer.validated_data['staff'].email}",
            ip_address=self.get_client_ip(),
            user_agent=self.request.META.get('HTTP_USER_AGENT', '')
        )
    
    def get_client_ip(self):
        x_forwarded_for = self.request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = self.request.META.get('REMOTE_ADDR')
        return ip


class StaffListView(generics.ListAPIView):
    """List all staff members"""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        return User.objects.filter(
            role__in=['admin', 'manager', 'staff', 'delivery', 'support']
        ).select_related('profile').prefetch_related('staff_roles')


class PasswordResetRequestView(generics.GenericAPIView):
    """Request password reset"""
    serializer_class = PasswordResetRequestSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            # Don't reveal if user exists or not for security
            return Response({
                'message': 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة تعيين كلمة المرور',
                'message_en': 'If the email exists, a password reset link will be sent'
            }, status=status.HTTP_200_OK)
        
        # Generate reset token
        from django.contrib.auth.tokens import default_token_generator
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        from apps.notifications.services import send_email_notification
        
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # Create reset link
        reset_link = f"{getattr(settings, 'FRONTEND_URL', 'http://localhost:3001')}/reset-password?token={token}&uid={uid}"
        
        # Send email
        subject = 'إعادة تعيين كلمة المرور - ReadyRent.Gala'
        message = f'''
        مرحباً {user.email},
        
        لقد طلبت إعادة تعيين كلمة المرور لحسابك في ReadyRent.Gala.
        
        اضغط على الرابط التالي لإعادة تعيين كلمة المرور:
        {reset_link}
        
        إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.
        
        مع تحياتنا,
        فريق ReadyRent.Gala
        '''
        
        html_message = f'''
        <html>
        <body dir="rtl" style="font-family: Arial, sans-serif; direction: rtl;">
            <h2>إعادة تعيين كلمة المرور</h2>
            <p>مرحباً {user.email},</p>
            <p>لقد طلبت إعادة تعيين كلمة المرور لحسابك في ReadyRent.Gala.</p>
            <p><a href="{reset_link}" style="background-color: #8B5CF6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">إعادة تعيين كلمة المرور</a></p>
            <p>أو انسخ الرابط التالي إلى المتصفح:</p>
            <p>{reset_link}</p>
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
            <p>مع تحياتنا,<br>فريق ReadyRent.Gala</p>
        </body>
        </html>
        '''
        
        send_email_notification(user, subject, message, html_message)
        
        return Response({
            'message': 'إذا كان البريد الإلكتروني موجوداً، سيتم إرسال رابط إعادة تعيين كلمة المرور',
            'message_en': 'If the email exists, a password reset link will be sent'
        }, status=status.HTTP_200_OK)


class PasswordResetConfirmView(generics.GenericAPIView):
    """Confirm password reset"""
    serializer_class = PasswordResetConfirmSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token = serializer.validated_data['token']
        password = serializer.validated_data['password']
        uid = request.data.get('uid')
        
        if not uid:
            return Response(
                {'error': 'UID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.utils.http import urlsafe_base64_decode
            from django.utils.encoding import force_str
            
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id, is_active=True)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {'error': 'Invalid reset link'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify token
        from django.contrib.auth.tokens import default_token_generator
        if not default_token_generator.check_token(user, token):
            return Response(
                {'error': 'Invalid or expired reset token'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(password)
        user.save()
        
        return Response({
            'message': 'تم إعادة تعيين كلمة المرور بنجاح',
            'message_en': 'Password reset successfully'
        }, status=status.HTTP_200_OK)

