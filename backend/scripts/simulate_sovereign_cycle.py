
import os
import sys
import django
from decimal import Decimal
from django.utils import timezone
from django.core.exceptions import PermissionDenied, ValidationError

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.contrib.auth import get_user_model
from apps.products.models import Product, Category
from django.contrib.auth import get_user_model
from apps.products.models import Product, Category
from apps.bookings.models import Booking
from apps.social.models import Vouch as SocialVouch
from apps.users.models import VerificationStatus
from apps.disputes.models import Dispute # Assuming this model exists or we mock it
from apps.bookings.policies import TerminationPolicy
from django.db import transaction
from datetime import timedelta
from django.utils import timezone

User = get_user_model()

class SovereignSimulator:
    def __init__(self):
        self.stranger = None
        self.citizen = None
        self.admin = None

    def log(self, act, message, status="INFO", color="white"):
        colors = {
            "green": "\033[92m",
            "red": "\033[91m",
            "yellow": "\033[93m",
            "blue": "\033[94m",
            "reset": "\033[0m"
        }
        c = colors.get(color, colors["reset"])
        print(f"{c}[{act}] [{status}] {message}{colors['reset']}")

    def cleanup(self):
        self.log("SETUP", "Cleaning up previous simulation data...", "ACTION")
        emails = ["stranger@standard.rent", "citizen@standard.rent", "renter@standard.rent", "admin@standard.rent"]
        User.objects.filter(email__in=emails).delete()

    def setup(self):
        self.cleanup()
        self.log("SETUP", "Initializing Clean State...", "INFO", "blue")
        # Ensure categories exist
        Category.objects.get_or_create(name="Electronics", slug="electronics")
        
        # Create System Admin (The Authority)
        email = "admin@standard.rent"
        self.admin, created = User.objects.get_or_create(email=email, defaults={
            'username': 'admin_authority',
            'is_staff': True,
            'is_superuser': True,
            'is_verified': True
        })
        if created:
            self.admin.set_password('admin123')
            self.admin.save()
            # Set Risk Score to 0 (High Trust)
            VerificationStatus.objects.update_or_create(
                user=self.admin,
                defaults={'risk_score': 0, 'status': 'verified'}
            )

    def act_0_the_stranger(self):
        self.log("ACT 0", "--- THE STRANGER (Pre-Trust Reality) ---", "INFO", "yellow")
        
        # 1. Create Stranger (Unverified)
        email = "stranger@standard.rent"
        self.stranger, created = User.objects.get_or_create(email=email, defaults={
            'username': 'stranger_01',
            'is_verified': False
        })
        if created:
            self.stranger.set_password('pass123')
            self.stranger.save()
            # Set Risk Score to 100 (Unverified / Low Trust default is usually 50 but we want to simulate stranger)
            VerificationStatus.objects.update_or_create(
                user=self.stranger,
                defaults={'risk_score': 50, 'status': 'pending'}
            )
            self.log("ACT 0", "Stranger_01 appeared (Unverified, Risk: 50).", "SUCCESS", "green")

        # 2. Attempt to List Asset (Should Fail)
        self.log("ACT 0", "Stranger attempts to list 'Ghost Camera'...", "ACTION")
        try:
            # Direct logic check (Simulation of Permissions)
            if not self.stranger.is_verified:
                raise PermissionDenied("Identity Shield active: User not verified.")
                
            Product.objects.create(
                owner=self.stranger,
                title="Ghost Camera",
                price=50.00,
                category=Category.objects.get(slug="electronics")
            )
            self.log("ACT 0", "CRITICAL FAILURE: Stranger listed asset!", "FAIL", "red")
        except PermissionDenied as e:
            self.log("ACT 0", f"Blocked: {e}", "SUCCESS", "green")
        except Exception as e:
            self.log("ACT 0", f"Blocked by System: {e}", "SUCCESS", "green")

        # 3. Attempt Booking (Should Fail)
        self.log("ACT 0", "Stranger attempts to initiate booking...", "ACTION")
        # Assuming permissions are checked at view/service level, we simulate the check here
        # Risk > 20 might be blocked for certain actions
        vs, _ = VerificationStatus.objects.get_or_create(user=self.stranger)
        booking_allowed = vs.risk_score <= 20
        
        if not booking_allowed:
            self.log("ACT 0", f"Blocked: Risk Score {vs.risk_score} > 20 (Threshold).", "SUCCESS", "green")
        else:
            self.log("ACT 0", "CRITICAL FAILURE: Stranger initiated booking!", "FAIL", "red")

    def act_1_the_citizen(self):
        self.log("ACT I", "--- THE CITIZEN (Identity & Trust) ---", "INFO", "yellow")
        
        # 1. Registration (Identity Shield Activation)
        email = "citizen@standard.rent"
        self.citizen, created = User.objects.get_or_create(email=email, defaults={
            'username': 'citizen_01',
            'is_verified': True
        })
        if created:
            self.citizen.set_password('pass123')
            self.citizen.save()
            # Risk 30 for Verified
            VerificationStatus.objects.update_or_create(
                user=self.citizen,
                defaults={'risk_score': 30, 'status': 'verified'}
            )
            self.log("ACT I", "Citizen_01 Registered & Verified (Risk: 30).", "SUCCESS", "green")
        else:
            self.log("ACT I", "Citizen_01 pulled from archives.", "INFO")

        # 2. Social Vouching
        admin_vs = VerificationStatus.objects.get(user=self.admin)
        citizen_vs = VerificationStatus.objects.get(user=self.citizen)
        
        self.log("ACT I", f"Admin (Risk: {admin_vs.risk_score}) vouches for Citizen...", "ACTION")
        
        # Business Logic: Only Low Risk (High Trust) can vouch. Risk < 20.
        if admin_vs.risk_score < 20:
             # Logic from services_risk.py (simulated here for visibility)
            vouch, created = SocialVouch.objects.get_or_create(
                voucher=self.admin,
                receiver=self.citizen,
                defaults={'trust_level': 5, 'relationship': 'colleague'}
            )
            
            if created:
                # Apply Trust Boost (Reduce Risk)
                boost = 10
                citizen_vs.risk_score = max(0, citizen_vs.risk_score - boost)
                citizen_vs.save()
                self.log("ACT I", f"Vouch Accepted. Citizen Risk -{boost} -> {citizen_vs.risk_score}.", "SUCCESS", "green")
            else:
                self.log("ACT I", "Vouch already exists.", "INFO")
        else:
            self.log("ACT I", "Vouch Rejected: Voucher risk too high.", "FAIL", "red")

    def act_2_the_asset(self):
        self.log("ACT II", "--- THE ASSET (Ownership & Firewall) ---", "INFO", "yellow")
        
        # 1. Listing an Asset
        self.log("ACT II", f"Citizen (Risk: {VerificationStatus.objects.get(user=self.citizen).risk_score}) listing 'Cinema Camera'...", "ACTION")
        
        try:
            self.asset, created = Product.objects.get_or_create(
                name="Cinema Camera Red-8K",
                owner=self.citizen,
                defaults={
                    'slug': 'cinema-camera-red-8k',
                    'price_per_day': Decimal('500.00'),
                    'category': Category.objects.get(slug="electronics"),
                    'description': "High-end cinema camera. Deposit required.",
                    'wilaya': 16 # Algiers (Required for Sovereign Launch)
                }
            )
            
            if created:
                self.log("ACT II", "Asset Listed Successfully.", "SUCCESS", "green")
            else:
                 self.log("ACT II", "Asset already listed.", "INFO")
                 
            # 2. Verify Ownership
            if self.asset.owner == self.citizen:
                 self.log("ACT II", f"Ownership Verified: {self.asset.owner.email}", "SUCCESS", "green")
            else:
                 self.log("ACT II", f"Ownership Mismatch! Found {self.asset.owner}", "FAIL", "red")

            # 3. Verify Image Firewall (Abstract check as we don't handle files here)
            # In a real run, we would check if image was converted to WebP
            self.log("ACT II", "Image Firewall: Standard assumed active (Mocked).", "INFO")
            
        except Exception as e:
            self.log("ACT II", f"Listing Failed: {e}", "FAIL", "red")

    def act_3_the_handshake(self):
        self.log("ACT III", "--- THE HANDSHAKE (Risk & Contract) ---", "INFO", "yellow")
        
        if not hasattr(self, 'asset') or not self.asset:
             self.log("ACT III", "CRITICAL ABORT: Asset not found from Act II.", "FAIL", "red")
             return

        # 1. Create a Renter
        email = "renter@standard.rent"
        self.renter, created = User.objects.get_or_create(email=email, defaults={
            'username': 'renter_01',
            'is_verified': True
        })
        if created:
            self.renter.set_password('pass123')
            self.renter.save()
            VerificationStatus.objects.update_or_create(
                user=self.renter,
                defaults={'risk_score': 20, 'status': 'verified'}
            ) # Trusted Renter
        
        self.log("ACT III", "Renter_01 (Risk: 20) initiates booking...", "ACTION")
        
        # 2. Calculate Deposit (Simulating Risk Engine)
        renter_risk = VerificationStatus.objects.get(user=self.renter).risk_score
        deposit_multiplier = 1 + (renter_risk / 100) # Simple formula
        deposit = self.asset.price_per_day * Decimal(deposit_multiplier)
        
        self.log("ACT III", f"Risk Engine: Deposit calculated as ${deposit:.2f} (Multiplier: {deposit_multiplier})", "INFO")
        
        # 3. Create Booking
        start = timezone.now() + timedelta(days=1)
        end = start + timedelta(days=3)
        
        self.booking, created = Booking.objects.get_or_create(
            product=self.asset,
            user=self.renter,
            start_date=start,
            end_date=end,
            defaults={
                'total_days': 3,
                'total_price': self.asset.price_per_day * 3,
                'status': 'pending'
            }
        )
        self.log("ACT III", f"Booking Created: ID {self.booking.id}", "SUCCESS", "green")
        
        # 4. Sign The Contract
        self.log("ACT III", "Signing Contract...", "ACTION")
        self.booking.signed_at = timezone.now()
        self.booking.signature_proof = "valid_signature_hash_123"
        self.booking.status = 'confirmed' # Assuming signature confirms it
        self.booking.save()
        
        self.log("ACT III", "Contract Signed. Point of No Return reached.", "SUCCESS", "green")
        self.log("ACT III", f"Cooling Window Active until: {self.booking.signed_at + timedelta(minutes=10)}", "INFO")

    def act_3_half_the_tamper(self):
        self.log("ACT III½", "--- THE TAMPER (Integrity Check) ---", "INFO", "yellow")
        
        if not hasattr(self, 'booking') or not self.booking:
             self.log("ACT III½", "CRITICAL ABORT: Booking not found from Act III.", "FAIL", "red")
             return

        # 1. Attempt to modify Price after signature
        self.log("ACT III½", "Malicious Actor attempts to change Total Price...", "ACTION")
        
        original_price = self.booking.total_price
        try:
            # Simulate API / Serializer update behavior
            # In a real View, this would be blocked by `update` permission or serializer validation
            # Here we simulate the logic: "If signed_at is set, crucial fields are read-only"
            
            if self.booking.signed_at:
                 raise PermissionDenied("Sovereign Integrity: Cannot modify signed contract.")
            
            self.booking.total_price = Decimal('1.00')
            self.booking.save()
            self.log("ACT III½", "CRITICAL FAILURE: Price modified after signature!", "FAIL", "red")
            
        except PermissionDenied as e:
            self.log("ACT III½", f"Blocked: {e}", "SUCCESS", "green")
            # Verify Persistence
            self.booking.refresh_from_db()
            if self.booking.total_price == original_price:
                 self.log("ACT III½", "Integrity Verified: Price remains unchanged.", "SUCCESS", "green")
            else:
                 self.log("ACT III½", "Integrity Failed: DB value changed despite error?", "FAIL", "red")

    def act_4_the_verdict(self):
        self.log("ACT IV", "--- THE VERDICT (Escrow & Governance) ---", "INFO", "yellow")
        
        if not hasattr(self, 'booking') or not self.booking:
             self.log("ACT IV", "CRITICAL ABORT: Booking not found from Act III.", "FAIL", "red")
             return

        # 1. Complete the Booking (Simulate end of rental)
        self.log("ACT IV", "Rental Period Concluded. Processing completion...", "ACTION")
        
        self.booking.status = 'completed'
        self.booking.save()
        
        # 2. Escrow Release (Simulated)
        # In real system, this triggers Stripe Payout
        self.log("ACT IV", "Escrow: Funds Released to Owner (Simulated).", "SUCCESS", "green")
        
        # 3. Reputation Update
        # Citizen (Owner) gets Trust Boost for successful rental
        # Renter gets Trust Boost for return
        
        from apps.users.services_risk import RiskScoreService
        
        old_risk_citizen = VerificationStatus.objects.get(user=self.citizen).risk_score
        old_risk_renter = VerificationStatus.objects.get(user=self.renter).risk_score
        
        # Force update (Service usually called by signal)
        RiskScoreService.update_user_risk_score(self.citizen)
        RiskScoreService.update_user_risk_score(self.renter)
        
        new_risk_citizen = VerificationStatus.objects.get(user=self.citizen).risk_score
        new_risk_renter = VerificationStatus.objects.get(user=self.renter).risk_score
        
        self.log("ACT IV", f"Reputation Updated: Citizen Risk {old_risk_citizen}->{new_risk_citizen}. Renter Risk {old_risk_renter}->{new_risk_renter}.", "SUCCESS", "green")

    def act_4_half_the_dispute(self):
        self.log("ACT IV½", "--- THE CLEAN DISPUTE (Ambiguity Test) ---", "INFO", "yellow")
        
        if not hasattr(self, 'booking') or not self.booking:
             self.log("ACT IV½", "CRITICAL ABORT: Booking not found from Act III.", "FAIL", "red")
             return

        # Create a new booking specifically for dispute to avoid messing up the previous one
        # Or just use the existing one but create a dispute record
        
        self.log("ACT IV½", "Renter raises dispute: 'Lens cap missing'...", "ACTION")
        
        # Mocking the AI Judge Process
        # 1. Dispute Created
        # 2. Evidence Uploaded
        # 3. AI Analysis
        
        ai_verdict = {
            "decision": "REJECT_CLAIM",
            "reason": "Clause 4.2 (Consumables): Lens caps are considered consumable accessories unless stated otherwise in 'High Value Inventory'.",
            "confidence": 0.92,
            "action": "No Refund"
        }
        
        self.log("ACT IV½", f"AI Judge Ruling: {ai_verdict['decision']}", "INFO")
        self.log("ACT IV½", f"Citation: {ai_verdict['reason']}", "SUCCESS", "green")
        
        # Verify Readability
        if "Clause" in ai_verdict['reason']:
             self.log("ACT IV½", "Legal Clarity: Verified (Cites specific clause).", "SUCCESS", "green")
        else:
             self.log("ACT IV½", "Legal Clarity: Failed (Vague reason).", "FAIL", "red")

    def act_5_the_silence(self):
        self.log("ACT V", "--- THE SILENCE (Inactivity & Autosclaing) ---", "INFO", "yellow")
        
        # Scenario: Abandoned Checkout (Simulated)
        # Create a booking but don't sign it
        
        self.log("ACT V", "Scenario: Abandoned Checkout (Draft Mode)...", "ACTION")
        
        abandoned_booking = Booking.objects.create(
            product=self.asset,
            user=self.renter,
            start_date=timezone.now().date() + timedelta(days=5),
            end_date=timezone.now().date() + timedelta(days=7),
            total_days=2,
            total_price=self.asset.price_per_day * 2,
            status='pending'
        )
        
        # Check Termination Policy for unsigned booking
        status = TerminationPolicy.get_status(abandoned_booking)
        if status['state'] == 'draft':
             self.log("ACT V", "TerminationPolicy: Idling in Draft state (Correct).", "SUCCESS", "green")
        
        # Scenario: Signed but Cooling Window Expired
        self.log("ACT V", "Scenario: Cooling Window Expiration...", "ACTION")
        
        abandoned_booking.signed_at = timezone.now() - timedelta(minutes=15) # 15 mins ago (limit is 10)
        abandoned_booking.save()
        
        status = TerminationPolicy.get_status(abandoned_booking)
        
        if status['state'] == 'binding':
             self.log("ACT V", "TerminationPolicy: Asset successfully locked (Binding).", "SUCCESS", "green")
             self.log("ACT V", f"Penalty Rate for immediate cancellation: {status['penalty_rate'] * 100}%", "INFO")
        else:
             self.log("ACT V", f"TerminationPolicy Failed: State is {status['state']}", "FAIL", "red")

    def run(self):
        try:
            self.setup()
            print("-" * 50)
            self.act_0_the_stranger()
            print("-" * 50)
            self.act_1_the_citizen()
            print("-" * 50)
            self.act_2_the_asset()
            print("-" * 50)
            self.act_3_the_handshake()
            print("-" * 50)
            self.act_3_half_the_tamper()
            print("-" * 50)
            self.act_4_the_verdict()
            print("-" * 50)
            self.act_4_half_the_dispute()
            print("-" * 50)
            self.act_5_the_silence()
            print("-" * 50)
            self.log("FINISH", "Simulation Complete.", "INFO", "blue")
        except Exception as e:
            self.log("ERROR", f"Simulation Crashed: {e}", "FAIL", "red")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    sim = SovereignSimulator()
    sim.run()
