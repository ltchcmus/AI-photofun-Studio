"""
Intent Router
Centralized routing logic for dispatching AI feature requests
"""
from typing import Dict, Any, Callable
from celery import chain
from .constants import IntentType, INTENT_TO_APP_MAP


class IntentRouter:
    """
    Routes requests to appropriate AI feature services based on intent
    
    Usage:
        router = IntentRouter()
        task_chain = router.route(intent="image_generation", payload=data, context={"session_id": "123"})
        result = task_chain.apply_async()
    """
    
    # Mapping intent to handler methods
    INTENT_HANDLERS: Dict[str, str] = {
        IntentType.image_generation: 'route_to_image_generation',
        IntentType.UPSCALE: 'route_to_upscale',
        IntentType.REMOVE_BACKGROUND: 'route_to_remove_background',
        IntentType.RELIGHT: 'route_to_relight',
        IntentType.STYLE_TRANSFER: 'route_to_style_transfer',
        IntentType.REIMAGINE: 'route_to_reimagine',
        IntentType.IMAGE_EXPAND: 'route_to_image_expand',
        IntentType.OTHER: 'route_to_fallback',
    }
    
    @classmethod
    def route(cls, intent: str, payload: Dict[str, Any], context: Dict[str, Any]) -> Any:
        """
        Main routing method
        
        Args:
            intent: Intent type (e.g., 'image_generation', 'upscale')
            payload: Request payload with feature-specific parameters
            context: Additional context (session_id, user_id, etc.)
        
        Returns:
            Celery chain or task for execution
        """
        handler_name = cls.INTENT_HANDLERS.get(intent, 'route_to_fallback')
        handler: Callable = getattr(cls, handler_name, cls.route_to_fallback)
        return handler(payload, context)
    
    @classmethod
    def get_app_name(cls, intent: str) -> str:
        """Get Django app name for given intent"""
        return INTENT_TO_APP_MAP.get(intent, "image_generation")
    
    # ==================== INTENT HANDLERS ====================
    
    @staticmethod
    def route_to_image_generation(payload: Dict, context: Dict):
        """
        Intent: image_generation
        
        Expected payload:
        {
            "prompt": str,
            "aspect_ratio": str (optional),
            "style_reference": str (optional, image URL)
        }
        """
        # TODO: Import and chain tasks when implemented
        # from apps.image_generation.celery_tasks import generate_image_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     generate_image_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        # Placeholder
        print(f"[IntentRouter] Routing to image_generation: {payload}")
        return None
    
    @staticmethod
    def route_to_upscale(payload: Dict, context: Dict):
        """
        Intent: upscale
        
        Expected payload:
        {
            "image": str (URL or base64),
            "flavor": str (sublime, photo, photo_denoiser)
        }
        """
        # TODO: Import and chain tasks
        # from apps.upscale.celery_tasks import upscale_image_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     upscale_image_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        print(f"[IntentRouter] Routing to upscale: {payload}")
        return None
    
    @staticmethod
    def route_to_remove_background(payload: Dict, context: Dict):
        """
        Intent: remove_background
        
        Expected payload:
        {
            "image": str (URL or base64)
        }
        """
        # TODO: Import and chain tasks
        # from apps.remove_background.celery_tasks import remove_bg_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     remove_bg_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        print(f"[IntentRouter] Routing to remove_background: {payload}")
        return None
    
    @staticmethod
    def route_to_relight(payload: Dict, context: Dict):
        """
        Intent: relight
        
        Expected payload:
        {
            "prompt": str,
            "image": str (URL or base64),
            "transfer_light_from_reference_image": str (optional, image URL)
        }
        """
        # TODO: Import and chain tasks
        # from apps.relight.celery_tasks import relight_image_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     relight_image_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        print(f"[IntentRouter] Routing to relight: {payload}")
        return None
    
    @staticmethod
    def route_to_style_transfer(payload: Dict, context: Dict):
        """
        Intent: style_transfer
        
        Expected payload:
        {
            "image": str (URL or base64),
            "reference_image": str (URL or base64),
            "prompt": str (optional)
        }
        """
        # TODO: Import and chain tasks
        # from apps.style_transfer.celery_tasks import style_transfer_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     style_transfer_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        print(f"[IntentRouter] Routing to style_transfer: {payload}")
        return None
    
    @staticmethod
    def route_to_reimagine(payload: Dict, context: Dict):
        """
        Intent: reimagine
        
        Expected payload:
        {
            "image": str (URL or base64),
            "prompt": str
        }
        """
        # TODO: Import and chain tasks
        # from apps.reimagine.celery_tasks import reimagine_image_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     reimagine_image_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        print(f"[IntentRouter] Routing to reimagine: {payload}")
        return None
    
    @staticmethod
    def route_to_image_expand(payload: Dict, context: Dict):
        """
        Intent: image_expand
        
        Expected payload:
        {
            "image": str (URL or base64),
            "prompt": str
        }
        """
        # TODO: Import and chain tasks
        # from apps.image_expand.celery_tasks import expand_image_task
        # from apps.conversation.celery_tasks import finalize_conversation_task
        
        # return chain(
        #     expand_image_task.s(payload),
        #     finalize_conversation_task.s(context['session_id'])
        # )
        
        print(f"[IntentRouter] Routing to image_expand: {payload}")
        return None
    
    @staticmethod
    def route_to_fallback(payload: Dict, context: Dict):
        """
        Fallback handler for unknown or 'other' intents
        Defaults to basic image generation
        """
        print(f"[IntentRouter] Using fallback handler: {payload}")
        return IntentRouter.route_to_image_generation(payload, context)
