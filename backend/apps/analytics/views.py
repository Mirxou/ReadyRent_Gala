from rest_framework import viewsets, filters, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse
from .models import AnalyticsEvent, ProductAnalytics, DailyAnalytics, UserBehavior, Forecast
from .serializers import (
    AnalyticsEventSerializer, ProductAnalyticsSerializer,
    DailyAnalyticsSerializer, UserBehaviorSerializer, ForecastSerializer
)
from .forecasting import DemandForecastingService
from datetime import datetime, date
from rest_framework import status
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from apps.users.models import User


class AnalyticsEventViewSet(viewsets.ModelViewSet):
    queryset = AnalyticsEvent.objects.all()
    serializer_class = AnalyticsEventSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['event_type', 'user']
    ordering_fields = ['timestamp']
    ordering = ['-timestamp']
    permission_classes = [IsAdminUser]


class ProductAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ProductAnalytics.objects.select_related('product')
    serializer_class = ProductAnalyticsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['product']
    ordering_fields = ['total_views', 'total_bookings', 'total_revenue', 'conversion_rate']
    ordering = ['-total_revenue']
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def top_products(self, request):
        """Get top products by various metrics"""
        metric = request.query_params.get('metric', 'revenue')  # revenue, views, bookings
        
        if metric == 'revenue':
            products = self.queryset.order_by('-total_revenue')[:10]
        elif metric == 'views':
            products = self.queryset.order_by('-total_views')[:10]
        elif metric == 'bookings':
            products = self.queryset.order_by('-total_bookings')[:10]
        else:
            products = self.queryset.order_by('-total_revenue')[:10]
        
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)


class DailyAnalyticsViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DailyAnalytics.objects.all()
    serializer_class = DailyAnalyticsSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = []
    ordering_fields = ['date']
    ordering = ['-date']
    permission_classes = [IsAdminUser]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def summary(self, request):
        """Get summary statistics"""
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        analytics = DailyAnalytics.objects.filter(
            date__gte=start_date,
            date__lte=end_date
        )
        
        summary = {
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days
            },
            'users': {
                'new_users': analytics.aggregate(Sum('new_users'))['new_users__sum'] or 0,
                'total_active': analytics.aggregate(Sum('active_users'))['active_users__sum'] or 0,
            },
            'bookings': {
                'created': analytics.aggregate(Sum('bookings_created'))['bookings_created__sum'] or 0,
                'completed': analytics.aggregate(Sum('bookings_completed'))['bookings_completed__sum'] or 0,
                'cancelled': analytics.aggregate(Sum('bookings_cancelled'))['bookings_cancelled__sum'] or 0,
            },
            'revenue': {
                'total': float(analytics.aggregate(Sum('total_revenue'))['total_revenue__sum'] or 0),
                'average': float(analytics.aggregate(Avg('average_booking_value'))['average_booking_value__avg'] or 0),
            },
            'products': {
                'views': analytics.aggregate(Sum('products_viewed'))['products_viewed__sum'] or 0,
            }
        }
        
        return Response(summary)


class UserBehaviorViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = UserBehavior.objects.select_related('user')
    serializer_class = UserBehaviorSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['user']
    ordering_fields = ['total_spent', 'total_bookings']
    ordering = ['-total_spent']
    permission_classes = [IsAdminUser]


class AdminDashboardStatsView(generics.GenericAPIView):
    """
    Get comprehensive dashboard statistics for admin panel.
    
    Returns overall statistics including:
    - Total users, products, bookings, and revenue
    - This month's statistics
    - Product status breakdown
    - Pending actions count
    - Top products by bookings
    
    **Permission Required:** Admin or Staff
    
    **Example Response:**
    ```json
    {
        "overall": {
            "users": 150,
            "products": 200,
            "bookings": 450,
            "revenue": 1250000.00
        },
        "this_month": {
            "users": 25,
            "bookings": 75,
            "revenue": 250000.00
        },
        "products": {
            "active": 180,
            "rented": 15
        },
        "pending_actions": {
            "bookings": 5
        },
        "top_products": [...]
    }
    ```
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
        last_month_end = this_month_start - timedelta(days=1)
        
        # Overall stats
        total_users = User.objects.count()
        total_products = Product.objects.count()
        total_bookings = Booking.objects.count()
        total_revenue = float(Booking.objects.filter(
            status__in=['confirmed', 'in_use', 'completed']
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0)
        
        # This month stats
        this_month_users = User.objects.filter(date_joined__gte=this_month_start).count()
        this_month_bookings = Booking.objects.filter(created_at__gte=this_month_start).count()
        this_month_revenue = float(Booking.objects.filter(
            created_at__gte=this_month_start,
            status__in=['confirmed', 'in_use', 'completed']
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0)
        
        # Active products
        active_products = Product.objects.filter(status='available').count()
        rented_products = Product.objects.filter(status='rented').count()
        
        # Pending actions
        pending_bookings = Booking.objects.filter(status='pending').count()
        
        # Top products
        top_products = Product.objects.annotate(
            booking_count=Count('bookings')
        ).order_by('-booking_count')[:5]
        
        stats = {
            'overall': {
                'users': total_users,
                'products': total_products,
                'bookings': total_bookings,
                'revenue': total_revenue,
            },
            'this_month': {
                'users': this_month_users,
                'bookings': this_month_bookings,
                'revenue': this_month_revenue,
            },
            'products': {
                'active': active_products,
                'rented': rented_products,
            },
            'pending_actions': {
                'bookings': pending_bookings,
            },
            'top_products': [
                {
                    'id': p.id,
                    'name': p.name_ar,
                    'bookings': p.booking_count
                }
                for p in top_products
            ]
        }
        
        return Response(stats)


class AdminRevenueView(generics.GenericAPIView):
    """
    Get revenue statistics with daily breakdown and status analysis.
    
    **Query Parameters:**
    - `days`: Number of days to analyze (default: 30)
    
    **Permission Required:** Admin or Staff
    
    **Example Request:**
    ```
    GET /api/analytics/admin/revenue/?days=30
    ```
    
    **Example Response:**
    ```json
    {
        "period": {
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
            "days": 30
        },
        "total_revenue": 1250000.00,
        "daily_revenue": [
            {"day": "2026-01-01", "revenue": 45000.00, "count": 15},
            ...
        ],
        "revenue_by_status": [
            {"status": "completed", "revenue": 1000000.00, "count": 200},
            ...
        ]
    }
    ```
    """
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        from apps.bookings.models import Booking
        
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Daily revenue
        daily_revenue = Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status__in=['confirmed', 'in_use', 'completed']
        ).extra(
            select={'day': 'DATE(created_at)'}
        ).values('day').annotate(
            revenue=Sum('total_price'),
            count=Count('id')
        ).order_by('day')
        
        # Revenue by status
        revenue_by_status = Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date
        ).values('status').annotate(
            revenue=Sum('total_price'),
            count=Count('id')
        )
        
        total_revenue = float(Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status__in=['confirmed', 'in_use', 'completed']
        ).aggregate(Sum('total_price'))['total_price__sum'] or 0)
        
        return Response({
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days
            },
            'total_revenue': total_revenue,
            'daily_revenue': list(daily_revenue),
            'revenue_by_status': list(revenue_by_status),
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAdminUser])
    def export_csv(self, request):
        """Export revenue data as CSV"""
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        from apps.bookings.models import Booking
        
        bookings = Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status__in=['confirmed', 'in_use', 'completed']
        ).select_related('user', 'product').order_by('-created_at')
        
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="revenue_report_{start_date}_to_{end_date}.csv"'
        
        # Add BOM for UTF-8 to ensure proper Excel display
        response.write('\ufeff')
        
        writer = csv.writer(response)
        writer.writerow(['التاريخ', 'المستخدم', 'المنتج', 'الحالة', 'المبلغ', 'عدد الأيام'])
        
        for booking in bookings:
            writer.writerow([
                booking.created_at.strftime('%Y-%m-%d'),
                booking.user.email,
                booking.product.name_ar or booking.product.name,
                booking.status,
                float(booking.total_price),
                booking.total_days
            ])
        
        return response


class AdminSalesReportView(generics.GenericAPIView):
    """Get comprehensive sales report"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        # Check if this is an export request
        if request.query_params.get('export') == 'true':
            return self.export(request)
        
        from apps.bookings.models import Booking
        from apps.products.models import Product, Category
        
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        # Get all completed bookings in the period
        bookings = Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status__in=['confirmed', 'in_use', 'completed']
        ).select_related('user', 'product', 'product__category')
        
        # Sales by category
        sales_by_category = bookings.values('product__category__name_ar', 'product__category__name').annotate(
            count=Count('id'),
            revenue=Sum('total_price'),
            avg_price=Avg('total_price')
        ).order_by('-revenue')
        
        # Sales by product
        sales_by_product = bookings.values(
            'product__id', 'product__name_ar', 'product__name', 'product__category__name_ar'
        ).annotate(
            count=Count('id'),
            revenue=Sum('total_price'),
            avg_price=Avg('total_price'),
            avg_days=Avg('total_days')
        ).order_by('-revenue')[:20]
        
        # Sales by day
        sales_by_day = bookings.extra(
            select={'day': 'DATE(created_at)'}
        ).values('day').annotate(
            count=Count('id'),
            revenue=Sum('total_price')
        ).order_by('day')
        
        # Sales by status
        sales_by_status = bookings.values('status').annotate(
            count=Count('id'),
            revenue=Sum('total_price')
        )
        
        # Top customers
        top_customers = bookings.values(
            'user__id', 'user__email', 'user__first_name', 'user__last_name'
        ).annotate(
            booking_count=Count('id'),
            total_spent=Sum('total_price'),
            avg_booking_value=Avg('total_price')
        ).order_by('-total_spent')[:10]
        
        # Summary statistics
        total_bookings = bookings.count()
        total_revenue = float(bookings.aggregate(Sum('total_price'))['total_price__sum'] or 0)
        avg_booking_value = float(bookings.aggregate(Avg('total_price'))['total_price__avg'] or 0)
        avg_rental_days = float(bookings.aggregate(Avg('total_days'))['total_days__avg'] or 0)
        
        report = {
            'period': {
                'start_date': start_date,
                'end_date': end_date,
                'days': days
            },
            'summary': {
                'total_bookings': total_bookings,
                'total_revenue': total_revenue,
                'avg_booking_value': avg_booking_value,
                'avg_rental_days': avg_rental_days,
            },
            'sales_by_category': list(sales_by_category),
            'sales_by_product': list(sales_by_product),
            'sales_by_day': list(sales_by_day),
            'sales_by_status': list(sales_by_status),
            'top_customers': list(top_customers),
        }
        
        return Response(report)
    
    def export(self, request):
        """Export sales report as CSV"""
        from apps.bookings.models import Booking
        
        days = int(request.query_params.get('days', 30))
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)
        
        bookings = Booking.objects.filter(
            created_at__date__gte=start_date,
            created_at__date__lte=end_date,
            status__in=['confirmed', 'in_use', 'completed']
        ).select_related('user', 'product', 'product__category').order_by('-created_at')
        
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="sales_report_{start_date}_to_{end_date}.csv"'
        
        # Add BOM for UTF-8
        response.write('\ufeff')
        
        writer = csv.writer(response)
        writer.writerow([
            'التاريخ', 'الوقت', 'المستخدم', 'البريد الإلكتروني', 'المنتج', 
            'الفئة', 'الحالة', 'تاريخ البداية', 'تاريخ النهاية', 
            'عدد الأيام', 'السعر الإجمالي'
        ])
        
        for booking in bookings:
            writer.writerow([
                booking.created_at.strftime('%Y-%m-%d'),
                booking.created_at.strftime('%H:%M:%S'),
                f"{booking.user.first_name or ''} {booking.user.last_name or ''}".strip() or booking.user.email,
                booking.user.email,
                booking.product.name_ar or booking.product.name,
                booking.product.category.name_ar if booking.product.category else '',
                booking.status,
                booking.start_date.strftime('%Y-%m-%d') if booking.start_date else '',
                booking.end_date.strftime('%Y-%m-%d') if booking.end_date else '',
                booking.total_days,
                float(booking.total_price),
            ])
        
        return response


# Forecasting Views
class ForecastListView(generics.ListAPIView):
    """List all forecasts"""
    queryset = Forecast.objects.select_related('product', 'category').all()
    serializer_class = ForecastSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['forecast_type', 'product', 'category']
    ordering_fields = ['forecast_date', 'forecast_start', 'predicted_demand', 'predicted_revenue']
    ordering = ['-forecast_date', '-forecast_start']


class ForecastDetailView(generics.RetrieveAPIView):
    """Get forecast details"""
    queryset = Forecast.objects.select_related('product', 'category').all()
    serializer_class = ForecastSerializer
    permission_classes = [IsAdminUser]


class GenerateForecastView(generics.GenericAPIView):
    """Generate forecast for products or categories"""
    permission_classes = [IsAdminUser]
    
    def post(self, request):
        """Generate forecast"""
        forecast_type = request.data.get('forecast_type', 'seasonal')
        forecast_start = request.data.get('forecast_start')
        forecast_end = request.data.get('forecast_end')
        product_id = request.data.get('product_id')
        category_id = request.data.get('category_id')
        
        if not forecast_start or not forecast_end:
            return Response(
                {'error': 'forecast_start and forecast_end are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            forecast_start = datetime.strptime(forecast_start, '%Y-%m-%d').date()
            forecast_end = datetime.strptime(forecast_end, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid date format. Use YYYY-MM-DD'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        forecasts = []
        
        if forecast_type == 'product' and product_id:
            forecast_data = DemandForecastingService.forecast_product_demand(
                product_id, forecast_start, forecast_end
            )
            product = Product.objects.get(id=product_id)
            forecast, created = Forecast.objects.update_or_create(
                product=product,
                forecast_type='product',
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
        
        elif forecast_type == 'category' and category_id:
            forecast_data = DemandForecastingService.forecast_category_demand(
                category_id, forecast_start, forecast_end
            )
            category = Category.objects.get(id=category_id)
            forecast, created = Forecast.objects.update_or_create(
                category=category,
                forecast_type='category',
                forecast_start=forecast_start,
                forecast_end=forecast_end,
                defaults={
                    'predicted_demand': forecast_data['predicted_demand'],
                    'predicted_revenue': forecast_data['predicted_revenue'],
                    'confidence_level': forecast_data['confidence_level'],
                    'forecast_data': forecast_data,
                }
            )
            forecasts.append(forecast)
        
        elif forecast_type == 'seasonal':
            forecasts = DemandForecastingService.generate_seasonal_forecast(
                forecast_start, forecast_end
            )
        
        serializer = ForecastSerializer(forecasts, many=True)
        return Response({
            'message': f'Generated {len(forecasts)} forecast(s)',
            'forecasts': serializer.data
        })


class HighDemandProductsView(generics.GenericAPIView):
    """Get products with highest predicted demand"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        forecast_start = request.query_params.get('forecast_start')
        forecast_end = request.query_params.get('forecast_end')
        limit = int(request.query_params.get('limit', 10))
        
        if not forecast_start or not forecast_end:
            forecast_start = date.today()
            forecast_end = date.today() + timedelta(days=30)
        else:
            try:
                forecast_start = datetime.strptime(forecast_start, '%Y-%m-%d').date()
                forecast_end = datetime.strptime(forecast_end, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        forecasts = DemandForecastingService.get_high_demand_products(
            forecast_start, forecast_end, limit
        )
        
        serializer = ForecastSerializer(forecasts, many=True)
        return Response(serializer.data)


class LowStockAlertsView(generics.GenericAPIView):
    """Get products that may need restocking based on forecast"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        forecast_start = request.query_params.get('forecast_start')
        forecast_end = request.query_params.get('forecast_end')
        
        if not forecast_start or not forecast_end:
            forecast_start = date.today()
            forecast_end = date.today() + timedelta(days=30)
        else:
            try:
                forecast_start = datetime.strptime(forecast_start, '%Y-%m-%d').date()
                forecast_end = datetime.strptime(forecast_end, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        alerts = DemandForecastingService.get_low_stock_alerts(
            forecast_start, forecast_end
        )
        
        return Response({
            'alerts': [
                {
                    'product_id': alert['product'].id,
                    'product_name': alert['product'].name_ar,
                    'current_stock': alert['current_stock'],
                    'predicted_demand': alert['predicted_demand'],
                    'shortage': alert['shortage'],
                }
                for alert in alerts
            ]
        })


class TrendAnalysisView(generics.GenericAPIView):
    """Analyze trends for products or categories"""
    permission_classes = [IsAdminUser]
    
    def get(self, request):
        product_id = request.query_params.get('product_id')
        category_id = request.query_params.get('category_id')
        days = int(request.query_params.get('days', 365))
        
        trends = DemandForecastingService.analyze_trends(
            product_id=int(product_id) if product_id else None,
            category_id=int(category_id) if category_id else None,
            days=days
        )
        
        return Response(trends)

