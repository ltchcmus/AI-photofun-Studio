"""
Celery Tasks for Image Upscaling
Async processing for upscale workflow
"""

import logging
from celery import shared_task
from .services import UpscaleService, UpscaleError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def upscale_image_task(
    self,
    image_url: str,
    user_id: str,
    sharpen: float = 0.5,
    smart_grain: float = 0.0,
    ultra_detail: float = 0.0,
    **kwargs
):
    """
    Async task for image upscaling
    
    Args:
        image_url: URL of image to upscale
        user_id: User identifier
        sharpen: Sharpness level
        smart_grain: Grain enhancement
        ultra_detail: Ultra detail level
        **kwargs: Additional parameters
        
    Returns:
        Task result dict
    """
    try:
        logger.info(f"Starting upscale task for user {user_id}")
        
        service = UpscaleService()
        result = service.upscale_image(
            image_url=image_url,
            user_id=user_id,
            sharpen=sharpen,
            smart_grain=smart_grain,
            ultra_detail=ultra_detail,
            **kwargs
        )
        
        logger.info(f"Upscale task completed: {result.get('task_id')}")
        return result
    
    except UpscaleError as e:
        logger.error(f"Upscale task failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)
    
    except Exception as e:
        logger.error(f"Unexpected error in upscale task: {str(e)}")
        raise


@shared_task(bind=True, max_retries=10)
def poll_upscale_status_task(self, task_id: str):
    """
    Poll upscale task status
    
    Args:
        task_id: Freepik task UUID
        
    Returns:
        Task status dict
    """
    try:
        logger.info(f"Polling upscale status for task {task_id}")
        
        service = UpscaleService()
        result = service.poll_task_status(task_id)
        
        # If not completed, retry
        if result.get('status') not in ['COMPLETED', 'FAILED', 'ERROR']:
            logger.info(f"Task {task_id} still processing, retrying...")
            raise self.retry(countdown=3)
        
        logger.info(f"Task {task_id} finished with status: {result.get('status')}")
        return result
    
    except UpscaleError as e:
        logger.error(f"Status polling failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)
    
    except Exception as e:
        logger.error(f"Unexpected error polling upscale status: {str(e)}")
        raise


@shared_task
def save_upscaled_to_gallery_task(task_id: str, user_id: str, uploaded_urls: list):
    """
    Save upscaled images to gallery
    
    Args:
        task_id: Upscale task ID
        user_id: User identifier
        uploaded_urls: List of uploaded image URLs
    """
    try:
        from apps.image_gallery.services import ImageGalleryService
        
        logger.info(f"Saving {len(uploaded_urls)} upscaled images to gallery for user {user_id}")
        
        gallery_service = ImageGalleryService()
        
        for url in uploaded_urls:
            gallery_service.save_image(
                user_id=user_id,
                image_url=url,
                source='upscale',
                metadata={
                    'task_id': task_id,
                    'feature': 'upscale'
                }
            )
        
        logger.info(f"Successfully saved upscaled images to gallery")
    
    except Exception as e:
        logger.error(f"Failed to save upscaled images to gallery: {str(e)}")
