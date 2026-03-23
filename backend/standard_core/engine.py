from django.conf import settings
from django.core.cache import cache
from .models import Constitution, User, Asset, Booking

class SovereignEngine:
    """
    The Crown Authority of STANDARD.Rent.
    Centralizes all high-level decision making.
    
    Pattern: Facade
    """
    
    @staticmethod
    def is_system_active() -> bool:
        """
        Checks if the Sovereign has halted operations.
        Uses Cache-First strategy for speed.
        """
        key = "sovereign_halt_status"
        is_halted = cache.get(key)
        
        if is_halted is None:
            config = Constitution.get_solo()
            is_halted = config.is_halted
            cache.set(key, is_halted, timeout=300) # Cache for 5 mins
            
        return not is_halted

    @staticmethod
    def get_law(law_key: str, default=None):
        """
        Retrieves a specific law/config from the Constitution.
        """
        config = Constitution.get_solo()
        if hasattr(config, law_key):
            return getattr(config, law_key)
        return config.laws.get(law_key, default)

    @staticmethod
    def evaluate_booking(user: User, asset: Asset):
        """
        Delegates to RiskEngine but wraps it in Sovereign Authority.
        """
        from .risk_engine import RiskEngine
        
        # 1. Check Constitution
        if not SovereignEngine.is_system_active():
             from .risk_engine import RiskDecision
             from decimal import Decimal
             return RiskDecision(
                 allowed=False, 
                 deposit_requirement=Decimal("0.00"), 
                 risk_level="CRITICAL", 
                 auto_confirm=False
             )
             
        # 2. Delegate
        return RiskEngine.evaluate(user, asset)

    @staticmethod
    def get_routing_policy(priority: str, category: str = None) -> str:
        """
        Determines the target Judicial Panel type based on dispute characteristics.
        """
        # Phase 2: Simple Priority-Based Routing
        # Future: Use AI model or Constitution parameters
        
        if priority == 'urgent' or priority == 'high':
            # High Priority -> High Court (or specialized)
            return 'high_court'
        
        if category == 'specialized':
            return 'specialized'
            
        return 'routine'
