"""
Unit tests for DisputeRouter
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal

from apps.disputes.models import Dispute, JudicialPanel
from apps.disputes.engine import DisputeRouter
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

User = get_user_model()


class TestDisputeRouter(TestCase):
    """Test dispute routing logic"""
    
    def setUp(self):
        """Create test data"""
        # Create users
        self.user = User.objects.create_user(email="test@example.com", password="test123")
        self.admin = User.objects.create_user(email="admin@example.com", password="admin123", is_staff=True)
        
        # Create booking
        category = Category.objects.create(name="Electronics")
        product = Product.objects.create(name="Camera", category=category, owner=self.admin, price_per_day=Decimal("100.00"))
        self.booking = Booking.objects.create(
            user=self.user,
            product=product,
            total_price=Decimal("1000.00"),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=1)
        )
        
        # Create judicial panels
        self.high_court = JudicialPanel.objects.create(
            name="High Court",
            panel_type="high_court",
            capacity=10,
            current_load=2,
            is_active=True
        )
        
        self.routine_panel = JudicialPanel.objects.create(
            name="Routine Panel",
            panel_type="routine",
            capacity=20,
            current_load=5,
            is_active=True
        )
        
        self.busy_panel = JudicialPanel.objects.create(
            name="Busy Panel",
            panel_type="routine",
            capacity=10,
            current_load=9,
            is_active=True
        )
    
    def test_high_priority_routed_to_high_court(self):
        """High-priority disputes should route to High Court"""
        dispute = Dispute.objects.create(
            title="Urgent Issue",
            description="Critical problem",
            booking=self.booking,
            user=self.user,
            priority="high",
            claimed_amount=Decimal("5000.00")
        )
        
        DisputeRouter.route_dispute(dispute)
        
        dispute.refresh_from_db()
        self.assertEqual(dispute.assigned_panel, self.high_court)
    
    def test_medium_priority_routed_to_routine(self):
        """Medium-priority disputes should route to Routine Panel"""
        dispute = Dispute.objects.create(
            title="Standard Issue",
            description="Normal problem",
            booking=self.booking,
            user=self.user,
            priority="medium",
            claimed_amount=Decimal("1000.00")
        )
        
        DisputeRouter.route_dispute(dispute)
        
        dispute.refresh_from_db()
        self.assertIn(dispute.assigned_panel.panel_type, ["routine"])
    
    def test_load_balancing_selects_least_busy(self):
        """Router should select the least busy panel"""
        dispute = Dispute.objects.create(
            title="Test Issue",
            description="Test",
            booking=self.booking,
            user=self.user,
            priority="medium",
            claimed_amount=Decimal("500.00")
        )
        
        DisputeRouter.route_dispute(dispute)
        
        dispute.refresh_from_db()
        # Should select routine_panel (load=5) over busy_panel (load=9)
        self.assertEqual(dispute.assigned_panel, self.routine_panel)
    
    def test_panel_load_increments_after_assignment(self):
        """Panel load should increment after dispute assignment"""
        initial_load = self.routine_panel.current_load
        
        dispute = Dispute.objects.create(
            title="Test Issue",
            description="Test",
            booking=self.booking,
            user=self.user,
            priority="medium",
            claimed_amount=Decimal("500.00")
        )
        
        DisputeRouter.route_dispute(dispute)
        
        self.routine_panel.refresh_from_db()
        self.assertEqual(self.routine_panel.current_load, initial_load + 1)
    
    def test_no_available_panels_raises_error(self):
        """Should raise error when no panels available"""
        # Deactivate all panels
        JudicialPanel.objects.all().update(is_active=False)
        
        dispute = Dispute.objects.create(
            title="Test Issue",
            description="Test",
            booking=self.booking,
            user=self.user,
            priority="medium",
            claimed_amount=Decimal("500.00")
        )
        
        with self.assertRaises(ValueError):
            DisputeRouter.route_dispute(dispute)
