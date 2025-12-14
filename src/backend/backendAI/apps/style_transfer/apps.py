"""
Style Transfer app configuration
"""
from django.apps import AppConfig


class StyleTransferConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.style_transfer'
    verbose_name = 'Style Transfer'
