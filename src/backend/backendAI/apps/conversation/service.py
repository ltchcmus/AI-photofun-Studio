# conversation/service.py
from .models import get_conversations_collection
from datetime import datetime
from pymongo import ReturnDocument
import httpx
import os
import uuid

PROMPT_SERVICE_URL = os.getenv("PROMPT_SERVICE_URL", "http://prompt:8002")
FREEPIK_URL = os.getenv("FREEPIK_URL", "http://freepik:8003")
MEDIA_SERVICE_URL = os.getenv("MEDIA_SERVICE_URL", "http://media:8004")


def create_or_get_session(user_id):
    now = datetime.utcnow()
    conversations = get_conversations_collection()
    session_id = str(uuid.uuid4())
    doc = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$setOnInsert": {"session_id": session_id, "messages": [], "created_at": now}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc


def add_message(session_id, message):
    message = dict(message)
    if 'created_at' not in message:
        message['created_at'] = datetime.utcnow()
    message["message_id"] = str(uuid.uuid4())

    conversations = get_conversations_collection()
    res = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$push": {"messages": message}},
        return_document=ReturnDocument.AFTER,
    )
    return message


async def process_message(session_id, message):
    """
    Xử lý intent: generateImage
    Gọi Prompt → Freepik → Media.
    intent = message.get("intent")
    user_id = message.get("user_id")
    prompt_text = message.get("prompt")
    image_id = message.get("imageId")

    # 1️⃣ Lưu message user
    add_message(session_id, message)

    async with httpx.AsyncClient(timeout=60.0) as client:
        # 2️⃣ Nếu chưa có prompt → gọi Prompt/random
        if not prompt_text:
            resp = await client.post(f"{PROMPT_SERVICE_URL}/v1/prompts/random", json={
                "topic": message.get("topic"),
                "style": message.get("style"),
                "lang": message.get("lang"),
                "imageId": image_id,
            })
            resp.raise_for_status()
            prompt_text = resp.json().get("prompt")

        # 3️⃣ Gọi Prompt/aggregate (giả định kết hợp nhiều prompt)
        resp = await client.post(f"{PROMPT_SERVICE_URL}/v1/prompts/aggregate", json={"prompts": [prompt_text]})
        resp.raise_for_status()
        aggregated_prompt = resp.json().get("aggregatedPrompt")

        # 4️⃣ Gọi Freepik generate/edit
        resp = await client.post(f"{FREEPIK_URL}/v1/image/generate", json={
            "aggregatedPrompt": aggregated_prompt,
            "imageId": image_id,
        })
        resp.raise_for_status()
        freepik_data = resp.json()
        image_url = freepik_data.get("image_url")
        prompt_used = freepik_data.get("prompt_used")

        # 5️⃣ Gọi Media service để lưu ảnh
        resp = await client.post(f"{MEDIA_SERVICE_URL}/v1/images", json={
            "userId": user_id,
            "promptUsed": prompt_used,
            "image_url": image_url,
        })
        resp.raise_for_status()
        media_data = resp.json()
        image_id_out = media_data.get("imageId_out")

    # 6️⃣ Ghi lại phản hồi vào conversation
    """
    response_message = {
        "role": "system",
        "intent": "generateImage",
        "promptUsed": "prompt_used",
        "imageId": "image_id_out",
        "created_at": datetime.utcnow(),
    }
    add_message(session_id, response_message)

    return {"imageId": "image_id_out", "promptUsed": "prompt_used"}


def get_conversation(session_id):
    conversations = get_conversations_collection()
    return conversations.find_one({"session_id": session_id})


def delete_session(session_id):
    conversations = get_conversations_collection()
    return conversations.delete_one({"session_id": session_id})
