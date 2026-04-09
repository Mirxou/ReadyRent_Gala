import contextvars
from contextlib import contextmanager

# 🛡️ SOVEREIGN CONTEXT (Phase 3.6): Async-safe trust tracker
# Using ContextVars ensures that the engine activation state is strictly 
# isolated between concurrent requests/tasks, unlike threading.local.
_engine_active_var = contextvars.ContextVar('escrow_engine_active', default=0)

class EscrowEngineContext:
    """
    Async-safe context tracker for Escrow Engine.
    Used to prevent direct state mutations outside the Engine.
    """
    
    @classmethod
    def is_active(cls):
        return _engine_active_var.get() > 0
    
    @classmethod
    @contextmanager
    def activate(cls):
        token = _engine_active_var.set(_engine_active_var.get() + 1)
        try:
            yield
        finally:
            _engine_active_var.set(_engine_active_var.get() - 1)
            # Safety clamp
            if _engine_active_var.get() < 0:
                 _engine_active_var.set(0)
