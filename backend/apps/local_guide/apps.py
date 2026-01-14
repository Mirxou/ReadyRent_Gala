from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class LocalGuideConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.local_guide'
    verbose_name = _('الدليل المحلي')

