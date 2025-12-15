"""
Relight app configuration
"""
from django.apps import AppConfig


class RelightConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.relight'
    verbose_name = 'Relight'
