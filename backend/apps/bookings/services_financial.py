from decimal import Decimal
from constance import config
from django.utils.translation import gettext_lazy as _

class FinancialService:
    """
    Handles all financial calculations for the Sovereign Treasury.
    - Base Rental Price
    - Sovereign Protection Fee (SPF)
    - Future: VAT, insurance, etc.
    """
    
    @staticmethod
    def calculate_booking_breakdown(product, start_date, end_date):
        """
        Calculates the full financial breakdown of a booking.
        Returns a dictionary with all components.
        """
        if not product or not start_date or not end_date:
            return None
            
        if end_date < start_date:
            return None
            
        total_days = (end_date - start_date).days + 1
        price_per_day = product.price_per_day
        
        # 1. Base Price
        base_price = price_per_day * Decimal(total_days)
        
        # 2. Sovereign Protection Fee (SPF)
        # Rate is typically 0.05 (5%)
        # fetched from dynamic config
        spf_rate = getattr(config, 'SPF_RENTER_RATE', 0.05)
        # Ensure rate is a Decimal
        spf_rate_decimal = Decimal(str(spf_rate)) 
        
        protection_fee = base_price * spf_rate_decimal
        
        # Rounding (Standard 2 decimal places)
        protection_fee = protection_fee.quantize(Decimal("0.01"))
        base_price = base_price.quantize(Decimal("0.01"))
        
        # 3. Total Price
        total_price = base_price + protection_fee
        
        return {
            'total_days': total_days,
            'price_per_day': price_per_day,
            'base_price': base_price,
            'spf_rate': spf_rate_decimal,
            'protection_fee': protection_fee,
            'total_price': total_price
        }
