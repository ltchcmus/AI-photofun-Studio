"""
Apps configuration for Prompt Refinement service
"""
from django.apps import AppConfig


class PromptRefinementConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.prompt_refinement"
    verbose_name = "Prompt Refinement Service"
