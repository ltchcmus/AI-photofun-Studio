# conversation/service.py
from .models import get_conversations_collection
from datetime import datetime
from pymongo import ReturnDocument


def create_or_get_session(session_id):
    # atomic upsert: create session if not exists
    now = datetime.utcnow()
    conversations = get_conversations_collection()
    doc = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$setOnInsert": {"session_id": session_id, "messages": [], "created_at": now}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return doc


def add_message(session_id, message):
    # ensure server-side timestamp
    message = dict(message)
    if 'created_at' not in message:
        message['created_at'] = datetime.utcnow()

    conversations = get_conversations_collection()
    res = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$push": {"messages": message}},
        return_document=ReturnDocument.AFTER,
    )
    return message


def get_conversation(session_id):
    conversations = get_conversations_collection()
    return conversations.find_one({"session_id": session_id})


def list_sessions(limit=50, skip=0):
    conversations = get_conversations_collection()
    cursor = conversations.find({}, {'messages': 0}).skip(skip).limit(limit)
    return list(cursor)


def edit_message(session_id, message_id, updates: dict):
    conversations = get_conversations_collection()
    updated = conversations.find_one_and_update(
        {"session_id": session_id, "messages.message_id": message_id},
        {"$set": {f"messages.$.{k}": v for k, v in updates.items()}},
        return_document=ReturnDocument.AFTER,
    )
    return updated


def delete_message(session_id, message_id):
    conversations = get_conversations_collection()
    res = conversations.find_one_and_update(
        {"session_id": session_id},
        {"$pull": {"messages": {"message_id": message_id}}},
        return_document=ReturnDocument.AFTER,
    )
    return res
