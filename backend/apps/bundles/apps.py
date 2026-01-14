from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class BundlesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.bundles'
    verbose_name = _('الحزم')

