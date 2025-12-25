import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')

app = Celery('backendAI')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Fallback configuration if settings don't have CELERY_ prefix
app.conf.update(
    broker_url=os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0'),
    result_backend=os.environ.get('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0'),
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='UTC',
    enable_utc=True,
    result_expires=3600,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=1000,
)

# Autodiscover tasks from all apps
app.autodiscover_tasks([
    'apps.conversation',
    'apps.prompt_service',
    'apps.image_service',
    'apps.intent_router',
    'apps.image_generation',
    'apps.upscale',
    'apps.remove_background',
    'apps.relight',
    'apps.style_transfer',
    'apps.reimagine',
    'apps.image_expand',
])


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
