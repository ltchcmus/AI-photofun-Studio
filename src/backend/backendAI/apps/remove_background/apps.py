"""
Remove Background app configuration
"""
from django.apps import AppConfig


class RemoveBackgroundConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.remove_background'
    verbose_name = 'Remove Background'
