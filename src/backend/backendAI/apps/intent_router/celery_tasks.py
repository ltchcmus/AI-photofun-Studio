"""
Celery tasks for Intent Router
Routes to appropriate AI features based on detected intent
"""
from celery import shared_task
from core import ResponseFormatter, ResponseCode
import logging
import time

logger = logging.getLogger(__name__)


def merge_parameters(extracted_params: dict, user_params: dict) -> dict:
    """
    Merge extracted parameters from prompt analysis with user-provided parameters.
    User parameters take priority over extracted ones.
    
    Args:
        extracted_params: Parameters extracted from natural language by Gemini
        user_params: Explicitly provided parameters from user (via feature_params)
        
    Returns:
        dict: Merged parameters with user params overriding extracted ones
    """
    merged = extracted_params.copy()
    merged.update(user_params)  # User params override extracted
    return merged


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
    Route to appropriate AI feature based on intent with full parameter support
    
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
    intent = refined_prompt_result.get('intent', 'image_generation')
    context = refined_prompt_result.get('context', {})
    prompt = refined_prompt_result.get('prompt', '')
    
    # Extract images from context
    images = context.get('images', [])
    image_url = context.get('image_url') or (images[0] if images else None)
    reference_image = context.get('reference_image') or (images[1] if len(images) > 1 else None)
    
    # PARAMETER MERGING: Combine extracted params with user params (user priority)
    extracted_params = refined_prompt_result.get('extracted_params', {})  # From Gemini analysis
    user_feature_params = context.get('feature_params', {})  # From user (explicit)
    feature_params = merge_parameters(extracted_params, user_feature_params)
    
    user_id = context.get('session_id', 'system')  # Use session_id as user_id
    
    logger.warning(f"[IntentRouter] ✓ Extracted - Intent: {intent} | Prompt: {prompt[:50]}...")
    if extracted_params:
        logger.warning(f"[IntentRouter] ✓ Extracted params (from AI): {extracted_params}")
    if user_feature_params:
        logger.warning(f"[IntentRouter] ✓ User params (explicit): {user_feature_params}")
    logger.warning(f"[IntentRouter] ✓ Final merged params: {feature_params}")
    if image_url:
        logger.warning(f"[IntentRouter] ✓ Primary image: {image_url[:100]}...")
    if reference_image:
        logger.warning(f"[IntentRouter] ✓ Reference image: {reference_image[:100]}...")
    
    try:
        # Route based on intent
        if intent == 'image_generation':
            from apps.image_generation.services import ImageGenerationService
            
            service = ImageGenerationService()
            result = service.generate_image(
                prompt=prompt,
                user_id=user_id,
                aspect_ratio=feature_params.get('aspect_ratio', 'square_1_1')
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
                        image_gallery_service.save_multiple_images(
                            user_id=user_id,
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
                    'aspect_ratio': result.get('aspect_ratio', 'square_1_1'),
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
                image_url=image_url,
                user_id=user_id,
                sharpen=feature_params.get('sharpen', 0.5),
                smart_grain=feature_params.get('smart_grain', 0.2),
                ultra_detail=feature_params.get('ultra_detail', 0.3),
                flavor=feature_params.get('flavor', 'photo'),
                scale_factor=feature_params.get('scale_factor', 2)
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            # Only poll if task is NOT already completed
            if not uploaded_urls and result.get('task_id') and result.get('status') != 'COMPLETED':
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                error_msg = "Upscale failed"
                if result.get('status') == 'COMPLETED':
                    error_msg = "Upscale completed but image upload failed (timeout or network error)"
                return wrapped_refined_prompt, ResponseFormatter.error(message=error_msg)
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'flavor': result.get('flavor', 'photo'),
                    'scale_factor': result.get('scale_factor', 2)
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
                image_url=image_url,
                user_id=user_id
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
            
        elif intent == 'reimagine':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Reimagine requires an image. Please generate or provide an image first."
                )
            
            from apps.reimagine.services import ReimagineService
            service = ReimagineService()
            
            # Reimagine uses imagination as enum: "subtle", "vivid", "wild"
            # Default is moderate behavior (use vivid as middle ground)
            imagination_value = feature_params.get('imagination', 'vivid')
            
            result = service.reimagine_image(
                image_url=image_url,
                user_id=user_id,
                prompt=prompt,
                imagination=imagination_value,
                aspect_ratio=feature_params.get('aspect_ratio', 'square_1_1')
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            # Only poll if task is NOT already completed (avoid 404 on synchronous completion)
            if not uploaded_urls and result.get('task_id') and result.get('status') != 'COMPLETED':
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                error_msg = "Reimagine failed"
                if result.get('status') == 'COMPLETED':
                    error_msg = "Reimagine completed but image upload failed (timeout or network error)"
                return wrapped_refined_prompt, ResponseFormatter.error(message=error_msg)
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'imagination': imagination_value,
                    'refined_prompt': result.get('refined_prompt', prompt)
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
                image_url=image_url,
                prompt=prompt,
                user_id=user_id,
                reference_image=reference_image,  # Optional reference image
                light_transfer_strength=feature_params.get('light_transfer_strength', 0.8),
                style=feature_params.get('style', 'standard')
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            # Only poll if task is NOT already completed
            if not uploaded_urls and result.get('task_id') and result.get('status') != 'COMPLETED':
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                error_msg = "Relight failed"
                if result.get('status') == 'COMPLETED':
                    error_msg = "Relight completed but image upload failed (timeout or network error)"
                return wrapped_refined_prompt, ResponseFormatter.error(message=error_msg)
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'reference_image': reference_image,
                    'style': feature_params.get('style', 'standard')
                }
            })
            
        elif intent == 'style_transfer':
            if not image_url:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Style transfer requires a target image. Please provide an image first."
                )
            
            if not reference_image:
                return wrapped_refined_prompt, ResponseFormatter.error(
                    message="Style transfer requires a reference image. Please provide a style reference via additional_images."
                )
            
            from apps.style_transfer.services import StyleTransferService
            service = StyleTransferService()
            result = service.transfer_style(
                image_url=image_url,
                reference_image=reference_image,
                user_id=user_id,
                style_strength=feature_params.get('style_strength', 0.75),
                structure_strength=feature_params.get('structure_strength', 0.75),
                is_portrait=feature_params.get('is_portrait', False),
                portrait_style=feature_params.get('portrait_style', 'standard')
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            # Only poll if task is NOT already completed
            if not uploaded_urls and result.get('task_id') and result.get('status') != 'COMPLETED':
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                error_msg = "Style transfer failed"
                if result.get('status') == 'COMPLETED':
                    error_msg = "Style transfer completed but image upload failed (timeout or network error)"
                return wrapped_refined_prompt, ResponseFormatter.error(message=error_msg)
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'reference_image': reference_image,
                    'style_strength': feature_params.get('style_strength', 0.75),
                    'structure_strength': feature_params.get('structure_strength', 0.75)
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
                image_url=image_url,
                user_id=user_id,
                prompt=prompt,
                left=feature_params.get('left', 0),
                right=feature_params.get('right', 0),
                top=feature_params.get('top', 0),
                bottom=feature_params.get('bottom', 0)
            )
            
            uploaded_urls = result.get('uploaded_urls', [])
            # Only poll if task is NOT already completed
            if not uploaded_urls and result.get('task_id') and result.get('status') != 'COMPLETED':
                poll_result = poll_for_completion(service, result['task_id'])
                uploaded_urls = poll_result.get('uploaded_urls', [])
            
            if not uploaded_urls:
                error_msg = "Image expand failed"
                if result.get('status') == 'COMPLETED':
                    error_msg = "Image expand completed but image upload failed (timeout or network error)"
                return wrapped_refined_prompt, ResponseFormatter.error(message=error_msg)
            
            return wrapped_refined_prompt, ResponseFormatter.success(result={
                'uploaded_urls': uploaded_urls,
                'metadata': {
                    'intent': intent,
                    'original_image': image_url,
                    'left': feature_params.get('left', 0),
                    'right': feature_params.get('right', 0),
                    'top': feature_params.get('top', 0),
                    'bottom': feature_params.get('bottom', 0)
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
