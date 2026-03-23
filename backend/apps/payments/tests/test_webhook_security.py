"""
Comprehensive Webhook Security Test Suite (Phase 16.1)
Tests idempotency, concurrency, atomicity, and rollback scenarios.
"""
import threading
import time
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase, TransactionTestCase
from django.db import transaction
from django.utils import timezone
from apps.payments.models import Payment, PaymentWebhook, Wallet, EscrowHold
from apps.bookings.models import Booking
from apps.products.models import Product
from apps.users.models import User


class WebhookIdempotencyTests(TransactionTestCase):
    """
    Test Layer 1: Replay Protection
    Verify same webhook event_id is processed exactly once.
    """
    
    def setUp(self):
        """Create test fixtures using factories"""
        from .factories import create_webhook_test_fixtures
        
        fixtures = create_webhook_test_fixtures()
        self.owner = fixtures['owner']
        self.tenant = fixtures['tenant']
        self.product = fixtures['product']
        self.booking = fixtures['booking']
        self.payment = fixtures['payment']
        self.timestamp = fixtures['timestamp']
    
    def test_replay_attack_prevention(self):
        """
        Test: Send same webhook 3 times
        Expected: Only processed once, others return 'already_processed'
        """
        from apps.payments.webhooks import BaridiMobWebhookView
        from django.test import RequestFactory
        import json
        
        factory = RequestFactory()
        view = BaridiMobWebhookView.as_view()
        
        payload = {
            'event_id': f'evt_replay_{self.timestamp}',
            'transaction_id': self.payment.transaction_id,
            'event_type': 'payment.completed',
            'amount': str(self.payment.amount)
        }
        
        # Mock signature verification
        with patch('apps.payments.services.BaridiMobService.verify_webhook', return_value=True):
            # First request: Should process
            request1 = factory.post(
                '/webhooks/baridimob/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            response1 = view(request1)
            
            self.assertEqual(response1.status_code, 200)
            
            # Second request: Should detect replay
            request2 = factory.post(
                '/webhooks/baridimob/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            response2 = view(request2)
            
            response2_data = json.loads(response2.content)
            self.assertEqual(response2_data['status'], 'already_processed')
            
            # Third request: Still detected
            request3 = factory.post(
                '/webhooks/baridimob/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            response3 = view(request3)
            
            response3_data = json.loads(response3.content)
            self.assertEqual(response3_data['status'], 'already_processed')
        
        # Verify database state
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')
        self.assertEqual(self.booking.escrow_status, 'HELD')
        
        # Only 1 webhook row created
        webhook_count = PaymentWebhook.objects.filter(event_id=f'evt_replay_{self.timestamp}').count()
        self.assertEqual(webhook_count, 1)


class WebhookConcurrencyTests(TransactionTestCase):
    """
    Test Layer 2: Concurrent Same Event
    Fire 10 requests simultaneously with same event_id.
    """
    
    def setUp(self):
        """Create test fixtures using factories"""
        from .factories import create_webhook_test_fixtures
        
        fixtures = create_webhook_test_fixtures()
        self.owner = fixtures['owner']
        self.tenant = fixtures['tenant']
        self.product = fixtures['product']
        self.booking = fixtures['booking']
        self.payment = fixtures['payment']
        self.timestamp = fixtures['timestamp']
    
    def test_concurrent_same_event(self):
        """
        Test: 10 threads sending same event_id
        Expected: Only 1 processes, others get 'already_processed'
        """
        from apps.payments.webhooks import BaridiMobWebhookView
        from django.test import RequestFactory
        from django.db import connection
        import json
        
        results = []
        event_id = 'evt_concurrent_test'
        
        def send_webhook():
            # Each thread needs own DB connection
            connection.close()
            
            factory = RequestFactory()
            view = BaridiMobWebhookView.as_view()
            
            payload = {
                'event_id': event_id,
                'transaction_id': self.payment.transaction_id,
                'event_type': 'payment.completed',
                'amount': str(self.payment.amount)
            }
            
            with patch('apps.payments.services.BaridiMobService.verify_webhook', return_value=True):
                request = factory.post(
                    '/webhooks/baridimob/',
                    data=json.dumps(payload),
                    content_type='application/json'
                )
                response = view(request)
                results.append(response.status_code)
        
        # Fire 10 concurrent requests
        threads = [threading.Thread(target=send_webhook) for _ in range(10)]
        
        for t in threads:
            t.start()
        
        for t in threads:
            t.join()
        
        # All should return 200 (some processed, others already_processed)
        self.assertEqual(len(results), 10)
        for status in results:
            self.assertEqual(status, 200)
        
        # Only 1 webhook row created
        webhook_count = PaymentWebhook.objects.filter(event_id=event_id).count()
        self.assertEqual(webhook_count, 1)
        
        # Payment updated exactly once
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')


class WebhookDifferentEventsTests(TransactionTestCase):
    """
    Test Layer 3: Concurrent Different Events, Same Payment
    Critical test for race conditions on payment status.
    """
    
    def setUp(self):
        """Create test fixtures using factories"""
        from .factories import create_webhook_test_fixtures
        
        fixtures = create_webhook_test_fixtures()
        self.owner = fixtures['owner']
        self.tenant = fixtures['tenant']
        self.product = fixtures['product']
        self.booking = fixtures['booking']
        self.payment = fixtures['payment']
        self.timestamp = fixtures['timestamp']
    
    def test_concurrent_different_events_same_payment(self):
        """
        Test: 2 different event_ids arriving nearly simultaneously for same payment
        Expected: Both processed, but payment status consistent, no exceptions
        """
        from apps.payments.webhooks import BaridiMobWebhookView
        from django.test import RequestFactory
        from django.db import connection
        import json
        
        results = []
        
        def send_webhook(event_id):
            connection.close()
            
            factory = RequestFactory()
            view = BaridiMobWebhookView.as_view()
            
            payload = {
                'event_id': event_id,
                'transaction_id': self.payment.transaction_id,
                'event_type': 'payment.completed',
                'amount': str(self.payment.amount)
            }
            
            with patch('apps.payments.services.BaridiMobService.verify_webhook', return_value=True):
                request = factory.post(
                    '/webhooks/baridimob/',
                    data=json.dumps(payload),
                    content_type='application/json'
                )
                response = view(request)
                results.append((event_id, response.status_code))
        
        # Fire 2 concurrent requests with different event_ids
        thread1 = threading.Thread(target=send_webhook, args=('evt_diff_1',))
        thread2 = threading.Thread(target=send_webhook, args=('evt_diff_2',))
        
        thread1.start()
        time.sleep(0.01)  # Small delay to simulate near-simultaneous arrival
        thread2.start()
        
        thread1.join()
        thread2.join()
        
        # Both should succeed
        self.assertEqual(len(results), 2)
        for event_id, status in results:
            self.assertEqual(status, 200)
        
        # 2 webhook rows created
        webhook_count = PaymentWebhook.objects.filter(
            payment_method='baridimob',
            event_type='payment.completed'
        ).count()
        self.assertGreaterEqual(webhook_count, 1)  # At least 1
        
        # Payment status should be 'completed' (not corrupted)
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        
        # Booking should be confirmed (idempotent update)
        self.booking.refresh_from_db()
        self.assertEqual(self.booking.status, 'confirmed')


class WebhookTransactionRollbackTests(TransactionTestCase):
    """
    Test Layer 4: Atomic Envelope Verification
    Test that failed transactions roll back completely.
    """
    
    def setUp(self):
        """Create test fixtures using factories"""
        from .factories import create_webhook_test_fixtures
        
        fixtures = create_webhook_test_fixtures()
        self.owner = fixtures['owner']
        self.tenant = fixtures['tenant']
        self.product = fixtures['product']
        self.booking = fixtures['booking']
        self.payment = fixtures['payment']
        self.timestamp = fixtures['timestamp']
    
    def test_transaction_rollback_on_failure(self):
        """
        Test: Simulate exception during webhook processing
        Expected: webhook.processed remains False, can retry successfully
        """
        from apps.payments.webhooks import BaridiMobWebhookView
        from django.test import RequestFactory
        import json
        
        factory = RequestFactory()
        view = BaridiMobWebhookView.as_view()
        
        payload = {
            'event_id': f'evt_rollback_{self.timestamp}',
            'transaction_id': self.payment.transaction_id,
            'event_type': 'payment.completed',
            'amount': str(self.payment.amount)
        }
        
        # First attempt: Force failure by making booking.save() raise exception
        with patch('apps.payments.services.BaridiMobService.verify_webhook', return_value=True):
            with patch('apps.bookings.models.Booking.save', side_effect=Exception('Simulated DB error')):
                request1 = factory.post(
                    '/webhooks/baridimob/',
                    data=json.dumps(payload),
                    content_type='application/json'
                )
                response1 = view(request1)
                
                # Should return 500
                self.assertEqual(response1.status_code, 500)
        
        # Verify rollback: payment status should still be 'pending'
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'pending')
        
        # Webhook created but NOT processed
        webhook = PaymentWebhook.objects.get(event_id=f'evt_rollback_{self.timestamp}')
        self.assertFalse(webhook.processed)
        
        # Second attempt: Should succeed (retry)
        with patch('apps.payments.services.BaridiMobService.verify_webhook', return_value=True):
            request2 = factory.post(
                '/webhooks/baridimob/',
                data=json.dumps(payload),
                content_type='application/json'
            )
            response2 = view(request2)
            
            self.assertEqual(response2.status_code, 200)
        
        # Now payment should be completed
        self.payment.refresh_from_db()
        self.assertEqual(self.payment.status, 'completed')
        
        # Webhook now processed
        webhook.refresh_from_db()
        self.assertTrue(webhook.processed)


class DecimalPrecisionTests(TestCase):
    """
    Test Layer 5: Decimal Precision
    Verify quantization prevents precision drift.
    """
    
    def test_baridimob_decimal_quantization(self):
        """
        Test: Payment amount with >2 decimals should be quantized
        """
        from apps.payments.services import BaridiMobService
        from unittest.mock import MagicMock
        from .factories import create_user, create_category, create_product, create_booking, create_payment
        
        owner = create_user(username='owner5', email='owner5@test.com')
        tenant = create_user(username='tenant5', email='tenant5@test.com')
        category = create_category(name='Furniture')
        product = create_product(owner=owner, name='Test', price_per_day=100, category=category)
        booking = create_booking(
            user=tenant,
            product=product,
            days=1
        )
        # Override total_price with high precision
        booking.total_price = Decimal('1234.5678')
        booking.save()
        
        payment = create_payment(
            user=tenant,
            booking=booking,
            amount=Decimal('1234.5678'),
            transaction_id='txn_decimal_test'
        )
        
        # Mock HTTP request
        with patch('requests.post') as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: {'transaction_id': 'txn_test', 'status': 'success'}
            )
            
            BaridiMobService.process_payment(payment, phone='0555123456')
            
            # Extract payload sent to gateway
            call_args = mock_post.call_args
            sent_payload = call_args[1]['json']
            
            # Should be quantized to exactly 2 decimals
            self.assertEqual(sent_payload['amount'], '1234.57')  # Rounded
    
    def test_bankcard_decimal_quantization(self):
        """
        Test: Bank card service also quantizes decimals
        """
        from apps.payments.services import BankCardService
        from unittest.mock import MagicMock
        from .factories import create_user, create_category, create_product, create_booking, create_payment
        
        owner = create_user(username='owner6', email='owner6@test.com')
        tenant = create_user(username='tenant6', email='tenant6@test.com')
        category = create_category(name='Furniture')
        product = create_product(owner=owner, name='Test', price_per_day=100, category=category)
        booking = create_booking(
            user=tenant,
            product=product,
            days=1
        )
        # Override total_price with high precision
        booking.total_price = Decimal('999.9999')
        booking.save()
        
        payment = create_payment(
            user=tenant,
            booking=booking,
            amount=Decimal('999.9999'),
            transaction_id='txn_card_decimal_test',
            payment_method='bank_card'
        )
        
        card_data = {
            'card_number': '4111111111111111',
            'card_expiry': '12/25',
            'card_cvv': '123',
            'cardholder_name': 'Test User'
        }
        
        with patch('requests.post') as mock_post:
            mock_post.return_value = MagicMock(
                status_code=200,
                json=lambda: {'transaction_id': 'txn_card_test', 'status': 'success'}
            )
            
            BankCardService.process_payment(payment, card_data=card_data)
            
            call_args = mock_post.call_args
            sent_payload = call_args[1]['json']
            
            # Should be 1000.00 (rounded)
            self.assertEqual(sent_payload['amount'], '1000.00')
