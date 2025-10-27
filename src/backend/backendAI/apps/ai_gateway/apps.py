from django.apps import AppConfig


class AiGatewayConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai_gateway'
    verbose_name = 'AI Gateway'
    
    def ready(self):
        """Initialize services on app startup"""
        pass
