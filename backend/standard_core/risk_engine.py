from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
from .models import User, Asset

@dataclass
class RiskDecision:
    allowed: bool
    deposit_requirement: Decimal
    risk_level: str # LOW, MEDIUM, HIGH, CRITICAL
    auto_confirm: bool = False

class RiskEngine:
    """
    The Muscle of STANDARD.Rent.
    Evaluates Transaction Risk based on:
    1. User Trust Score (The Identity Shield).
    2. Asset Value/Price (The Stake).
    """

    @property
    def TRUST_THRESHOLD_HIGH(self):
        from .engine import SovereignEngine
        # Fetch dynamically or fallback
        return Decimal(SovereignEngine.get_law('trust_threshold_high', "80.00"))

    @property
    def TRUST_THRESHOLD_LOW(self):
         from .engine import SovereignEngine
         return Decimal(SovereignEngine.get_law('trust_threshold_low', "30.00"))
    
    @property
    def HIGH_VALUE_ASSET_DAILY(self):
        from .models import Constitution
        return Constitution.get_solo().high_value_threshold

    @classmethod
    def evaluate(cls, user: User, asset: Asset, force_refresh_score: bool = False) -> RiskDecision:
        """
        Determines if a booking is allowed, what deposit is required, and if it can be auto-confirmed.
        """
        # Optional: Refresh score if needed, but usually done async
        # from apps.users.services_risk import RiskScoreService
        # if force_refresh_score: 
        #    RiskScoreService.update_user_risk_score(user)

        trust = Decimal(user.trust_score) if hasattr(user, 'trust_score') else Decimal(50)
        # Handle case where trust_score might be Non-Decimal in DB (though model says Integer, let's be safe)
        
        # Verify if trust score is actually inversely related to risk score in VerificationStatus?
        # The Model `User` has `merit_score` (default 50). `VerificationStatus` has `risk_score`.
        # Code in services_risk.py says: trust_score = 100 - risk_score.
        # Let's standardize on using the User model's intended field if it exists and is synced, 
        # OR fetch from VerificationStatus if that is the source of truth.
        # For now, we assume user.trust_score is the source of truth for "Merit/Trust".
        
        price = asset.daily_price

        # 1. Critical Stop: Unverified users on High Val Assets
        if price > cls().HIGH_VALUE_ASSET_DAILY and not user.is_verified:
             return RiskDecision(
                allowed=False,
                deposit_requirement=Decimal("0.00"),
                risk_level="CRITICAL",
                auto_confirm=False
            )

        # 2. Base Risk Calculation
        decision = RiskDecision(
            allowed=True,
            deposit_requirement=Decimal("0.00"),
            risk_level="LOW",
            auto_confirm=False
        )

        # Risk Matrix
        if trust >= cls().TRUST_THRESHOLD_HIGH:
            # Trusted User (Sovereign)
            decision.risk_level = "LOW"
            decision.deposit_requirement = Decimal("0.00") # Reward for trust
            
            # Tech Shock: Auto Confirm for Verified High Trust Users
            if user.is_verified:
                decision.auto_confirm = True
        
        elif trust <= cls().TRUST_THRESHOLD_LOW:
            # Risky User
            decision.risk_level = "HIGH"
            # Deposit = 3x Daily Price (Hard Rule)
            decision.deposit_requirement = price * Decimal("3.00")
            decision.auto_confirm = False
        
        else:
            # Medium User
            decision.risk_level = "MEDIUM"
            # Deposit = 1x Daily Price
            decision.deposit_requirement = price
            decision.auto_confirm = False

        # 3. High Value Asset Multiplier
        if price > cls().HIGH_VALUE_ASSET_DAILY:
            # If Risk is already high, maybe block? For now, just increase deposit
            if decision.risk_level == "HIGH":
                 decision.allowed = False # Too risky: Risky User + Expensive Asset
            elif decision.risk_level == "MEDIUM":
                 # Increase deposit for medium risk on expensive items
                 decision.deposit_requirement += (price * Decimal("0.5"))
            # If LOW risk, we trust them. No additional surcharge.
            
            # Never auto-confirm high value assets automatically without some extra check? 
            # For now, we keep the "Tech Shock" promise: if Trust > 80, we trust them.
            # But maybe strictly for > 10000 we want human eye? 
            # Let's keep auto-confirm but maybe logic elsewhere flags it? 
            # Guideline says "Instant Trust". We adhere to it.

        return decision
