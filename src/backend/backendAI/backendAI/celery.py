"""
Celery Configuration for Backend AI

Redis-only setup (no SQL database needed)
"""
import os
from celery import Celery

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backendAI.settings')

# Create Celery app
app = Celery('backendAI')

# Configure Celery with Redis
app.conf.update(
    # Redis as message broker
    broker_url='redis://localhost:6379/0',
    
    # Redis as result backend
    result_backend='redis://localhost:6379/0',
    
    # Serialization
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    
    # Timezone
    timezone='UTC',
    enable_utc=True,
    
    # Result expiration (auto cleanup after 1 hour)
    result_expires=3600,
    
    # Task routing (CPU vs GPU queues)
    task_routes={
        'apps.ai_tasks.tasks.process_image_generation': {'queue': 'gpu'},
        'apps.ai_tasks.tasks.process_face_swap': {'queue': 'gpu'},
        'apps.ai_tasks.tasks.process_background_removal': {'queue': 'cpu'},
        'apps.ai_tasks.tasks.process_object_removal': {'queue': 'cpu'},
        'apps.ai_tasks.tasks.process_style_transfer': {'queue': 'gpu'},
    },
    
    # Task execution settings
    task_acks_late=True,  # Acknowledge tasks after execution
    task_reject_on_worker_lost=True,  # Retry if worker crashes
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Disable prefetching for fair distribution
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks (memory cleanup)
)

# Auto-discover tasks from all installed apps
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    """Debug task to test Celery setup"""
    print(f'Request: {self.request!r}')
