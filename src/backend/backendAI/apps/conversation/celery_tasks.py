from celery import shared_task
from datetime import datetime
from pymongo import ReturnDocument
from .models import get_conversations_collection
from .service import add_message
from core import APIResponse
from core import ResponseCode


@shared_task(name="conversation.finalize_conversation_task")
def finalize_conversation_task(refined_prompt, generated_image, session_id: str) -> dict:
    """Persist final results of prompt+image pipeline into the conversation.
    Stores refined_prompt and image_url (if present) with status DONE.
    """
    if refined_prompt.get("code") == ResponseCode.ERROR 
        or generated_image.get("code") == ResponseCode.ERROR:
        message = {
            "role": "system",
            "status": "ERROR",
            "created_at": datetime.utcnow(),
        }
        return {"ok": False, "error": "Pipeline failed"}
    else:
        message = {
            "role": "system",
            "status": "DONE",
            "created_at": datetime.utcnow(),
            "refined_prompt": refined_prompt.get("result"),
            "image_url": generated_image.get("result"),
        }

    add_message(session_id, message)
    return {"ok": True}
