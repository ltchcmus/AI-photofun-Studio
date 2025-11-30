"""
AI Tasks Django App Configuration

NO DATABASE - Redis only for Celery task management
"""
from django.apps import AppConfig


class AiTasksConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_tasks'
    verbose_name = 'AI Tasks (Celery + Redis)'
