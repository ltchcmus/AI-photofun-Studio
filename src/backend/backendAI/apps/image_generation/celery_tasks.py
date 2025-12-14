"""
Celery Tasks for Image Generation
Async processing for image generation workflow
"""

import logging
from celery import shared_task
from .services import ImageGenerationService, ImageGenerationError

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3)
def generate_image_task(
    self,
    prompt: str,
    user_id: str,
    aspect_ratio: str = "square_1_1",
    style_reference: str = None,
    structure_reference: str = None,
    model: str = "realism",
    resolution: str = "2k",
    **kwargs
):
    """
    Async task for image generation
    
    Args:
        prompt: Text description
        user_id: User identifier
        aspect_ratio: Image aspect ratio
        style_reference: Style reference URL
        structure_reference: Structure reference URL
        model: AI model
        resolution: Output resolution
        **kwargs: Additional parameters
        
    Returns:
        Task result dict
    """
    try:
        logger.info(f"Starting image generation task for user {user_id}")
        
        service = ImageGenerationService()
        result = service.generate_image(
            prompt=prompt,
            user_id=user_id,
            aspect_ratio=aspect_ratio,
            style_reference=style_reference,
            structure_reference=structure_reference,
            model=model,
            resolution=resolution,
            **kwargs
        )
        
        logger.info(f"Image generation task completed: {result.get('task_id')}")
        return result
    
    except ImageGenerationError as e:
        logger.error(f"Image generation task failed: {str(e)}")
        # Retry on failure
        raise self.retry(exc=e, countdown=5)
    
    except Exception as e:
        logger.error(f"Unexpected error in generation task: {str(e)}")
        raise


@shared_task(bind=True, max_retries=10)
def poll_generation_status_task(self, task_id: str):
    """
    Poll Freepik task status
    
    Args:
        task_id: Freepik task UUID
        
    Returns:
        Task status dict
    """
    try:
        logger.info(f"Polling generation status for task {task_id}")
        
        service = ImageGenerationService()
        result = service.poll_task_status(task_id)
        
        # If not completed, retry
        if result.get('status') not in ['COMPLETED', 'FAILED', 'ERROR']:
            logger.info(f"Task {task_id} still processing, retrying...")
            raise self.retry(countdown=3)
        
        logger.info(f"Task {task_id} finished with status: {result.get('status')}")
        return result
    
    except ImageGenerationError as e:
        logger.error(f"Status polling failed: {str(e)}")
        raise self.retry(exc=e, countdown=5)
    
    except Exception as e:
        logger.error(f"Unexpected error polling status: {str(e)}")
        raise


@shared_task
def save_to_gallery_task(task_id: str, user_id: str, uploaded_urls: list):
    """
    Save generated images to image gallery
    
    Args:
        task_id: Generation task ID
        user_id: User identifier
        uploaded_urls: List of uploaded image URLs
    """
    try:
        from apps.image_gallery.services import ImageGalleryService
        
        logger.info(f"Saving {len(uploaded_urls)} images to gallery for user {user_id}")
        
        gallery_service = ImageGalleryService()
        
        for url in uploaded_urls:
            gallery_service.save_image(
                user_id=user_id,
                image_url=url,
                source='image_generation',
                metadata={
                    'task_id': task_id,
                    'feature': 'image_generation'
                }
            )
        
        logger.info(f"Successfully saved images to gallery")
    
    except Exception as e:
        logger.error(f"Failed to save images to gallery: {str(e)}")
        # Don't fail the entire task if gallery save fails
