from celery import shared_task
from datetime import datetime
from pymongo import ReturnDocument
from .models import get_conversations_collection
from core import ResponseFormatter
from core import ResponseCode


@shared_task(name="conversation.finalize_conversation_task")
def finalize_conversation_task(result_tuple, session_id: str, message_id: str) -> dict:
    """Persist final results of prompt+image pipeline into the conversation.
    Stores refined_prompt and image_url (if present) with status DONE.
    """
    from .service import add_message, update_message_by_message_id

    refined_prompt_data, generated_image_data = result_tuple

    if refined_prompt_data.get("code") == ResponseCode.ERROR or generated_image_data.get("code") == ResponseCode.ERROR:
        message = {
            "role": "system",
            "status": "ERROR",
            "created_at": datetime.utcnow(),
        }
        return {"ok": False, "error": "Pipeline failed"}
    else:
        # Extract refined prompt info
        refined = refined_prompt_data.get("result", {})
        
        # Extract image info
        image_result = generated_image_data.get("result", {})
        
        # Debug logging
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"[Finalize] refined keys: {refined.keys() if refined else 'None'}")
        logger.warning(f"[Finalize] image_result keys: {image_result.keys() if image_result else 'None'}")
        
        # Build new structure
        message = {
            "role": "system",
            "status": "DONE",
            "created_at": datetime.utcnow(),
        }
        
        # Add refined_prompt object (always add if refined data exists)
        if refined:
            message["refined_prompt"] = {
                "prompt": refined.get("prompt", ""),
                "intent": refined.get("intent", ""),
                "metadata": refined.get("metadata", {})
            }
        
        # Add image object (if available)
        if image_result.get("uploaded_urls"):
            urls = image_result.get("uploaded_urls", [])
            message["image"] = {
                "image_url": urls[0] if urls else None,
                "metadata": image_result.get("metadata", {})
            }

    update_message_by_message_id(session_id, message_id, message)
    return {"ok": True}
