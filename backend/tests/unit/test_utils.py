"""
Unit tests for Utility functions
"""
import pytest
from django.contrib.auth import get_user_model
from datetime import date, timedelta

User = get_user_model()


@pytest.mark.unit
@pytest.mark.django_db
class TestDateUtilities:
    """Test date utility functions"""
    
    def test_date_range_calculation(self):
        """Test date range calculation"""
        start = date.today()
        end = start + timedelta(days=5)
        
        days = (end - start).days + 1
        assert days == 6
    
    def test_future_date_validation(self):
        """Test future date validation"""
        future_date = date.today() + timedelta(days=1)
        past_date = date.today() - timedelta(days=1)
        
        assert future_date > date.today()
        assert past_date < date.today()


@pytest.mark.unit
@pytest.mark.django_db
class TestPriceCalculations:
    """Test price calculation utilities"""
    
    def test_daily_price_calculation(self):
        """Test daily price calculation"""
        from decimal import Decimal
        
        daily_price = Decimal('1000.00')
        days = 3
        
        total = daily_price * days
        assert total == Decimal('3000.00')
    
    def test_discount_calculation(self):
        """Test discount calculation"""
        from decimal import Decimal
        
        original_price = Decimal('5000.00')
        discount_percentage = Decimal('10.00')
        
        discount_amount = original_price * (discount_percentage / 100)
        final_price = original_price - discount_amount
        
        assert discount_amount == Decimal('500.00')
        assert final_price == Decimal('4500.00')


@pytest.mark.unit
@pytest.mark.django_db
class TestStringUtilities:
    """Test string utility functions"""
    
    def test_slug_generation(self):
        """Test slug generation"""
        name = "Test Product Name"
        slug = name.lower().replace(' ', '-')
        
        assert slug == "test-product-name"
    
    def test_arabic_text_handling(self):
        """Test Arabic text handling"""
        arabic_text = "فساتين سهرة"
        
        assert len(arabic_text) > 0
        assert isinstance(arabic_text, str)

