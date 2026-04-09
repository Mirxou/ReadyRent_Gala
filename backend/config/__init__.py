# from .celery_app import app as celery_app

__all__ = ('celery_app',)

# Patch drf_spectacular early to handle gettext_lazy verbose_name
try:
    from core.spectacular_patch import *  # noqa
except ImportError:
    pass

# Django's timezone module does not expose timedelta by default, but this codebase
# (and several legacy tests/scripts) relies on ``timezone.timedelta``.
try:
    from datetime import timedelta as _timedelta
    from django.utils import timezone as _timezone

    if not hasattr(_timezone, 'timedelta'):
        _timezone.timedelta = _timedelta  # type: ignore[attr-defined]
except Exception:
    pass
