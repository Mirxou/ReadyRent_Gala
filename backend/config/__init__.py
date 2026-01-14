from .celery import app as celery_app

__all__ = ('celery_app',)

# Patch drf_spectacular early to handle gettext_lazy verbose_name
try:
    from core.spectacular_patch import *  # noqa
except ImportError:
    pass