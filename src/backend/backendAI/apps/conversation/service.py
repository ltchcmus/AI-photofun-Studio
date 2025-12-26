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
from core.token_client import token_client
from core.exceptions import InsufficientTokensError, TokenServiceError

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
    """Process a user message by dispatching Celery tasks for prompt refine and AI feature execution.
    
    Supports all AI features with context awareness:
    - image_generation: Generate new images from text
    - upscale: Enhance image resolution
    - remove_background: Remove image background
    - reimagine: Creative image transformation
    - relight: Change lighting conditions
    - image_expand: Extend image boundaries
    - style_transfer: Apply artistic style from reference
    
    Returns minimal status and request IDs, while storing messages with status updates.
    """
    # Extract user_id for token check
    convo = get_conversation(session_id)
    user_id = convo.get('user_id') if convo else None
    
    if not user_id:
        logger.error(f"No user_id found for session {session_id}")
        return ResponseFormatter.error(message="Session not found or invalid", status_code=400)
    
    # Check token balance (minimum 10 tokens required)
    MIN_TOKENS_REQUIRED = 10
    try:
        balance = token_client.get_user_tokens(user_id)
        if balance < MIN_TOKENS_REQUIRED:
            logger.warning(f"User {user_id} has insufficient tokens: {balance} < {MIN_TOKENS_REQUIRED}")
            return ResponseFormatter.error(
                message=f"Insufficient tokens. You have {balance} tokens, but need at least {MIN_TOKENS_REQUIRED} to process this request.",
                status_code=402  # Payment Required
            )
        logger.info(f"User {user_id} has sufficient tokens: {balance} >= {MIN_TOKENS_REQUIRED}")
    except TokenServiceError as e:
        logger.error(f"Token service error: {str(e)}")
        # Allow processing to continue if token service is down (graceful degradation)
        logger.warning("Token service unavailable, allowing request to proceed")
    
    # Store user message
    user_msg = dict(message)
    user_msg["created_at"] = timezone.now()
    user_msg["role"] = "user"
    add_message(session_id, user_msg)

    sys_message_id = str(uuid.uuid4())

    # Get conversation context
    context_images = []
    
    # Priority 1: Direct image_url from request (for quick testing with existing images)
    direct_image_url = message.get('image_url')
    if direct_image_url:
        context_images.append(direct_image_url)
    
    # Priority 2: Get images from selected_messages (user reply to specific messages)
    selected_message_ids = message.get('selected_messages', [])
    if selected_message_ids and convo and convo.get('messages'):
        for msg_id in selected_message_ids:
            # Find the selected message
            selected_msg = next((m for m in convo['messages'] if m.get('message_id') == msg_id), None)
            if selected_msg:
                # Check image_url field
                if selected_msg.get('image_url'):
                    context_images.append(selected_msg.get('image_url'))
                # Check uploaded_urls array
                elif selected_msg.get('uploaded_urls'):
                    urls = selected_msg.get('uploaded_urls', [])
                    context_images.extend(urls)
    
    # Priority 3: Add additional_images from request (for reference images)
    additional_images = message.get('additional_images', [])
    if additional_images:
        context_images.extend(additional_images)
    
    # Priority 4: Get from last message if no context images yet (fallback)
    if not context_images and convo and convo.get('messages'):
        # Find the last system message with images
        for msg in reversed(convo['messages']):
            if msg.get('role') == 'system':
                if msg.get('image_url'):
                    context_images.append(msg.get('image_url'))
                    break
                # Check uploaded_urls array
                elif msg.get('uploaded_urls'):
                    urls = msg.get('uploaded_urls', [])
                    if urls:
                        context_images.extend(urls)
                        break

    # Build context with all available information
    context = {
        "session_id": session_id,
        "images": context_images,  # List of all context images
        "image_url": context_images[0] if context_images else None,  # Primary image (backward compatible)
        "reference_image": context_images[1] if len(context_images) > 1 else None,  # Secondary image for features like style_transfer
        "selected_messages": selected_message_ids,
        "feature_params": message.get('feature_params', {})  # User-provided parameters
    }
    
    # Dispatch prompt refine task with enriched context
    prompt_payload = {
        "prompt": message.get("prompt"),
        "context": context
    }
    
    # Build pipeline: refine prompt -> detect intent -> route to AI feature -> persist result
    from apps.intent_router.celery_tasks import route_to_ai_feature_task
    
    logger.warning("="*80)
    logger.warning(f"[ConversationService] Building task chain for session: {session_id}")
    logger.warning(f"[ConversationService] Context images: {len(context_images)} image(s)")
    if context_images:
        logger.warning(f"[ConversationService] Primary image: {context_images[0][:100]}...")
        if len(context_images) > 1:
            logger.warning(f"[ConversationService] Reference image: {context_images[1][:100]}...")
    logger.warning(f"[ConversationService] Feature params: {context.get('feature_params')}")
    logger.warning("="*80)
    
    # Create the chain and execute it
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
