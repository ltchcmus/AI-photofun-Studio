"""
Celery Tasks for Image Expansion
"""

import logging
from celery import shared_task
from .services import ImageExpandService, ImageExpandError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def expand_image_task(self, image_url: str, user_id: str, **kwargs):
    """Async task for image expansion"""
    try:
        logger.info(f"Starting expand task for user {user_id}")
        
        service = ImageExpandService()
        result = service.expand_image(
            image_url=image_url,
            user_id=user_id,
            **kwargs
        )
        
        logger.info(f"Expand task completed: {result.get('task_id')}")
        return result
    
    except ImageExpandError as e:
        logger.error(f"Expand task failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)


@shared_task(bind=True, max_retries=10)
def poll_expand_status_task(self, task_id: str):
    """Poll expand task status"""
    try:
        service = ImageExpandService()
        result = service.poll_task_status(task_id)
        
        if result.get('status') not in ['COMPLETED', 'FAILED', 'ERROR']:
            raise self.retry(countdown=3)
        
        return result
    
    except ImageExpandError as e:
        raise self.retry(exc=e, countdown=5)
