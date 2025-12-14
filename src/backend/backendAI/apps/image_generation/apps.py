"""
Django App Configuration for Image Generation Feature
"""
from django.apps import AppConfig


class ImageGenerationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.image_generation'
    verbose_name = 'Image Generation'
