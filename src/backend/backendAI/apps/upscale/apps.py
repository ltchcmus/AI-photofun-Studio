"""
Django App Configuration for Upscale Feature
"""
from django.apps import AppConfig


class UpscaleConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.upscale'
    verbose_name = 'Image Upscale'
