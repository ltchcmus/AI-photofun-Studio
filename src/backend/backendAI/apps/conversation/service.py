# conversation/service.py
from .models import get_conversations_collection
from django.utils import timezone
from pymongo import ReturnDocument
import uuid
from apps.prompt_service.celery_tasks import process_prompt_task
from apps.image_service.celery_tasks import generate_image_task
from .celery_tasks import finalize_conversation_task
from celery import chain
from core import ResponseFormatter


def create_or_get_session(user_id):
    conversations = get_conversations_collection()
    session_id = str(uuid.uuid4())
    doc = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$setOnInsert": {"session_id": session_id, "user_id": user_id, "messages": [], "created_at": timezone.now()}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc


def add_message(session_id, message):
    message = dict(message)
    if 'created_at' not in message:
        message['created_at'] = timezone.now()
    if 'message_id' not in message:
        message["message_id"] = str(uuid.uuid4())

    conversations = get_conversations_collection()
    res = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$push": {"messages": message}},
        return_document=ReturnDocument.AFTER,
    )
    return message


def update_message_by_message_id(session_id, message_id, fields: dict):
    conversations = get_conversations_collection()
    return conversations.find_one_and_update(
        {
            "session_id": session_id,
            "messages.message_id": message_id
        },
        {
            "$set": {f"messages.$.{k}": v for k, v in fields.items()}
        },
        return_document=ReturnDocument.AFTER,
    )


def process_message(session_id, message):
    """Process a user message by dispatching Celery tasks for prompt refine and image generation.
    Returns minimal status and request IDs, while storing messages with status updates.
    """
    # Store user message
    user_msg = dict(message)
    user_msg["created_at"] = timezone.now()
    user_msg["role"] = "user"
    add_message(session_id, user_msg)

    sys_message_id = str(uuid.uuid4())

    # Dispatch prompt refine task
    prompt_payload = {
        "prompt": message.get("prompt"),
    }
    # Build pipeline: refine prompt -> generate image + (optional) media upload -> persist result
    workflow = chain(
        process_prompt_task.s(prompt_payload),
        generate_image_task.s(),
        finalize_conversation_task.s(session_id=session_id, message_id=sys_message_id),
    )
    async_result = workflow.apply_async()

    # Store processing status with the pipeline id
    add_message(session_id, {
        "message_id": sys_message_id,
        "role": "system",
        "status": "PROCESSING",
        "created_at": timezone.now(),
    })

    # Return processing info to client
    result = {"status": "PROCESSING", "message_id": sys_message_id}
    return ResponseFormatter.success(result=result)


def get_conversation(session_id):
    conversations = get_conversations_collection()
    return conversations.find_one({"session_id": session_id})


def delete_session(session_id):
    conversations = get_conversations_collection()
    return conversations.delete_one({"session_id": session_id})
