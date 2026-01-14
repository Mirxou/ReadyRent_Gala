from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class PackagingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.packaging'
    verbose_name = _('التغليف')

