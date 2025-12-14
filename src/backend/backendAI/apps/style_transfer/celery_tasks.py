"""
Celery Tasks for Style Transfer
"""

import logging
from celery import shared_task
from .services import StyleTransferService, StyleTransferError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def style_transfer_task(self, image_url: str, reference_image: str, user_id: str, **kwargs):
    """Async task for style transfer"""
    try:
        logger.info(f"Starting style transfer task for user {user_id}")
        
        service = StyleTransferService()
        result = service.transfer_style(
            image_url=image_url,
            reference_image=reference_image,
            user_id=user_id,
            **kwargs
        )
        
        logger.info(f"Style transfer task completed: {result.get('task_id')}")
        return result
    
    except StyleTransferError as e:
        logger.error(f"Style transfer task failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)


@shared_task(bind=True, max_retries=10)
def poll_style_transfer_status_task(self, task_id: str):
    """Poll style transfer task status"""
    try:
        service = StyleTransferService()
        result = service.poll_task_status(task_id)
        
        if result.get('status') not in ['COMPLETED', 'FAILED', 'ERROR']:
            raise self.retry(countdown=3)
        
        return result
    
    except StyleTransferError as e:
        raise self.retry(exc=e, countdown=5)
