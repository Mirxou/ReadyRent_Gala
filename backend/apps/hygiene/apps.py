from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class HygieneConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hygiene'
    verbose_name = _('النظافة')

