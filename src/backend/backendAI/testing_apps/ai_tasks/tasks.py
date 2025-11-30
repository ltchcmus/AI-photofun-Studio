"""
Celery Tasks for AI Processing

All tasks use Redis for result storage - NO DATABASE
"""
from celery import shared_task
from celery.utils.log import get_task_logger
import base64
from io import BytesIO

logger = get_task_logger(__name__)


@shared_task(bind=True, name='apps.ai_tasks.tasks.process_image_generation')
def process_image_generation(self, prompt, parameters=None):
    """
    Generate image from text prompt
    
    Args:
        prompt: Text description
        parameters: Optional dict with width, height, steps, etc.
    
    Returns:
        Dict with image_data (base64), prompt_used, metadata
    """
    try:
        logger.info(f"Task {self.request.id}: Generating image for prompt: {prompt}")
        
        # Update progress
        self.update_state(state='PROCESSING', meta={'progress': 10, 'message': 'Starting generation'})
        
        # 1. Refine prompt
        from apps.prompt_refinement.service import get_service as get_prompt_service
        prompt_service = get_prompt_service()
        
        self.update_state(state='PROCESSING', meta={'progress': 20, 'message': 'Refining prompt'})
        refined = prompt_service.refine_prompt(prompt)
        
        self.update_state(state='PROCESSING', meta={'progress': 40, 'message': 'Generating image'})
        
        # 2. Generate image
        from apps.image_generation.service import get_service as get_image_service
        image_service = get_image_service()
        
        params = parameters or {}
        result = image_service.generate_image(
            prompt=refined['refined_prompt'],
            negative_prompt=refined.get('negative_prompt', ''),
            width=params.get('width', 512),
            height=params.get('height', 512),
            num_inference_steps=params.get('steps', 30),
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'message': 'Encoding result'})
        
        # 3. Encode image to base64
        if result['success'] and result.get('image_bytes'):
            image_b64 = base64.b64encode(result['image_bytes']).decode('utf-8')
        else:
            raise Exception(f"Image generation failed: {result.get('error', 'Unknown error')}")
        
        logger.info(f"Task {self.request.id}: Completed successfully")
        
        return {
            'status': 'SUCCESS',
            'image_data': image_b64,
            'prompt_used': refined['refined_prompt'],
            'metadata': {
                'original_prompt': prompt,
                'refined_prompt': refined['refined_prompt'],
                'negative_prompt': refined.get('negative_prompt', ''),
                'parameters': params,
                **result.get('metadata', {})
            }
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed with error: {str(exc)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'progress': 0}
        )
        raise


@shared_task(bind=True, name='apps.ai_tasks.tasks.process_face_swap')
def process_face_swap(self, source_image_b64, target_image_b64, parameters=None):
    """
    Swap faces between two images
    
    Args:
        source_image_b64: Base64 encoded source image
        target_image_b64: Base64 encoded target image
        parameters: Optional processing parameters
    
    Returns:
        Dict with image_data (base64) and metadata
    """
    try:
        logger.info(f"Task {self.request.id}: Processing face swap")
        
        self.update_state(state='PROCESSING', meta={'progress': 10, 'message': 'Decoding images'})
        
        # Decode images
        source_bytes = base64.b64decode(source_image_b64)
        target_bytes = base64.b64decode(target_image_b64)
        
        self.update_state(state='PROCESSING', meta={'progress': 30, 'message': 'Detecting faces'})
        
        # TODO: Integrate with face_swap service
        # For now, return source image as placeholder
        from apps.face_swap.service import get_service
        service = get_service()
        
        self.update_state(state='PROCESSING', meta={'progress': 60, 'message': 'Swapping faces'})
        
        # Process face swap
        result = service.swap_faces(
            source_image=source_bytes,
            target_image=target_bytes,
            parameters=parameters or {}
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'message': 'Encoding result'})
        
        if result['success']:
            result_b64 = base64.b64encode(result['image_bytes']).decode('utf-8')
        else:
            raise Exception(f"Face swap failed: {result.get('error', 'Unknown error')}")
        
        logger.info(f"Task {self.request.id}: Completed successfully")
        
        return {
            'status': 'SUCCESS',
            'image_data': result_b64,
            'metadata': result.get('metadata', {})
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed: {str(exc)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'progress': 0}
        )
        raise


@shared_task(bind=True, name='apps.ai_tasks.tasks.process_background_removal')
def process_background_removal(self, image_b64, parameters=None):
    """
    Remove background from image
    
    Args:
        image_b64: Base64 encoded image
        parameters: Optional processing parameters
    
    Returns:
        Dict with image_data (base64) and metadata
    """
    try:
        logger.info(f"Task {self.request.id}: Removing background")
        
        self.update_state(state='PROCESSING', meta={'progress': 10, 'message': 'Decoding image'})
        
        # Decode image
        image_bytes = base64.b64decode(image_b64)
        
        self.update_state(state='PROCESSING', meta={'progress': 30, 'message': 'Processing background'})
        
        # TODO: Integrate with background_removal service
        # For now, return original image as placeholder
        from apps.background_removal.service import get_service
        service = get_service()
        
        self.update_state(state='PROCESSING', meta={'progress': 70, 'message': 'Removing background'})
        
        result = service.remove_background(
            image=image_bytes,
            parameters=parameters or {}
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'message': 'Encoding result'})
        
        if result['success']:
            result_b64 = base64.b64encode(result['image_bytes']).decode('utf-8')
        else:
            raise Exception(f"Background removal failed: {result.get('error', 'Unknown error')}")
        
        logger.info(f"Task {self.request.id}: Completed successfully")
        
        return {
            'status': 'SUCCESS',
            'image_data': result_b64,
            'metadata': result.get('metadata', {})
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed: {str(exc)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'progress': 0}
        )
        raise


@shared_task(bind=True, name='apps.ai_tasks.tasks.process_object_removal')
def process_object_removal(self, image_b64, parameters=None):
    """
    Remove objects from image
    
    Args:
        image_b64: Base64 encoded image
        parameters: Optional parameters (mask, object coordinates, etc.)
    
    Returns:
        Dict with image_data (base64) and metadata
    """
    try:
        logger.info(f"Task {self.request.id}: Removing objects")
        
        self.update_state(state='PROCESSING', meta={'progress': 10, 'message': 'Decoding image'})
        
        image_bytes = base64.b64decode(image_b64)
        
        self.update_state(state='PROCESSING', meta={'progress': 40, 'message': 'Detecting objects'})
        
        # TODO: Integrate with object_removal service
        from apps.object_removal.service import get_service
        service = get_service()
        
        self.update_state(state='PROCESSING', meta={'progress': 70, 'message': 'Removing objects'})
        
        result = service.remove_objects(
            image=image_bytes,
            parameters=parameters or {}
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'message': 'Encoding result'})
        
        if result['success']:
            result_b64 = base64.b64encode(result['image_bytes']).decode('utf-8')
        else:
            raise Exception(f"Object removal failed: {result.get('error', 'Unknown error')}")
        
        return {
            'status': 'SUCCESS',
            'image_data': result_b64,
            'metadata': result.get('metadata', {})
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed: {str(exc)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'progress': 0}
        )
        raise


@shared_task(bind=True, name='apps.ai_tasks.tasks.process_style_transfer')
def process_style_transfer(self, image_b64, parameters=None):
    """
    Apply style transfer to image
    
    Args:
        image_b64: Base64 encoded image
        parameters: Style parameters (style_name, strength, etc.)
    
    Returns:
        Dict with image_data (base64) and metadata
    """
    try:
        logger.info(f"Task {self.request.id}: Applying style transfer")
        
        self.update_state(state='PROCESSING', meta={'progress': 10, 'message': 'Decoding image'})
        
        image_bytes = base64.b64decode(image_b64)
        
        self.update_state(state='PROCESSING', meta={'progress': 40, 'message': 'Loading style'})
        
        # TODO: Integrate with style_transfer service
        from apps.style_transfer.service import get_service
        service = get_service()
        
        self.update_state(state='PROCESSING', meta={'progress': 70, 'message': 'Applying style'})
        
        result = service.transfer_style(
            image=image_bytes,
            parameters=parameters or {}
        )
        
        self.update_state(state='PROCESSING', meta={'progress': 90, 'message': 'Encoding result'})
        
        if result['success']:
            result_b64 = base64.b64encode(result['image_bytes']).decode('utf-8')
        else:
            raise Exception(f"Style transfer failed: {result.get('error', 'Unknown error')}")
        
        return {
            'status': 'SUCCESS',
            'image_data': result_b64,
            'metadata': result.get('metadata', {})
        }
        
    except Exception as exc:
        logger.error(f"Task {self.request.id}: Failed: {str(exc)}")
        self.update_state(
            state='FAILURE',
            meta={'error': str(exc), 'progress': 0}
        )
        raise
