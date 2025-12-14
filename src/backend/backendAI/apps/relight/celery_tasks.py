"""
Celery Tasks for Image Relighting
"""

import logging
from celery import shared_task
from .services import RelightService, RelightError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def relight_image_task(self, image_url: str, prompt: str, user_id: str, **kwargs):
    """Async task for image relighting"""
    try:
        logger.info(f"Starting relight task for user {user_id}")
        
        service = RelightService()
        result = service.relight_image(
            image_url=image_url,
            prompt=prompt,
            user_id=user_id,
            **kwargs
        )
        
        logger.info(f"Relight task completed: {result.get('task_id')}")
        return result
    
    except RelightError as e:
        logger.error(f"Relight task failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)
    
    except Exception as e:
        logger.error(f"Unexpected error in relight task: {str(e)}")
        raise


@shared_task(bind=True, max_retries=10)
def poll_relight_status_task(self, task_id: str):
    """Poll relight task status"""
    try:
        service = RelightService()
        result = service.poll_task_status(task_id)
        
        if result.get('status') not in ['COMPLETED', 'FAILED', 'ERROR']:
            raise self.retry(countdown=3)
        
        return result
    
    except RelightError as e:
        raise self.retry(exc=e, countdown=5)
