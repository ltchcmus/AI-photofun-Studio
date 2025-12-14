import os
from celery import Celery
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')
django.setup()

app = Celery('backendAI')

app.conf.update(
    broker_url='redis://localhost:6379/0',
    result_backend='redis://localhost:6379/0',
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
