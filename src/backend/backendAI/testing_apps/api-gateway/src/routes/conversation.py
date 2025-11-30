# src/routes/conversation.py
from fastapi import APIRouter, HTTPException
import httpx
from src.config.settings import get_service_url

router = APIRouter()
CONVERSATION_URL = get_service_url("conversation")  # ví dụ http://conversation:8001

@router.post("/sessions")
async def create_session(payload: dict):
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{CONVERSATION_URL}/v1/chat/sessions", json=payload)
        if resp.status_code != 201:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()

@router.post("/sessions/{session_id}/messages")
async def send_message(session_id: str, payload: dict):
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{CONVERSATION_URL}/v1/chat/sessions/{session_id}/messages", json=payload)
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail=resp.text)
        return resp.json()

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{CONVERSATION_URL}/v1/chat/sessions/{session_id}")
        return resp.json()

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    async with httpx.AsyncClient() as client:
        resp = await client.delete(f"{CONVERSATION_URL}/v1/chat/sessions/{session_id}")
        return resp.json()
