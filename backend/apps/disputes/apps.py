from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class DisputesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.disputes'
    verbose_name = _('الخلافات')


