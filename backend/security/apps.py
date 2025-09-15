from django.apps import AppConfig


class SecurityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'security'
    
    def ready(self):
        # TODO: Re-enable after fixing requests issue
        # import security.signals
        pass