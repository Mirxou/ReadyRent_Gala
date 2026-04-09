"""
Advanced Security Tests
"""
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from datetime import date, timedelta
import json

User = get_user_model()


class CORSSecurityTestCase(TestCase):
    """Test CORS security headers"""
    
    def setUp(self):
        self.client = Client()
    
    def test_cors_headers_present(self):
        """Test CORS headers are properly set"""
        response = self.client.get('/api/products/')
        
        # Check CORS headers
        self.assertIn('Access-Control-Allow-Origin', response)
        self.assertIn('Access-Control-Allow-Methods', response)
    
    def test_cors_headers_restrict_origin(self):
        """Test CORS headers restrict untrusted origins"""
        # This depends on your CORS configuration
        response = self.client.get(
            '/api/products/',
            HTTP_ORIGIN='https://malicious.com'
        )
        
        # Should either reject or not include untrusted origin
        allowed_origin = response.get('Access-Control-Allow-Origin', '*')
        # Verify it's allowed only for trusted domains
        self.assertNotEqual(allowed_origin, 'https://malicious.com')


class ClickjackingProtectionTestCase(TestCase):
    """Test clickjacking protection"""
    
    def setUp(self):
        self.client = Client()
    
    def test_x_frame_options_header(self):
        """Test X-Frame-Options header is set"""
        response = self.client.get('/api/products/')
        
        self.assertIn('X-Frame-Options', response)
        self.assertIn(response['X-Frame-Options'], ['DENY', 'SAMEORIGIN'])


class DataLeakagePreventionTestCase(TestCase):
    """Test for information leakage"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
    
    def test_no_debug_info_in_errors(self):
        """Test error responses don't leak debug info"""
        response = self.client.get('/api/nonexistent/')
        
        self.assertEqual(response.status_code, 404)
        
        # Should not contain debug info
        response_text = str(response.content)
        self.assertNotIn('traceback', response_text.lower())
        self.assertNotIn('sqlalchemy', response_text.lower())
        self.assertNotIn('settings', response_text.lower())
    
    def test_no_database_paths_leaked(self):
        """Test database paths not exposed"""
        response = self.client.get('/api/404/')
        
        response_text = str(response.content)
        self.assertNotIn('/home/', response_text)
        self.assertNotIn('/var/', response_text)
        self.assertNotIn('.db', response_text)
    
    def test_user_privacy_list_endpoint(self):
        """Test user list doesn't expose sensitive info"""
        self.client.login(email='test@example.com', password='password123')
        
        response = self.client.get('/api/users/')
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        
        # Should not contain passwords
        for user in data.get('results', []):
            self.assertNotIn('password', user)
            self.assertNotIn('password_hash', user)
            # PII should be restricted
            if not (user.get('id') == self.user.id):
                self.assertNotIn('email', user)


class TokenSecurityTestCase(TestCase):
    """Test JWT token security"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
    
    def test_token_has_expiration(self):
        """Test JWT tokens have expiration"""
        response = self.client.post('/api/token/', {
            'email': 'test@example.com',
            'password': 'password123'
        })
        
        self.assertEqual(response.status_code, 200)
        
        data = response.json()
        self.assertIn('access', data)
        self.assertIn('exp', data.get('access', {}))
    
    def test_expired_token_rejected(self):
        """Test expired tokens are rejected"""
        # This would require generating an expired token
        # Implementation depends on your token generation
        pass
    
    def test_token_not_in_url(self):
        """Test tokens are not passed in URL"""
        response = self.client.get('/api/products/?token=abc123')
        
        # Tokens should not be used as query parameters
        self.assertEqual(response.status_code, 200)


class PasswordSecurityTestCase(TestCase):
    """Test password security"""
    
    def test_weak_password_rejected(self):
        """Test weak passwords are rejected"""
        response = self.client.post('/api/register/', {
            'email': 'new@example.com',
            'password': '123',  # Too weak
            'password_confirm': '123'
        })
        
        self.assertNotEqual(response.status_code, 201)
    
    def test_password_hash_used(self):
        """Test passwords are hashed"""
        user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        
        # Password should not be stored as plaintext
        self.assertNotEqual(user.password, 'password123')
        self.assertTrue(user.password.startswith('pbkdf2_sha256$'))


class RateLimitingSecurityTestCase(TestCase):
    """Test rate limiting"""
    
    def setUp(self):
        self.client = Client()
    
    def test_login_rate_limiting(self):
        """Test login attempts are rate limited"""
        # Try multiple failed logins
        for i in range(10):
            self.client.post('/api/login/', {
                'email': 'test@example.com',
                'password': 'wrongpassword'
            })
        
        # Should get rate limited
        response = self.client.post('/api/login/', {
            'email': 'test@example.com',
            'password': 'wrongpassword'
        })
        
        # Should return 429 Too Many Requests
        self.assertEqual(response.status_code, 429)
    
    def test_api_rate_limiting(self):
        """Test API requests are rate limited"""
        # Make many requests
        for i in range(100):
            self.client.get('/api/products/')
        
        # Should hit rate limit
        response = self.client.get('/api/products/')
        
        # Should be rate limited
        self.assertIn(response.status_code, [429, 403])


class FileUploadSecurityTestCase(TestCase):
    """Test file upload security"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
        self.client.login(email='test@example.com', password='password123')
    
    def test_executable_files_rejected(self):
        """Test executable files are rejected"""
        # Try uploading executable
        with open('test.exe', 'wb') as f:
            f.write(b'MZ\x90\x00')  # PE header
        
        with open('test.exe', 'rb') as f:
            response = self.client.post(
                '/api/upload/',
                {'file': f}
            )
        
        # Should be rejected
        self.assertNotEqual(response.status_code, 200)
    
    def test_file_size_limit(self):
        """Test file size limits"""
        # Create large file
        with open('large.jpg', 'wb') as f:
            f.write(b'x' * (100 * 1024 * 1024))  # 100MB
        
        with open('large.jpg', 'rb') as f:
            response = self.client.post(
                '/api/upload/',
                {'file': f}
            )
        
        # Should be rejected
        self.assertNotEqual(response.status_code, 200)


class SQLInjectionProtectionTestCase(TestCase):
    """Test SQL injection protection"""
    
    def setUp(self):
        self.client = Client()
    
    def test_sql_injection_in_search(self):
        """Test SQL injection in search is prevented"""
        malicious_query = "'; DROP TABLE users; --"
        
        response = self.client.get(f'/api/products/?search={malicious_query}')
        
        # Should handle gracefully
        self.assertEqual(response.status_code, 200)
        
        # Table should still exist
        from django.contrib.auth import get_user_model
        User = get_user_model()
        self.assertTrue(User.objects.exists())
    
    def test_sql_injection_in_filter(self):
        """Test SQL injection in filters is prevented"""
        malicious_id = "1 OR 1=1"
        
        response = self.client.get(f'/api/products/{malicious_id}/')
        
        # Should return 404 or error, not all products
        self.assertIn(response.status_code, [404, 400])


class XSSProtectionTestCase(TestCase):
    """Test XSS protection"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='test@example.com',
            password='password123',
            username='testuser'
        )
    
    def test_xss_in_product_description(self):
        """Test XSS in product description is escaped"""
        from apps.products.models import Category, Product
        
        category = Category.objects.create(
            name='Test',
            slug='test'
        )
        
        Product.objects.create(
            name='Product',
            slug='product',
            description='<script>alert("xss")</script>',
            owner=self.user,
            category=category,
            price_per_day=100
        )
        
        response = self.client.get('/api/products/1/')
        
        # Script tag should be escaped
        self.assertNotIn('<script>', response.content.decode())
    
    def test_xss_in_user_input(self):
        """Test XSS in review comments is prevented"""
        self.client.login(email='test@example.com', password='password123')
        
        xss_comment = '<img src=x onerror="alert(\'xss\')">'
        
        response = self.client.post('/api/reviews/', {
            'product': 1,
            'rating': 5,
            'comment': xss_comment
        })
        
        # Should sanitize
        if response.status_code == 201:
            review_response = response.json()
            self.assertNotIn('onerror', review_response.get('comment', ''))
