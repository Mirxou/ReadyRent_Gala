import threading
from contextlib import contextmanager

class EscrowEngineContext:
    """
    Thread-local context tracker for Escrow Engine.
    Used to prevent direct state mutations outside the Engine.
    """
    _state = threading.local()
    
    @classmethod
    def is_active(cls):
        # Check if counter > 0
        return getattr(cls._state, 'active_count', 0) > 0
    
    @classmethod
    @contextmanager
    def activate(cls):
        # Initialize if not set
        if not hasattr(cls._state, 'active_count'):
            cls._state.active_count = 0
            
        cls._state.active_count += 1
        try:
            yield
        finally:
            cls._state.active_count -= 1
            # Safety reset if negative (shouldn't happen)
            if cls._state.active_count < 0:
                 cls._state.active_count = 0
