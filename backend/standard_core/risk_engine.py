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



    @classmethod
    def evaluate(cls, user: User, asset: Asset, force_refresh_score: bool = False) -> RiskDecision:
        """
        Determines if a booking is allowed, what deposit is required, and if it can be auto-confirmed.
        """
        from .engine import SovereignEngine
        from .models import Constitution
        
        trust_high = Decimal(SovereignEngine.get_law('trust_threshold_high', "80.00"))
        trust_low = Decimal(SovereignEngine.get_law('trust_threshold_low', "30.00"))
        high_val_asset_daily = Constitution.get_solo().high_value_threshold

        # 🛡️ SOVEREIGN UNIFICATION (Phase 32): Resolved data fragmentation.
        # Now reading from the unified trust_score field on the User model.
        if hasattr(user, 'trust_score'):
            trust = Decimal(str(user.trust_score))
        else:
            # Fallback for systems not yet unified
            trust = Decimal(50)
            
        import structlog
        logger = structlog.get_logger(__name__)
        logger.info(
            "risk_engine_evaluation_start",
            user_id=getattr(user, 'id', 'unknown'),
            actual_trust=float(trust),
            is_default=(not hasattr(user, 'trust_score'))
        )
        
        price = asset.daily_price

        # 1. Critical Stop: Unverified users on High Val Assets
        if price > high_val_asset_daily and not user.is_verified:
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
        if trust >= trust_high:
            # Trusted User (Sovereign)
            decision.risk_level = "LOW"
            decision.deposit_requirement = Decimal("0.00") # Reward for trust
            
            # Tech Shock: Auto Confirm for Verified High Trust Users
            if user.is_verified:
                decision.auto_confirm = True
        
        elif trust <= trust_low:
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
        if price > high_val_asset_daily:
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
