import pytest
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.disputes.engine import TribunalEngine
from apps.disputes.models import Dispute, EvidenceLog, JudicialPanel
from apps.bookings.models import Booking
from apps.products.models import Product, Category
from decimal import Decimal
from datetime import date, timedelta
from unittest.mock import patch

User = get_user_model()

@pytest.fixture
def tribunal_setup(db):
    user = User.objects.create_user(username='trib_user', email='trib@example.com', password='pass')
    cat = Category.objects.create(name='Electronics', slug='elec')
    prod = Product.objects.create(name='Laptop', price_per_day=Decimal('100.00'), category=cat, slug='laptop')
    booking = Booking.objects.create(
        user=user, product=prod, start_date=date.today(), end_date=date.today(),
        total_days=1, total_price=Decimal('100.00'), status='pending'
    )
    # Create a panel for routing
    panel = JudicialPanel.objects.create(name="Primary Case Review", max_cases_per_week=10)
    panel.members.add(User.objects.create_user(username='judge1', email='j1@example.com', password='pass', role='staff'))
    
    return user, booking, panel

@pytest.mark.django_db
class TestTribunalEngineBehavior:
    """
    Sovereign 'Highest Level Protection' Audit:
    Verifying the behavioral cortical logic of the Tribunal Engine.
    """

    def test_emotional_lockout_trigger(self, tribunal_setup):
        """
        BEHAVIORAL TEST: User submits a dispute in an 'angry' emotional state.
        EXPECTATION: 2-hour judicial lock and behavioral halt.
        """
        user, booking, _ = tribunal_setup
        request_data = {'booking_id': booking.id, 'title': 'I AM FURIOUS', 'description': 'The laptop exploded!'}
        
        response = TribunalEngine.process_initiation(
            user=user,
            merit_score=50,
            emotional_state='angry',
            request_data=request_data
        )
        
        # 1. Response Validation
        assert response['status'] == 'sovereign_halt'
        assert response['code'] == 'DIGNITY_COOLING_OFF'
        
        # 2. User State Validation
        user.refresh_from_db()
        assert user.emotional_lock_until > timezone.now()
        assert user.consecutive_emotional_attempts == 1
        
        # 3. Evidence Log Audit
        log = EvidenceLog.objects.filter(actor=user, action='BEHAVIORAL_HALT').first()
        assert log is not None
        assert 'Emotional Flooding' in log.metadata['reason']

    def test_calm_initiation_pathWay(self, tribunal_setup):
        """
        BEHAVIORAL TEST: User submits a dispute in a 'calm' state.
        EXPECTATION: Successful initiation and panel routing.
        """
        user, booking, panel = tribunal_setup
        request_data = {'booking_id': booking.id, 'title': 'Hardware Issue', 'description': 'Minor scratch on screens.'}
        
        # Mocking admissibility to ensure it proceeds
        with patch('apps.disputes.services.DisputeService.evaluate_admissibility', return_value=True):
            response = TribunalEngine.process_initiation(
                user=user,
                merit_score=80, # High merit
                emotional_state='calm',
                request_data=request_data
            )
            
        # 1. Response Validation
        assert response['status'] == 'sovereign_proceeding'
        assert response['code'] == 'JUDICIAL_PROCESS_INITIATED'
        
        # 2. Database State
        dispute = Dispute.objects.get(id=response['dispute_id'])
        assert dispute.status == 'filed'
        
        # 3. Verify Routing
        panel.refresh_from_db()
        assert panel.current_load == 1
        assert dispute.assigned_to == panel.members.first()

    def test_lockout_persistence(self, tribunal_setup):
        """
        BEHAVIORAL TEST: User attempts initiation while already locked.
        EXPECTATION: Immediate halt without new dispute creation.
        """
        user, booking, _ = tribunal_setup
        user.emotional_lock_until = timezone.now() + timezone.timedelta(hours=1)
        user.save()
        
        initial_dispute_count = Dispute.objects.count()
        
        response = TribunalEngine.process_initiation(
            user=user,
            merit_score=50,
            emotional_state='calm', # Calm but locked
            request_data={'booking_id': booking.id}
        )
        
        assert response['status'] == 'sovereign_halt'
        assert response['code'] == 'DIGNITY_COOLING_OFF'
        assert Dispute.objects.count() == initial_dispute_count
