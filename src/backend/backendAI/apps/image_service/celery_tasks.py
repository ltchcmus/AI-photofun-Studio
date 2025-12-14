import os
import base64
import httpx
from celery import shared_task
from .services import mock_generate_base64
from core import ResponseCode
from core import ResponseFormatter
import logging

logger = logging.getLogger(__name__)


@shared_task(name="image_service.generate_image_task")
def generate_image_task(refined_prompt: dict) -> tuple:
    """
    DEPRECATED: Legacy Celery task
    
    Now conversation flow uses:
    - apps.intent_router.celery_tasks.route_to_ai_feature_task
    
    This task kept for backward compatibility only.
    Returns mock data.
    """
    logger.warning("[ImageService] Using deprecated generate_image_task - should use intent_router instead")
    
    if refined_prompt.get("code") == ResponseCode.ERROR:
        return refined_prompt, ResponseFormatter.error()

    result = mock_generate_base64(refined_prompt)
    return refined_prompt, result
