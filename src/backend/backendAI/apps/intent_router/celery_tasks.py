"""
Celery tasks for Intent Router
Routes to appropriate AI features based on detected intent
"""
from celery import shared_task
from core import ResponseFormatter, ResponseCode
import logging
import time

logger = logging.getLogger(__name__)


def poll_for_completion(service, task_id: str, max_attempts: int = 30, delay: int = 3) -> dict:
    """
    Generic polling function for async Freepik API tasks
    
    Args:
        service: Service instance with poll_task_status() method
        task_id: Task UUID to poll
        max_attempts: Maximum polling attempts (default 30 = 90s)
        delay: Seconds between polls (default 3s)
        
    Returns:
        dict with status and uploaded_urls
    """
    logger.warning(f"[Polling] 🔄 Starting polling for task {task_id}...")
    
    for attempt in range(max_attempts):
        time.sleep(delay)
        
        status_result = service.poll_task_status(task_id)
        status = status_result.get('status')
        logger.warning(f"[Polling] Attempt {attempt+1}/{max_attempts}: status={status}")
        
        if status == 'COMPLETED':
            uploaded_urls = status_result.get('uploaded_urls', [])
            logger.warning(f"[Polling] ✓ Task completed! URLs: {len(uploaded_urls)}")
            return {'status': 'COMPLETED', 'uploaded_urls': uploaded_urls}
        elif status == 'FAILED':
            logger.error(f"[Polling] ✗ Task failed: {status_result.get('error')}")
            return {'status': 'FAILED', 'uploaded_urls': [], 'error': status_result.get('error')}
    
    logger.error(f"[Polling] ⏱️ Timeout after {max_attempts} attempts")
    return {'status': 'TIMEOUT', 'uploaded_urls': []}


@shared_task(name="intent_router.route_to_ai_feature_task", bind=True)
def route_to_ai_feature_task(self, refined_prompt_result: dict) -> tuple:
    """
    Route to appropriate AI feature based on intent
    
    Args:
        refined_prompt_result: Raw dict from prompt service with:
            { prompt: str, intent: str, metadata: dict, context: dict }
            
    Returns:
        Tuple of (wrapped_refined_prompt, feature_result_dict)
    """
    try:
        logger.warning("="*80)
        logger.warning(f"[IntentRouter] TASK CALLED! Task ID: {self.request.id}")
        logger.warning(f"[IntentRouter] Input type: {type(refined_prompt_result)}")
        logger.warning(f"[IntentRouter] Input keys: {refined_prompt_result.keys() if isinstance(refined_prompt_result, dict) else 'NOT A DICT'}")
        logger.warning(f"[IntentRouter] Full input: {refined_prompt_result}")
        logger.warning("="*80)
    except Exception as e:
        logger.error(f"[IntentRouter] CRITICAL ERROR in logging: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise
    
    # Wrap refined_prompt_result for finalize task
    wrapped_refined_prompt = ResponseFormatter.success(result=refined_prompt_result)

    # Extract intent and context from raw dict
    intent = refined_prompt_result.get('intent', 'image_generate')
    context = refined_prompt_result.get('context', {})
    prompt = refined_prompt_result.get('prompt', '')
    image_url = context.get('image_url')
    
    logger.warning(f"[IntentRouter] ✓ Extracted - Intent: {intent} | Prompt: {prompt[:50]}...")
    if image_url:
        logger.warning(f"[IntentRouter] ✓ Context image available: {image_url[:100]}...")
    else:
        logger.warning("[IntentRouter] ✗ No context image")
    
    try:
        # Route based on intent
        if intent == 'image_generate':
            from apps.image_generation.services import ImageGenerationService
            
            service = ImageGenerationService()
            result = service.generate_image(
                prompt=prompt,
                user_id='system',
                aspect_ratio='square_1_1'
            )
            
            logger.warning(f"[IntentRouter] Generation result: task_id={result.get('task_id')}, status={result.get('status')}")
            
            # Poll if task_id exists and no URLs yet
            uploaded_urls = result.get('uploaded_urls', [])
            if not uploaded_urls and result.get('task_id'):
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
                
                # Save to gallery after polling completes
                if uploaded_urls:
                    try:
                        from apps.image_gallery.services import image_gallery_service
                        session_id = context.get('session_id', 'unknown')
                        image_gallery_service.save_multiple_images(
                            user_id=session_id,
                            image_urls=uploaded_urls,
                            refined_prompt=prompt,
                            intent=intent,
                            metadata={
                                'model': result.get('model', 'realism'),
                                'aspect_ratio': result.get('aspect_ratio', 'square_1_1')
                            }
                        )
                        logger.info(f"[IntentRouter] Saved {len(uploaded_urls)} images to gallery")
                    except Exception as e:
                        logger.error(f"[IntentRouter] Failed to save to gallery: {e}")
            
            if not uploaded_urls:
                logger.error("[IntentRouter] Image generation failed - no URLs")
                return wrapped_refined_prompt, ResponseFormatter.error(message="Image generation failed")
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'model': result.get('model', 'realism'),
                    'size': result.get('aspect_ratio', 'square_1_1'),
                    'intent': intent
                }
            })
            
        elif intent == 'upscale':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Upscale requires an image. Please generate or provide an image first."
                )
            
            from apps.upscale.services import UpscaleService
            service = UpscaleService()
            result = service.upscale_image(
                input_image=image_url,
                user_id='system',
                sharpen=0.5,
                smart_grain=0.3
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            if not uploaded_urls and result.get('task_id'):
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                return wrapped_refined_prompt, ResponseFormatter.error(message="Upscale failed")
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'sharpen': 0.5,
                    'smart_grain': 0.3
                }
            })
            
        elif intent == 'remove_background':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Remove background requires an image. Please generate or provide an image first."
                )
            
            from apps.remove_background.services import RemoveBackgroundService
            service = RemoveBackgroundService()
            result = service.remove_background(
                input_image=image_url,
                user_id='system'
            )
            
            # Remove background is synchronous, returns immediately
            uploaded_url = result.get('uploaded_url')
            
            if not uploaded_url:
                return wrapped_refined_prompt, ResponseFormatter.error(message="Remove background failed")
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': [uploaded_url],
                'metadata': {
                    'intent': intent,
                    'original_image': image_url
                }
            })
            
        elif intent == 'relight':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Relight requires an image. Please generate or provide an image first."
                )
            
            from apps.relight.services import RelightService
            service = RelightService()
            result = service.relight_image(
                input_image=image_url,
                user_id='system',
                prompt=prompt,
                style='neutral'
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            if not uploaded_urls and result.get('task_id'):
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                return wrapped_refined_prompt, ResponseFormatter.error(message="Relight failed")
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'style': 'neutral'
                }
            })
            
        elif intent == 'style_transfer':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Style transfer requires images. Please provide images first."
                )
            
            # Style transfer needs reference image - not supported in conversation yet
            logger.warning("[IntentRouter] Style transfer requires reference image")
            return wrapped_refined_prompt, ResponseFormatter.error(
                message="Style transfer requires reference image. Use direct API instead."
            )
            
        elif intent == 'reimagine':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Reimagine requires an image. Please generate or provide an image first."
                )
            
            from apps.reimagine.services import ReimagineService
            service = ReimagineService()
            result = service.reimagine_image(
                input_image=image_url,
                user_id='system',
                prompt=prompt,
                imagination=0.7
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            if not uploaded_urls and result.get('task_id'):
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                return wrapped_refined_prompt, ResponseFormatter.error(message="Reimagine failed")
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'imagination': 0.7
                }
            })
            
        elif intent == 'image_expand':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Image expand requires an image. Please generate or provide an image first."
                )
            
            from apps.image_expand.services import ImageExpandService
            service = ImageExpandService()
            result = service.expand_image(
                input_image=image_url,
                user_id='system',
                prompt=prompt,
                expansion='all'
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            if not uploaded_urls and result.get('task_id'):
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                return wrapped_refined_prompt, ResponseFormatter.error(message="Image expand failed")
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'expansion': 'all'
                }
            })
            
        else:
            logger.warning(f"[IntentRouter] Unknown intent: {intent}")
            return wrapped_refined_prompt, ResponseFormatter.error(
                message=f"Unknown intent: {intent}"
            )
            
    except Exception as e:
        logger.error(f"[IntentRouter] Error routing intent '{intent}': {str(e)}", exc_info=True)
        return wrapped_refined_prompt, ResponseFormatter.error(
            message=f"Feature execution error: {str(e)}"
        )
