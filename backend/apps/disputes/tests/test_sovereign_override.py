
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.disputes.models import Dispute, Judgment, EvidenceLog
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from django.utils import timezone
from datetime import timedelta

User = get_user_model()

class SovereignOverrideTest(APITestCase):
    def setUp(self):
        # Create Users
        self.admin_user = User.objects.create_superuser(
            email='admin@sovereign.law', 
            password='sovereign_pass',
            role='admin'
        )
        self.regular_user = User.objects.create_user(
            email='citizen@sovereign.law', 
            password='citizen_pass',
            role='renter'
        )
        
        # Setup Booking Infrastructure
        self.category = Category.objects.create(name="Apparel Override")
        self.product = Product.objects.create(
            name="Silk Robe Override", 
            category=self.category,
            price_per_day=100.00,
            slug="silk-robe-override-test"
        )
        self.booking = Booking.objects.create(
            user=self.regular_user,
            product=self.product,
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=3),
            total_price=300.00,
            total_days=3,
            status='completed'
        )
        
        # Create Dispute
        self.dispute = Dispute.objects.create(
            user=self.regular_user,
            booking=self.booking,
            title="Deadlocked Dispute Test",
            description="This dispute is stuck in procedural hell.",
            status='under_review'
        )
        
        self.override_url = reverse('disputes:dispute-override', kwargs={'dispute_id': self.dispute.id})

    def test_sovereign_override_success(self):
        """
        Verify that an Admin can force-resolve a dispute.
        """
        self.client.force_authenticate(user=self.admin_user)
        
        payload = {
            "verdict": "favor_owner",
            "ruling_text": "Sovereign Intervention required to restore order.",
            "awarded_amount": 300.00,
            "justification": "Procedural deadlock detected. Immediate finality required."
        }
        
        print(f"\n🧪 TESTING OVERRIDE on Dispute #{self.dispute.id}...")
        response = self.client.post(self.override_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'SOVEREIGN_OVERRIDE_EXECUTED')
        
        # Verify Dispute State
        self.dispute.refresh_from_db()
        self.assertEqual(self.dispute.status, 'judgment_final')
        self.assertIn("SOVEREIGN OVERRIDE", self.dispute.resolution)
        
        # Verify Judgment Creation
        judgment = Judgment.objects.get(dispute=self.dispute)
        self.assertEqual(judgment.status, 'final')
        self.assertEqual(judgment.verdict, 'favor_owner')
        
        # Verify Evidence Log
        log = EvidenceLog.objects.filter(action='SOVEREIGN_OVERRIDE', dispute=self.dispute).first()
        self.assertIsNotNone(log)
        self.assertEqual(log.actor, self.admin_user)
        self.assertEqual(log.metadata['justification'], payload['justification'])
        
        print("✅ OVERRIDE SUCCESS: Dispute Finalized and Logged.")

    def test_sovereign_override_permission_denied(self):
        """
        Verify that a regular user CANNOT force-resolve a dispute.
        """
        self.client.force_authenticate(user=self.regular_user)
        
        payload = {
            "verdict": "favor_tenant",
            "justification": "I want to win now."
        }
        
        response = self.client.post(self.override_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        print("✅ PERMISSION GUARD: Regular user blocked from Red Button.")

    def test_sovereign_override_missing_justification(self):
        """
        Verify that justification is MANDATORY.
        """
        self.client.force_authenticate(user=self.admin_user)
        
        payload = {
            "verdict": "favor_owner",
            "ruling_text": "Because I said so.",
            # Missing justification
        }
        
        response = self.client.post(self.override_url, payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Justification is required", str(response.data))
        print("✅ PROCEDURAL GUARD: Missing justification rejected.")
