
import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.disputes.models import Dispute, JudicialPanel, EvidenceLog
from apps.disputes.engine import TribunalEngine
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from datetime import timedelta

User = get_user_model()

@pytest.fixture
def tribunal_setup(db):
    # 1. Create User
    user = User.objects.create_user(
        username="citizen_justice",
        email="justice@gala.rent",
        password="testpassword",
        merit_score=80
    )
    
    # 2. Create Panel
    panel = JudicialPanel.objects.create(
        name="Test Review Panel",
        description="Panel for testing routing logic.",
        max_cases_per_week=10
    )
    panel.members.add(user)
    
    # 3. Create Supporting Data for Admissibility
    category = Category.objects.create(name="Tools")
    product = Product.objects.create(
        name="Drill", 
        category=category, 
        price_per_day=50,
        owner=user
    )
    booking = Booking.objects.create(
        user=user,
        product=product,
        start_date=timezone.now().date() - timedelta(days=5),
        end_date=timezone.now().date() - timedelta(days=2),
        total_price=100,
        total_days=3
    )
    
    # Create evidence to pass admissibility
    EvidenceLog.objects.create(
        action="BOOKING_COMPLETED",
        actor=user,
        booking=booking,
        metadata={"status": "finished"}
    )
    
    return {
        "user": user,
        "panel": panel,
        "booking": booking
    }

@pytest.mark.django_db
class TestTribunalEngine:
    """Tests for the Phase 32 Tribunal Core."""

    def test_engine_creates_real_dispute(self, tribunal_setup):
        user = tribunal_setup["user"]
        booking = tribunal_setup["booking"]
        
        request_data = {
            "title": "Broken Drill Bit",
            "description": "The item was returned with a broken bit.",
            "priority": "high",
            "booking_id": booking.id
        }
        
        response = TribunalEngine.process_initiation(
            user=user,
            merit_score=user.merit_score,
            emotional_state="calm",
            request_data=request_data
        )
        
        # Verify response structure
        assert response["status"] == "sovereign_proceeding"
        assert "dispute_id" in response
        
        # Verify database insertion
        dispute = Dispute.objects.get(id=response["dispute_id"])
        assert dispute.title == "Broken Drill Bit"
        assert dispute.status == "admissible" # Passed gate due to evidence
        assert dispute.assigned_to is not None # Routed to panel leader
        
    def test_engine_handles_inadmissibility(self, tribunal_setup):
        user = tribunal_setup["user"]
        # Create a booking with no evidence
        category = Category.objects.first()
        product = Product.objects.first()
        late_booking = Booking.objects.create(
            user=user,
            product=product,
            start_date=timezone.now().date() - timedelta(days=20),
            end_date=timezone.now().date() - timedelta(days=15), # Too old for 7-day window
            total_price=100,
            total_days=5
        )
        
        request_data = {
            "title": "Old Issue",
            "description": "Something happened weeks ago.",
            "booking_id": late_booking.id
        }
        
        # Note: We need to link the booking in the engine implementation
        # Current implementation doesn't look up booking_id yet, let's fix that during testing
        response = TribunalEngine.process_initiation(
            user=user,
            merit_score=user.merit_score,
            emotional_state="calm",
            request_data=request_data
        )
        
        # Verify response reflects conditional/inadmissible status
        assert response["status"] == "sovereign_conditional"
        assert "reason" in response
        
        # Verify database insertion
        dispute = Dispute.objects.get(id=response["reason"].split("#")[-1].strip() if "#" in response["reason"] else Dispute.objects.latest('id').id)
        # Note: DisputeService sets status to 'inadmissible'
        assert dispute.status == "inadmissible"
        assert "Statute of Limitations Expired" in dispute.inadmissible_reason
