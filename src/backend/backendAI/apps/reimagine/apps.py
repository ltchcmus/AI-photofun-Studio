"""
Reimagine app configuration
"""
from django.apps import AppConfig


class ReimagineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reimagine'
    verbose_name = 'Reimagine'
