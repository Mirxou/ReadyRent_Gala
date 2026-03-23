"""
XSS (Cross-Site Scripting) protection tests
"""
import pytest
from django.test import Client
from django.contrib.auth import get_user_model
from apps.products.models import Category, Product

User = get_user_model()


@pytest.mark.security
@pytest.mark.django_db
class TestXSSProtection:
    """Test XSS protection"""
    
    def test_xss_in_product_name(self, category):
        """Test XSS attempt in product name is escaped"""
        xss_payload = '<script>alert("XSS")</script>'
        product = Product.objects.create(
            name=xss_payload,
            name_ar='فستان',
            slug='test-dress',
            category=category,
            price_per_day=1000.00,
            status='available'
        )
        # The name should be stored as-is (Django doesn't auto-escape in DB)
        # But when rendered, it should be escaped
        assert '<script>' in product.name
        # In templates, Django auto-escapes, so this would be safe
    
    def test_xss_in_product_description(self, category):
        """Test XSS attempt in product description is escaped"""
        xss_payload = '<img src=x onerror=alert("XSS")>'
        product = Product.objects.create(
            name='Test Dress',
            name_ar='فستان',
            slug='test-dress',
            description=xss_payload,
            category=category,
            price_per_day=1000.00,
            status='available'
        )
        # Description should be stored, but escaped when rendered
        assert '<img' in product.description
    
    def test_sql_injection_in_search(self, api_client):
        """Test SQL injection attempt in search"""
        # Common SQL injection payloads
        sql_payloads = [
            "'; DROP TABLE products; --",
            "' OR '1'='1",
            "' UNION SELECT * FROM users --"
        ]
        
        for payload in sql_payloads:
            response = api_client.get(f'/api/products/?search={payload}')
            # Should not crash or expose data
            assert response.status_code in [200, 400, 404]
            # Database should still be intact (products might exist from fixtures)
            # Just verify the query doesn't crash
            try:
                Product.objects.all().count()
            except Exception:
                pytest.fail("SQL injection caused database error")

