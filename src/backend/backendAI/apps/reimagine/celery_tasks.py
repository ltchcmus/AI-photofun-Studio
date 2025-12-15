"""
Celery Tasks for Image Reimagination
"""

import logging
from celery import shared_task
from .services import ReimagineService, ReimagineError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def reimagine_image_task(self, image_url: str, user_id: str, **kwargs):
    """Async task for image reimagination"""
    try:
        logger.info(f"Starting reimagine task for user {user_id}")
        
        service = ReimagineService()
        result = service.reimagine_image(
            image_url=image_url,
            user_id=user_id,
            **kwargs
        )
        
        logger.info(f"Reimagine task completed: {result.get('task_id')}")
        return result
    
    except ReimagineError as e:
        logger.error(f"Reimagine task failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)


@shared_task(bind=True, max_retries=10)
def poll_reimagine_status_task(self, task_id: str):
    """Poll reimagine task status"""
    try:
        service = ReimagineService()
        result = service.poll_task_status(task_id)
        
        if result.get('status') not in ['COMPLETED', 'FAILED', 'ERROR']:
            raise self.retry(countdown=3)
        
        return result
    
    except ReimagineError as e:
        raise self.retry(exc=e, countdown=5)
