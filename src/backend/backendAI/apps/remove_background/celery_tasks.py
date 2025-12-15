"""
Celery Tasks for Background Removal
"""

import logging
from celery import shared_task
from .services import RemoveBackgroundService, RemoveBackgroundError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def remove_background_task(self, image_url: str, user_id: str):
    """
    Async task for background removal
    
    Note: The Freepik API is synchronous, but we can still wrap it in Celery
    for queue management and error handling
    
    Args:
        image_url: URL of image to process
        user_id: User identifier
        
    Returns:
        Result dict
    """
    try:
        logger.info(f"Starting background removal task for user {user_id}")
        
        service = RemoveBackgroundService()
        result = service.remove_background(image_url, user_id)
        
        logger.info("Background removal task completed")
        return result
    
    except RemoveBackgroundError as e:
        logger.error(f"Background removal task failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)
    
    except Exception as e:
        logger.error(f"Unexpected error in removal task: {str(e)}")
        raise


@shared_task
def save_removed_bg_to_gallery_task(user_id: str, uploaded_url: str, original_url: str):
    """
    Save background-removed image to gallery
    
    Args:
        user_id: User identifier
        uploaded_url: URL of processed image
        original_url: Original image URL
    """
    try:
        from apps.image_gallery.services import ImageGalleryService
        
        logger.info(f"Saving removed-bg image to gallery for user {user_id}")
        
        gallery_service = ImageGalleryService()
        gallery_service.save_image(
            user_id=user_id,
            image_url=uploaded_url,
            source='remove_background',
            metadata={
                'feature': 'remove_background',
                'original_url': original_url
            }
        )
        
        logger.info("Successfully saved removed-bg image to gallery")
    
    except Exception as e:
        logger.error(f"Failed to save to gallery: {str(e)}")
