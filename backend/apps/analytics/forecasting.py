"""
Demand forecasting service for ReadyRent.Gala
"""
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Sum, Count, Avg, Q
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Forecast, DailyAnalytics, ProductAnalytics
from apps.bookings.models import Booking
from apps.products.models import Product, Category


class DemandForecastingService:
    """Service for demand forecasting"""
    
    @staticmethod
    def calculate_seasonal_factor(product_id, month):
        """Calculate seasonal factor for a product in a given month"""
        # Get historical bookings for this product in this month
        historical_bookings = Booking.objects.filter(
            product_id=product_id,
            start_date__month=month,
            status__in=['confirmed', 'completed']
        ).count()
        
        # Get average bookings per month
        total_bookings = Booking.objects.filter(
            product_id=product_id,
            status__in=['confirmed', 'completed']
        ).count()
        
        if total_bookings == 0:
            return 1.0
        
        months_with_data = Booking.objects.filter(
            product_id=product_id,
            status__in=['confirmed', 'completed']
        ).dates('start_date', 'month').distinct().count()
        
        if months_with_data == 0:
            return 1.0
        
        average_monthly_bookings = total_bookings / months_with_data
        if average_monthly_bookings == 0:
            return 1.0
        
        seasonal_factor = historical_bookings / average_monthly_bookings
        return float(seasonal_factor)
    
    @staticmethod
    def calculate_trend_factor(product_id, days=90):
        """Calculate trend factor based on recent bookings"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Recent bookings
        recent_bookings = Booking.objects.filter(
            product_id=product_id,
            start_date__gte=start_date,
            status__in=['confirmed', 'completed']
        ).count()
        
        # Previous period bookings
        previous_start = start_date - timedelta(days=days)
        previous_bookings = Booking.objects.filter(
            product_id=product_id,
            start_date__gte=previous_start,
            start_date__lt=start_date,
            status__in=['confirmed', 'completed']
        ).count()
        
        if previous_bookings == 0:
            return 1.0
        
        trend_factor = recent_bookings / previous_bookings
        return float(trend_factor)
    
    @staticmethod
    def forecast_product_demand(product_id, forecast_start, forecast_end):
        """Forecast demand for a specific product"""
        product = Product.objects.get(pk=product_id)
        
        # Get historical data
        historical_bookings = Booking.objects.filter(
            product_id=product_id,
            status__in=['confirmed', 'completed']
        )
        
        # Calculate base demand (average daily bookings)
        total_bookings = historical_bookings.count()
        if total_bookings == 0:
            # No historical data, use product analytics if available
            try:
                analytics = product.analytics
                if analytics.total_bookings > 0:
                    # Estimate based on product age
                    days_since_creation = (timezone.now().date() - product.created_at.date()).days
                    if days_since_creation > 0:
                        base_daily_demand = analytics.total_bookings / days_since_creation
                    else:
                        base_daily_demand = 0.1  # Default low demand
                else:
                    base_daily_demand = 0.1
            except:
                base_daily_demand = 0.1
        else:
            # Calculate average bookings per day
            first_booking = historical_bookings.order_by('start_date').first()
            if first_booking:
                days_with_bookings = (timezone.now().date() - first_booking.start_date).days
                if days_with_bookings > 0:
                    base_daily_demand = total_bookings / days_with_bookings
                else:
                    base_daily_demand = total_bookings
            else:
                base_daily_demand = 0.1
        
        # Calculate forecast period length
        forecast_days = (forecast_end - forecast_start).days + 1
        
        # Calculate seasonal factors for the forecast period
        seasonal_factors = []
        current_date = forecast_start
        while current_date <= forecast_end:
            month = current_date.month
            seasonal_factor = DemandForecastingService.calculate_seasonal_factor(product_id, month)
            seasonal_factors.append(seasonal_factor)
            current_date += timedelta(days=1)
        
        avg_seasonal_factor = sum(seasonal_factors) / len(seasonal_factors) if seasonal_factors else 1.0
        
        # Calculate trend factor
        trend_factor = DemandForecastingService.calculate_trend_factor(product_id)
        
        # Calculate predicted demand
        predicted_demand = int(base_daily_demand * forecast_days * avg_seasonal_factor * trend_factor)
        
        # Calculate predicted revenue
        predicted_revenue = predicted_demand * product.price_per_day * (forecast_days / 2)  # Average rental duration
        
        # Calculate confidence level (based on data availability)
        confidence_level = min(100, (total_bookings / 10) * 10)  # More bookings = higher confidence
        
        return {
            'predicted_demand': predicted_demand,
            'predicted_revenue': float(predicted_revenue),
            'confidence_level': min(100, confidence_level),
            'seasonal_factor': avg_seasonal_factor,
            'trend_factor': trend_factor,
            'base_daily_demand': base_daily_demand,
        }
    
    @staticmethod
    def forecast_category_demand(category_id, forecast_start, forecast_end):
        """Forecast demand for a category"""
        category = Category.objects.get(pk=category_id)
        products = Product.objects.filter(category_id=category_id)
        
        total_predicted_demand = 0
        total_predicted_revenue = 0
        confidence_levels = []
        
        for product in products:
            forecast = DemandForecastingService.forecast_product_demand(
                product.id,
                forecast_start,
                forecast_end
            )
            total_predicted_demand += forecast['predicted_demand']
            total_predicted_revenue += forecast['predicted_revenue']
            confidence_levels.append(forecast['confidence_level'])
        
        avg_confidence = sum(confidence_levels) / len(confidence_levels) if confidence_levels else 0
        
        return {
            'predicted_demand': total_predicted_demand,
            'predicted_revenue': total_predicted_revenue,
            'confidence_level': avg_confidence,
        }
    
    @staticmethod
    def generate_seasonal_forecast(forecast_start, forecast_end):
        """Generate seasonal forecast for all products"""
        forecasts = []
        
        products = Product.objects.filter(status='available')
        for product in products:
            forecast_data = DemandForecastingService.forecast_product_demand(
                product.id,
                forecast_start,
                forecast_end
            )
            
            # Create or update forecast
            forecast, created = Forecast.objects.update_or_create(
                product=product,
                forecast_type='seasonal',
                forecast_start=forecast_start,
                forecast_end=forecast_end,
                defaults={
                    'predicted_demand': forecast_data['predicted_demand'],
                    'predicted_revenue': forecast_data['predicted_revenue'],
                    'confidence_level': forecast_data['confidence_level'],
                    'seasonal_factor': forecast_data['seasonal_factor'],
                    'trend_factor': forecast_data['trend_factor'],
                    'forecast_data': forecast_data,
                }
            )
            
            forecasts.append(forecast)
        
        return forecasts
    
    @staticmethod
    def get_high_demand_products(forecast_start, forecast_end, limit=10):
        """Get products with highest predicted demand"""
        forecasts = Forecast.objects.filter(
            forecast_start=forecast_start,
            forecast_end=forecast_end,
            forecast_type='seasonal'
        ).order_by('-predicted_demand')[:limit]
        
        return forecasts
    
    @staticmethod
    def get_low_stock_alerts(forecast_start, forecast_end):
        """Get products that may need restocking based on forecast"""
        forecasts = Forecast.objects.filter(
            forecast_start=forecast_start,
            forecast_end=forecast_end,
            forecast_type='seasonal'
        )
        
        alerts = []
        for forecast in forecasts:
            if forecast.product:
                # Check current inventory
                try:
                    inventory = forecast.product.inventory_item
                    if inventory.quantity_available < forecast.predicted_demand:
                        alerts.append({
                            'product': forecast.product,
                            'current_stock': inventory.quantity_available,
                            'predicted_demand': forecast.predicted_demand,
                            'shortage': forecast.predicted_demand - inventory.quantity_available,
                        })
                except:
                    pass
        
        return alerts
    
    @staticmethod
    def analyze_trends(product_id=None, category_id=None, days=365):
        """Analyze trends for products or categories"""
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        if product_id:
            bookings = Booking.objects.filter(
                product_id=product_id,
                start_date__gte=start_date,
                status__in=['confirmed', 'completed']
            )
        elif category_id:
            bookings = Booking.objects.filter(
                product__category_id=category_id,
                start_date__gte=start_date,
                status__in=['confirmed', 'completed']
            )
        else:
            bookings = Booking.objects.filter(
                start_date__gte=start_date,
                status__in=['confirmed', 'completed']
            )
        
        # Group by month
        monthly_data = {}
        for booking in bookings:
            month_key = booking.start_date.strftime('%Y-%m')
            if month_key not in monthly_data:
                monthly_data[month_key] = {'bookings': 0, 'revenue': 0}
            monthly_data[month_key]['bookings'] += 1
            monthly_data[month_key]['revenue'] += float(booking.total_price)
        
        return {
            'monthly_data': monthly_data,
            'total_bookings': bookings.count(),
            'total_revenue': float(bookings.aggregate(total=Sum('total_price'))['total'] or 0),
            'average_monthly_bookings': bookings.count() / (days / 30) if days > 0 else 0,
        }

