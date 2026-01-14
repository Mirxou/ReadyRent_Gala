from django.apps import AppConfig
from django.utils.translation import gettext_lazy as _


class WarrantiesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.warranties'
    verbose_name = _('الضمانات والتأمين')

