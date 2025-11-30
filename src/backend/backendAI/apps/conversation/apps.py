from django.apps import AppConfig


class ConversationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.conversation'
    verbose_name = 'Conversation Management'
    
    def ready(self):
        """
        Import signals or perform startup tasks here.
        """
        pass
