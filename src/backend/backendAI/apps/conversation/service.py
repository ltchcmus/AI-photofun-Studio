# conversation/service.py
from .models import get_conversations_collection
from django.utils import timezone
from pymongo import ReturnDocument
import uuid
import logging
from apps.prompt_service.celery_tasks import process_prompt_task
from apps.image_service.celery_tasks import generate_image_task
from .celery_tasks import finalize_conversation_task
from celery import chain
from core import ResponseFormatter

logger = logging.getLogger(__name__)


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

    # Get conversation context
    convo = get_conversation(session_id)
    context_image_url = None
    
    # Priority 1: Get image from selected_messages (user reply to specific message)
    selected_message_ids = message.get('selected_messages', [])
    if selected_message_ids and convo and convo.get('messages'):
        for msg_id in selected_message_ids:
            # Find the selected message
            selected_msg = next((m for m in convo['messages'] if m.get('message_id') == msg_id), None)
            if selected_msg and selected_msg.get('image_url'):
                context_image_url = selected_msg.get('image_url')
                break
            # Also check for uploaded_urls array
            if selected_msg and selected_msg.get('uploaded_urls'):
                urls = selected_msg.get('uploaded_urls', [])
                if urls and len(urls) > 0:
                    context_image_url = urls[0]
                    break
    
    # Priority 2: Get from last message if no selected message has image
    if not context_image_url and convo and convo.get('messages'):
        # Find the last system message with image_url
        for msg in reversed(convo['messages']):
            if msg.get('role') == 'system':
                if msg.get('image_url'):
                    context_image_url = msg.get('image_url')
                    break
                # Check uploaded_urls array
                if msg.get('uploaded_urls'):
                    urls = msg.get('uploaded_urls', [])
                    if urls and len(urls) > 0:
                        context_image_url = urls[0]
                        break

    # Dispatch prompt refine task with context
    prompt_payload = {
        "prompt": message.get("prompt"),
        "context": {
            "session_id": session_id,
            "image_url": context_image_url,
            "selected_messages": selected_message_ids
        }
    }
    
    # Build pipeline: refine prompt -> route to AI feature -> persist result
    from apps.intent_router.celery_tasks import route_to_ai_feature_task
    
    logger.warning("="*80)
    logger.warning(f"[ConversationService] Building task chain for session: {session_id}")
    logger.warning(f"[ConversationService] Prompt payload: {prompt_payload}")
    logger.warning("="*80)
    
    # Create the chain and execute it properly
    workflow = (
        process_prompt_task.s(prompt_payload) |
        route_to_ai_feature_task.s() |
        finalize_conversation_task.s(session_id=session_id, message_id=sys_message_id)
    )
    
    logger.warning(f"[ConversationService] Chain created with | operator")
    async_result = workflow.apply_async()
    logger.warning(f"[ConversationService] Chain dispatched! Task ID: {async_result.id}")

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
