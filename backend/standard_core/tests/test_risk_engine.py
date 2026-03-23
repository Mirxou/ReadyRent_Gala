from django.test import TestCase
from decimal import Decimal
from standard_core.models import User, Asset
# We expect this module to exist later
# from standard_core.risk_engine import RiskEngine, RiskDecision

class SovereignRiskTest(TestCase):
    """
    Sovereign Test Level 5: The Muscle (Risk Engine).
    Ensures that:
    1. Risk is calculated based on User Trust + Asset Value.
    2. High Value Assets trigger stricter requirements.
    3. Low Trust Users trigger Deposit requirements.
    """

    def setUp(self):
        # 1. High Trust User (Verified)
        self.good_user = User.objects.create_user(
            email="good@standard.rent",
            phone_number="+213555999999",
            is_verified=True,
            trust_score=Decimal("85.00")
        )
        
        # 2. Low Trust User (New/Unverified)
        self.risky_user = User.objects.create_user(
            email="new@standard.rent",
            phone_number="+213555888888",
            is_verified=False,
            trust_score=Decimal("10.00")
        )

        # 3. High Value Asset (Luxury Car) - Daily Price 50,000 DZD
        self.owner = User.objects.create_user(email="owner@standard.rent", phone_number="+213777000000")
        self.expensive_asset = Asset.objects.create(
            owner=self.owner,
            title="Porsche Cayenne",
            slug="porsche-01",
            vertical_type="VEHICLE",
            status="ACTIVE",
            daily_price=Decimal("50000.00")
        )

        # 4. Low Value Asset (Drill) - Daily Price 1,000 DZD
        self.cheap_asset = Asset.objects.create(
            owner=self.owner,
            title="Bosch Drill",
            slug="drill-01",
            vertical_type="EQUIPMENT",
            status="ACTIVE",
            daily_price=Decimal("1000.00")
        )

    def test_risk_evaluation_high_trust(self):
        """
        Scenario: Trusted User rents High Value Asset.
        Expected: ALLOWED, Low Deposit.
        """
        # IMPORT INSIDE TEST TO ALLOW SETUP TO SUCCEED BEFORE MODULE EXISTS
        from standard_core.risk_engine import RiskEngine
        
        decision = RiskEngine.evaluate(self.good_user, self.expensive_asset)
        
        self.assertTrue(decision.allowed)
        self.assertEqual(decision.deposit_requirement, Decimal("0.00")) # or very low
        self.assertEqual(decision.risk_level, "LOW")

    def test_risk_evaluation_low_trust(self):
        """
        Scenario: Risky User rents High Value Asset.
        Expected: BLOCKED or HIGH DEPOSIT.
        """
        from standard_core.risk_engine import RiskEngine
        
        decision = RiskEngine.evaluate(self.risky_user, self.expensive_asset)
        
        # Should be strictly guarded
        if decision.allowed:
            # If allowed, MUST have huge deposit
            self.assertTrue(decision.deposit_requirement > Decimal("0.00"))
            self.assertEqual(decision.risk_level, "HIGH")
        else:
            # Or simply blocked
            self.assertFalse(decision.allowed)

    def test_risk_evaluation_low_value_asset(self):
        """
        Scenario: Risky User rents Low Value Asset.
        Expected: ALLOWED, Moderate Deposit.
        """
        from standard_core.risk_engine import RiskEngine
        
        decision = RiskEngine.evaluate(self.risky_user, self.cheap_asset)
        
        self.assertTrue(decision.allowed)
        # Even for cheap asset, risky user is still HIGH risk fundamentally
        self.assertEqual(decision.risk_level, "HIGH")
